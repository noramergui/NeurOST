# Vérifications du Dataset : formes, orientation entrée/cible, loss NeurOST, RMSE du modèle pré-entraîné.
# À lancer depuis la racine du projet : python my_work/scripts/test_dataset_swot.py
import sys, numpy as np, torch
sys.path += ["my_work/scripts", ".", "src"]
from dataset_swot import SwotNadirKarinDataset
from src.pytorch_losses import torch_tracked_mse_interp, interpolate_values
from torch.utils.data import DataLoader
kw = dict(npz_path="my_work/notebooks/exemples_GS_feuille23.npz", csv_path="my_work/notebooks/exemples_GS_feuille23.csv")
for j in ["train", "val", "test"]:
    print(j, len(SwotNadirKarinDataset(jeu=j, **kw)))
ds = SwotNadirKarinDataset(jeu="train", **kw)
x, y = ds[0]; print("entree", tuple(x.shape), "cible", tuple(y.shape))
print("jours non vides : entree", torch.nonzero(x.abs().sum((1,2,3))).ravel().tolist(), "cible", torch.nonzero(y.abs().sum((1,2))).ravel().tolist())
p = y[15][(y[15] != 0).any(-1)]; print("pixels x", p[:,0].min().item(), p[:,0].max().item(), "y", p[:,1].min().item(), p[:,1].max().item())

# alignement : pour chaque pixel nadir, point KaRIn le plus proche ; on teste aussi l'image transposée
def corr_voisins(img, c):
    r, col = torch.nonzero(img, as_tuple=True)
    d2 = (c[None, :, 0] - col[:, None].float())**2 + (c[None, :, 1] - r[:, None].float())**2
    dmin, j = d2.min(1); ok = dmin < 5**2
    return np.corrcoef(img[r, col][ok], c[j[ok], 2])[0, 1] if ok.sum() > 10 else np.nan
bon, transpose = [], []
for i in range(0, len(ds), 5):
    x, y = ds[i]; img = x[15, 0]; c = y[15][(y[15] != 0).any(-1)]
    bon.append(corr_voisins(img, c)); transpose.append(corr_voisins(img.T, c))
print(f"corrélation nadir / KaRIn voisin (< 5 px) : médiane {np.nanmedian(bon):.3f} ; si on transposait l'image : {np.nanmedian(transpose):.3f}  ({np.isfinite(bon).sum()} exemples)")

# loss + modèle pré-entraîné SSH seule
from src.simvp_model import SimVP_Model_no_skip
dev = "cuda" if torch.cuda.is_available() else "cpu"
model = SimVP_Model_no_skip(in_shape=(30, 1, 128, 128), model_type='gsta', hid_S=8, hid_T=128, drop=0.2, drop_path=0.15).to(dev)
sd = torch.load("input_data/model_weights/simvp_ssh_ns1000000_global_weights_epoch45", map_location=dev)['model_state_dict']; model.load_state_dict({k.removeprefix('module.'): v for k, v in sd.items()})
model.eval()
dl = DataLoader(SwotNadirKarinDataset(jeu="val", **kw), batch_size=4)
l_mod, l_zero, rmse_mod, rmse_zero = [], [], [], []
with torch.no_grad():
    for xb, yb in dl:
        xb, yb = xb.to(dev), yb.to(dev)
        pred = model(xb)
        l_mod.append(torch_tracked_mse_interp(pred, yb).item()); l_zero.append(torch_tracked_mse_interp(torch.zeros_like(pred), yb).item())
        t = yb[:, 15]; v = t[..., 2]; m = (v != 0)
        pv = interpolate_values(pred[:, 15], t[..., :2])
        rmse_mod.append(((pv - v)[m] ** 2).mean().sqrt().item() * 0.0986)
        rmse_zero.append(((-0.074/0.0986 - v)[m] ** 2).mean().sqrt().item() * 0.0986)  # prédire SSH = 0 m
print("sortie modèle", tuple(pred.shape))
print(f"val, loss NeurOST : modèle {np.mean(l_mod):.3f}  | prédiction nulle (normalisée) {np.mean(l_zero):.3f}")
print(f"val, RMSE au jour 15 : modèle pré-entraîné {100*np.mean(rmse_mod):.1f} cm | SSH = 0 m partout {100*np.mean(rmse_zero):.1f} cm")
