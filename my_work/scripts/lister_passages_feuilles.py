"""Liste les passages SWOT qui traversent l'emprise des 44 feuilles NeurOST du Gulf Stream.

Même logique que lister_passages.py, mais :
- la boîte est l'emprise de toutes les feuilles (+ 0,1°), plus seulement la boîte (-65, -55, 34, 42) ;
- les fichiers sont lus en parallèle.
Sortie : passages_GS_feuilles.csv (mêmes colonnes que passages_GS.csv).
Lancer depuis my_work/scripts :  nohup python lister_passages_feuilles.py > log_passages_feuilles.txt &
"""
import glob
import re
from multiprocessing import Pool

import numpy as np
import pandas as pd
import xarray as xr

swot_dir = "/data1/data/obs/level3/SWOT/V-3"
coord_grids = np.load("/home/nora/projects/NeurOST/input_data/coord_grids_gulfstream.npy")
boite = (coord_grids[..., 0].min() - 0.1, coord_grids[..., 0].max() + 0.1,
         coord_grids[..., 1].min() - 0.1, coord_grids[..., 1].max() + 0.1)
fichier_sortie = "passages_GS_feuilles.csv"


def infos_passage(fichier):
    """Dict décrivant le passage dans la boîte, None s'il ne la traverse pas, ou {'erreur': ...}."""
    lon_min, lon_max, lat_min, lat_max = boite
    try:
        m = re.search(r"_(\d{3})_(\d{3})_\d{8}T", fichier)
        cycle, passe = int(m.group(1)), int(m.group(2))

        ds = xr.open_dataset(fichier)
        lon = (ds["longitude"].values + 180) % 360 - 180
        lat = ds["latitude"].values
        # tri rapide : si aucun point dans la boîte, on s'arrête avant de lire la SSH
        if not ((lon > lon_min) & (lon < lon_max) & (lat > lat_min) & (lat < lat_max)).any():
            ds.close()
            return None

        ssh = (ds["ssha_unfiltered"].values
               - ds["LongWavelenghtError_cnst_swot_karin"].values
               - ds["LongWavelenghtError_lin_swot_karin"].values)
        temps = ds["time"].values
        dans_boite = ((lon > lon_min) & (lon < lon_max) &
                      (lat > lat_min) & (lat < lat_max) & np.isfinite(ssh))
        est_nadir = np.zeros(ssh.shape, dtype=bool)
        est_nadir[ds["i_num_line"].values, ds["i_num_pixel"].values] = True
        ds.close()
    except Exception as e:
        return {"erreur": f"{fichier} {e}"}

    karin_ok = dans_boite & ~est_nadir
    nadir_ok = dans_boite & est_nadir
    if karin_ok.sum() == 0:
        return None
    lignes_ok = karin_ok.any(axis=1)
    return {"fichier": fichier, "cycle": cycle, "passe": passe,
            "t_debut": temps[lignes_ok].min(), "t_fin": temps[lignes_ok].max(),
            "n_nadir": int(nadir_ok.sum()), "n_karin": int(karin_ok.sum())}


if __name__ == "__main__":
    fichiers = sorted(glob.glob(f"{swot_dir}/SWOT_L3_LR_SSH_Expert_*.nc"))
    print(len(fichiers), "fichiers ; boîte :", tuple(round(float(b), 2) for b in boite), flush=True)

    liste, n_err = [], 0
    with Pool(16) as pool:
        for i, infos in enumerate(pool.imap(infos_passage, fichiers, chunksize=20)):
            if infos is None:
                pass
            elif "erreur" in infos:
                n_err += 1
                print("ERREUR", infos["erreur"][:200], flush=True)
            else:
                liste.append(infos)
            if i % 1000 == 0:
                print(i, "/", len(fichiers), "->", len(liste), "passages", flush=True)

    passages = pd.DataFrame(liste).sort_values("t_debut").reset_index(drop=True)
    passages.to_csv(fichier_sortie, index=False)
    print("FINI :", len(passages), "passages,", n_err, "erreurs ->", fichier_sortie, flush=True)
