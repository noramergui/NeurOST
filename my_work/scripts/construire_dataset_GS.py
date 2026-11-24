"""Construit les paires (nadir -> KaRIn) pour les 44 feuilles NeurOST du Gulf Stream.

Même logique que le notebook 02 (extraire_passage, projeter, faire_exemple), mais :
- chaque fichier SWOT est ouvert UNE fois, puis découpé pour chaque feuille ;
- les passages sont traités en parallèle.

Entrée  : passages_GS_feuilles.csv (lister_passages_feuilles.py)
Sorties : ../notebooks/exemples_GS_toutes_feuilles.npz  (entrees (N,128,128), cibles (N,P,3) en mètres, complétées par des zéros)
          ../notebooks/exemples_GS_toutes_feuilles.csv  (une ligne par exemple : fichier, cycle, passe, t_debut, feuille,
                                                         n_nadir, n_cible, jeu, garde)
Lancer depuis my_work/scripts :  python construire_dataset_GS.py > log_dataset_GS.txt
"""
import sys
from multiprocessing import Pool

import numpy as np
import pandas as pd
import xarray as xr
from scipy import stats

sys.path.append("/home/nora/projects/NeurOST/")
from src.interp_utils import ll2xyz, transformer_ll2xyz

L, N = 960e3, 128
SEUIL_NADIR = 75                                   # comme le notebook 02 : garde = n_nadir >= 75
coord_grids = np.load("/home/nora/projects/NeurOST/input_data/coord_grids_gulfstream.npy")
N_FEUILLES = coord_grids.shape[0]
SORTIE = "/home/nora/projects/NeurOST/my_work/notebooks/exemples_GS_toutes_feuilles"


# ---------- fonctions du notebook 02 ----------
def boite_feuille(r):
    """Rectangle lon/lat qui entoure la feuille r (avec 0.1° de marge, comme NeurOST)."""
    lon_f, lat_f = coord_grids[r, :, :, 0], coord_grids[r, :, :, 1]
    return (lon_f.min() - 0.1, lon_f.max() + 0.1, lat_f.min() - 0.1, lat_f.max() + 0.1)


def centre_patch(r):
    """lon0, lat0 du patch r : moyenne des 4 cases centrales, comme get_ssh_h5."""
    mid = N // 2
    c = coord_grids[r, mid - 1:mid + 1, mid - 1:mid + 1]
    return c[..., 0].mean(), c[..., 1].mean()


def projeter(lon, lat, lon0, lat0):
    """(lon, lat) -> (x, y) en mètres sur la feuille centrée en (lon0, lat0), + masque des points dedans."""
    lon_decale = (lon - lon0 + 180) % 360 - 180
    x, y, z = ll2xyz(lat, lon_decale, 0, lat0, 0, 0, transformer_ll2xyz)
    dedans = (z > -1e6) & (np.abs(x) < L / 2) & (np.abs(y) < L / 2)
    return x, y, dedans


DEBUT = pd.Timestamp("2023-07-26")
MOTIF = [("train", 105), ("trou", 21), ("val", 21), ("trou", 21), ("test", 42), ("trou", 21)]
LONGUEUR_MOTIF = sum(d for _, d in MOTIF)          # 231 jours


def quel_jeu(date):
    """Jeu (train / val / test / trou) d'une date, comme le notebook 02."""
    position = (date - DEBUT).days % LONGUEUR_MOTIF
    for nom, duree in MOTIF:
        if position < duree:
            return nom
        position -= duree


BOITES = [boite_feuille(r) for r in range(N_FEUILLES)]
CENTRES = [centre_patch(r) for r in range(N_FEUILLES)]
EMPRISE = (min(b[0] for b in BOITES), max(b[1] for b in BOITES),
           min(b[2] for b in BOITES), max(b[3] for b in BOITES))


