"""Dataset PyTorch des paires (nadir SWOT -> KaRIn) au format attendu par NeurOST.

Chaque exemple reproduit la sortie de src/dataloaders.NeurOST_dataset (version sans SST) :
    entree : (N_t, 1, n, n)    SSH nadir normalisée au jour N_t//2, zéros ailleurs
    cible  : (N_t, n_max, 3)   (x_pixel, y_pixel, SSH normalisée) au jour N_t//2, zéros ailleurs
Les zéros signifient « pas de donnée », comme dans NeurOST (la loss les ignore).
"""
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset


class SwotNadirKarinDataset(Dataset):
    def __init__(self, npz_path, csv_path, jeu="train",
                 N_t=30, n=128, L=960e3,
                 mean_ssh=0.074, std_ssh=0.0986,   # constantes globales de NeurOST (predict_ssh.py)
                 n_max=None):
        """
        npz_path : fichier avec `entrees` (N, n, n) et `cibles` (N, P, 3) en mètres, complétés par des zéros
        csv_path : métadonnées, une ligne par exemple, colonnes `jeu` et `garde`
        jeu      : "train", "val", "test" (ou "trou") ; on ne garde que les lignes garde == True
        n_max    : nb de points de la cible ; None = tous. Si plus petit, sous-échantillonnage aléatoire
                   (reproductible) plutôt que de tronquer, car les points sont rangés par x.
        """
        meta = pd.read_csv(csv_path)
        idx = np.flatnonzero((meta["jeu"] == jeu).values & meta["garde"].astype(bool).values)
        if len(idx) == 0:
            raise ValueError(f"aucun exemple pour jeu={jeu!r}")

        d = np.load(npz_path)
        self.entrees = d["entrees"][idx]
        self.cibles = d["cibles"][idx]
        self.meta = meta.iloc[idx].reset_index(drop=True)

        self.N_t, self.n, self.L = N_t, n, L
        self.mean_ssh, self.std_ssh = mean_ssh, std_ssh
        self.n_max = n_max or self.cibles.shape[1]
        self.t_nadir = N_t // 2          # jour 15 : centre de la fenêtre, comme get_ssh_h5

    def __len__(self):
        return len(self.entrees)

    def __getitem__(self, i):
        N_t, n, L = self.N_t, self.n, self.L

        # --- entrée : (N_t, 1, n, n), nadir au jour 15 ---
        image = self.entrees[i].astype(np.float32).copy()
        rempli = image != 0
        image[rempli] = (image[rempli] - self.mean_ssh) / self.std_ssh
        entree = np.zeros((N_t, 1, n, n), dtype=np.float32)
        entree[self.t_nadir, 0] = image

        # --- cible : mètres -> pixels, SSH normalisée ---
        c = self.cibles[i]
        c = c[(c != 0).any(axis=1)]                       # enlève le remplissage
        if len(c) > self.n_max:
            rng = np.random.default_rng(i)
            c = c[np.sort(rng.choice(len(c), self.n_max, replace=False))]
        x_pix = (c[:, 0] + 0.5 * L) * (n - 1) / L        # même formule que NeurOST_dataset
        y_pix = (0.5 * L - c[:, 1]) * (n - 1) / L        # y vers le bas, comme l'image après rot90
        ssh = (c[:, 2] - self.mean_ssh) / self.std_ssh

        cible = np.zeros((N_t, self.n_max, 3), dtype=np.float32)
        cible[self.t_nadir, :len(c)] = np.column_stack((x_pix, y_pix, ssh))

        return torch.from_numpy(entree), torch.from_numpy(cible)
