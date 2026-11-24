"""Fine-tuning de NeurOST sur les 44 feuilles du Gulf Stream.

Même méthode que le notebook 03 (poids NeurOST SSH seule, BatchNorm figées, dropout actif, Adam lr = 3e-5,
loss au jour 15, on garde le meilleur point en validation). Une différence :
- la validation est mesurée tous les VAL_TOUS_LES pas, et plus seulement en fin d'époque : avec ~2 600 pas
  par époque (contre 63 sur la feuille 23 seule), le meilleur point peut arriver au milieu de la 1re époque.

Évaluation finale sur le test : RMSE globale, par feuille, et sur la feuille 23 seule (mêmes 96 exemples que le
notebook 03), pour trois modèles : NeurOST d'origine, fine-tuné feuille 23, fine-tuné toutes feuilles.

Lancer depuis la racine du projet :  python my_work/scripts/entrainer_toutes_feuilles.py > my_work/scripts/log_entrainement_toutes_feuilles.txt
"""
import copy
import json
import sys
import time

import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader, Subset

RACINE = "/home/nora/projects/NeurOST"
sys.path += [RACINE, f"{RACINE}/src", f"{RACINE}/my_work/scripts"]
from dataset_swot import SwotNadirKarinDataset
from src.simvp_model import SimVP_Model_no_skip
from src.pytorch_losses import torch_tracked_mse_interp, interpolate_values

DOSSIER = f"{RACINE}/my_work/notebooks"
SORTIE = f"{RACINE}/my_work/scripts/runs_toutes_feuilles"
POIDS_NEUROST = f"{RACINE}/input_data/model_weights/simvp_ssh_ns1000000_global_weights_epoch45"
POIDS_FEUILLE23 = "/tmp/claude-1005/-home-nora-projects-NeurOST/19a25de5-dc01-4d82-afef-1cff98f32223/scratchpad/run2/poids.pt"
LR, N_EPOQUES, BATCH, VAL_TOUS_LES = 3e-5, 4, 4, 500
J, STD_SSH = 15, 0.0986

torch.manual_seed(0)
device = "cuda"
kw = dict(npz_path=f"{DOSSIER}/exemples_GS_toutes_feuilles.npz", csv_path=f"{DOSSIER}/exemples_GS_toutes_feuilles.csv")
ds_train, ds_val, ds_test = (SwotNadirKarinDataset(jeu=j, **kw) for j in ["train", "val", "test"])
dl_train = DataLoader(ds_train, batch_size=BATCH, shuffle=True, num_workers=4)
dl_val = DataLoader(ds_val, batch_size=8, num_workers=4)
print(f"train {len(ds_train)} ex. ({len(dl_train)} pas par époque), val {len(ds_val)}, test {len(ds_test)}", flush=True)


def charger(chemin):
    sd = torch.load(chemin, map_location=device, weights_only=False)
    sd = sd.get("model_state_dict", sd)
    return {k.removeprefix("module."): v for k, v in sd.items()}


model = SimVP_Model_no_skip(in_shape=(30, 1, 128, 128), model_type="gsta",
                            hid_S=8, hid_T=128, drop=0.2, drop_path=0.15).to(device)
poids_init = charger(POIDS_NEUROST)
model.load_state_dict(poids_init)
model.eval()


def perte(pred, cible):
    return torch_tracked_mse_interp(pred[:, J:J + 1], cible[:, J:J + 1])


def erreurs_par_exemple(model, dl):
    """(somme des carrés, nombre de points) par exemple, en SSH normalisée, au jour J."""
    model.eval()
    se, n = [], []
    with torch.no_grad():
        for x, y in dl:
            x, y = x.to(device), y.to(device)
            p = model(x)
            c = y[:, J]
            reel = c[..., 2] != 0
            v = interpolate_values(p[:, J], c[..., :2])
            se.append((((v - c[..., 2]) ** 2) * reel).sum(1).cpu())
            n.append(reel.sum(1).cpu())
    return torch.cat(se).numpy(), torch.cat(n).numpy()


def rmse_cm(se, n):
    return 100 * STD_SSH * np.sqrt(se.sum() / n.sum())


def mode_entrainement(model):
    model.train()
    for m in model.modules():
        if isinstance(m, torch.nn.BatchNorm2d):
            m.eval()


rmse_avant = rmse_cm(*erreurs_par_exemple(model, dl_val))
print(f"RMSE val avant fine-tuning : {rmse_avant:.2f} cm", flush=True)

opt = torch.optim.Adam(model.parameters(), lr=LR)
historique = []
meilleure_rmse, meilleurs_poids, meilleur_pas = rmse_avant, copy.deepcopy(model.state_dict()), 0
pas, somme_loss, n_loss, t0 = 0, 0.0, 0, time.time()
for epoque in range(1, N_EPOQUES + 1):
    mode_entrainement(model)
    for x, y in dl_train:
        x, y = x.to(device), y.to(device)
        opt.zero_grad()
        loss = perte(model(x), y)
        loss.backward()
        opt.step()
        pas += 1
        somme_loss += loss.item()
        n_loss += 1
        if pas % VAL_TOUS_LES == 0:
            rmse_val = rmse_cm(*erreurs_par_exemple(model, dl_val))
            historique.append({"pas": pas, "epoque": round(pas / len(dl_train), 2),
                               "loss_train": somme_loss / n_loss, "rmse_val": rmse_val})
            if rmse_val < meilleure_rmse:
                meilleure_rmse, meilleurs_poids, meilleur_pas = rmse_val, copy.deepcopy(model.state_dict()), pas
            print(f"pas {pas:5d} (époque {pas / len(dl_train):.2f})  loss train {somme_loss / n_loss:.3f}  "
                  f"RMSE val {rmse_val:.2f} cm  ({time.time() - t0:.0f} s)", flush=True)
            somme_loss, n_loss = 0.0, 0
            mode_entrainement(model)

print(f"meilleur pas : {meilleur_pas} (époque {meilleur_pas / len(dl_train):.2f}), "
      f"RMSE val {meilleure_rmse:.2f} cm (avant : {rmse_avant:.2f} cm)", flush=True)
torch.save(meilleurs_poids, f"{SORTIE}_poids.pt")
json.dump(historique, open(f"{SORTIE}_historique.json", "w"), indent=1)

# ---------- évaluation sur le test ----------
meta_test = ds_test.meta
dl_test = DataLoader(ds_test, batch_size=8, num_workers=4)
lignes = []
for nom, poids in [("NeurOST d'origine", poids_init), ("fine-tuné feuille 23", charger(POIDS_FEUILLE23)),
                   ("fine-tuné toutes feuilles", meilleurs_poids)]:
    model.load_state_dict(poids)
    se, n = erreurs_par_exemple(model, dl_test)
    f23 = (meta_test["feuille"] == 23).values
    print(f"TEST {nom:27s} : toutes feuilles {rmse_cm(se, n):.2f} cm | feuille 23 ({f23.sum()} ex.) {rmse_cm(se[f23], n[f23]):.2f} cm", flush=True)
    for r in sorted(meta_test["feuille"].unique()):
        m = (meta_test["feuille"] == r).values
        lignes.append({"modele": nom, "feuille": r, "n_exemples": int(m.sum()), "rmse_cm": rmse_cm(se[m], n[m])})
pd.DataFrame(lignes).to_csv(f"{SORTIE}_test_par_feuille.csv", index=False)
print("FINI", flush=True)