# ---------- un passage -> un exemple par feuille traversée ----------
def exemples_du_passage(fichier):
    """Liste de (feuille, image_entree, cible, n_nadir, n_cible) pour un fichier SWOT."""
    ds = xr.open_dataset(fichier)
    lon = (ds["longitude"].values + 180) % 360 - 180
    lat = ds["latitude"].values
    ssh = (ds["ssha_unfiltered"].values
           - ds["LongWavelenghtError_cnst_swot_karin"].values
           - ds["LongWavelenghtError_lin_swot_karin"].values)
    est_nadir = np.zeros(ssh.shape, dtype=bool)
    est_nadir[ds["i_num_line"].values, ds["i_num_pixel"].values] = True
    ds.close()

    # on ne garde qu'une fois les points valides de l'emprise : chaque feuille pioche dedans
    e = EMPRISE
    ok = (lon > e[0]) & (lon < e[1]) & (lat > e[2]) & (lat < e[3]) & np.isfinite(ssh)
    lon, lat, ssh, est_nadir = lon[ok], lat[ok], ssh[ok], est_nadir[ok]

    resultats = []
    for r in range(N_FEUILLES):
        b = BOITES[r]
        dans_boite = (lon > b[0]) & (lon < b[1]) & (lat > b[2]) & (lat < b[3])
        nadir_ok, karin_ok = dans_boite & est_nadir, dans_boite & ~est_nadir
        if nadir_ok.sum() == 0 or karin_ok.sum() == 0:
            continue

        lon0, lat0 = CENTRES[r]
        xn, yn, dn = projeter(lon[nadir_ok], lat[nadir_ok], lon0, lat0)
        xk, yk, dk = projeter(lon[karin_ok], lat[karin_ok], lon0, lat0)
        if dn.sum() == 0 or dk.sum() == 0:
            continue

        moy_nadir, x_bords, y_bords, _ = stats.binned_statistic_2d(
            xn[dn], yn[dn], ssh[nadir_ok][dn], statistic="mean", bins=N, range=[[-L / 2, L / 2], [-L / 2, L / 2]])
        image_entree = np.rot90(moy_nadir)
        image_entree[np.isnan(image_entree)] = 0

        moy_karin, _, _, _ = stats.binned_statistic_2d(
            xk[dk], yk[dk], ssh[karin_ok][dk], statistic="mean", bins=N, range=[[-L / 2, L / 2], [-L / 2, L / 2]])
        x_centres = (x_bords[:-1] + x_bords[1:]) / 2
        y_centres = (y_bords[:-1] + y_bords[1:]) / 2
        X, Y = np.meshgrid(x_centres, y_centres, indexing="ij")
        remplie = np.isfinite(moy_karin)
        cible = np.column_stack((X[remplie], Y[remplie], moy_karin[remplie]))

        n_nadir, n_cible = int((image_entree != 0).sum()), cible.shape[0]
        if n_nadir == 0 or n_cible == 0:
            continue
        resultats.append((r, image_entree.astype(np.float32), cible.astype(np.float32), n_nadir, n_cible))
    return resultats


def traiter(ligne):
    try:
        return ligne, exemples_du_passage(ligne["fichier"]), None
    except Exception as e:
        return ligne, [], str(e)


if __name__ == "__main__":
    passages = pd.read_csv("passages_GS_feuilles.csv", parse_dates=["t_debut", "t_fin"])
    print(len(passages), "passages, emprise", tuple(round(float(v), 2) for v in EMPRISE), flush=True)

    entrees, cibles, infos = [], [], []
    with Pool(16) as pool:
        for k, (ligne, res, err) in enumerate(pool.imap(traiter, passages.to_dict("records"), chunksize=4)):
            if err:
                print("ERREUR", ligne["fichier"], err[:200], flush=True)
            for r, image, cible, n_nadir, n_cible in res:
                entrees.append(image)
                cibles.append(cible)
                infos.append({"fichier": ligne["fichier"], "cycle": ligne["cycle"], "passe": ligne["passe"],
                              "t_debut": ligne["t_debut"], "feuille": r, "n_nadir": n_nadir, "n_cible": n_cible})
            if k % 100 == 0:
                print(k, "/", len(passages), "passages ->", len(entrees), "exemples", flush=True)

    infos = pd.DataFrame(infos)
    infos["jeu"] = infos["t_debut"].apply(quel_jeu)
    infos["garde"] = infos["n_nadir"] >= SEUIL_NADIR

    n_max = max(c.shape[0] for c in cibles)
    cibles_tab = np.zeros((len(cibles), n_max, 3), dtype=np.float32)
    for k, c in enumerate(cibles):
        cibles_tab[k, :c.shape[0]] = c
    np.savez_compressed(SORTIE + ".npz", entrees=np.stack(entrees), cibles=cibles_tab)
    infos.to_csv(SORTIE + ".csv", index=False)

    print("FINI :", len(infos), "exemples, cible max", n_max, "points", flush=True)
    print(infos[infos["garde"]].groupby("jeu").size().to_string(), flush=True)
