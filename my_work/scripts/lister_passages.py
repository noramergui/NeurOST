import glob
import re
import numpy as np
import pandas as pd
import xarray as xr

swot_dir = "/data1/data/obs/level3/SWOT/V-3"
boite_gs = (-65, -55, 34, 42)
fichier_sortie = "passages_GS.csv"


def infos_passage(fichier, boite):
    """Renvoie un dict décrivant le passage dans la boîte, ou None s'il ne la traverse pas."""
    lon_min, lon_max, lat_min, lat_max = boite

    m = re.search(r"_(\d{3})_(\d{3})_\d{8}T", fichier)
    cycle = int(m.group(1))
    passe = int(m.group(2))

    ds = xr.open_dataset(fichier)
    lon = (ds["longitude"].values + 180) % 360 - 180
    lat = ds["latitude"].values
    ssh = (ds["ssha_unfiltered"].values
           - ds["LongWavelenghtError_cnst_swot_karin"].values
           - ds["LongWavelenghtError_lin_swot_karin"].values)
    temps = ds["time"].values

    dans_boite = ((lon > lon_min) & (lon < lon_max) &
                  (lat > lat_min) & (lat < lat_max) &
                  np.isfinite(ssh))

    lignes = ds["i_num_line"].values
    pixels = ds["i_num_pixel"].values
    est_nadir = np.zeros(ssh.shape, dtype=bool)
    est_nadir[lignes, pixels] = True
    karin_ok = dans_boite & ~est_nadir
    nadir_ok = dans_boite & est_nadir

    if karin_ok.sum() == 0:
        ds.close()
        return None

    lignes_ok = karin_ok.any(axis=1)

    infos = {
        "fichier": fichier,
        "cycle": cycle,
        "passe": passe,
        "t_debut": temps[lignes_ok].min(),
        "t_fin": temps[lignes_ok].max(),
        "n_nadir": int(nadir_ok.sum()),
        "n_karin": int(karin_ok.sum()),
    }
    ds.close()
    return infos


fichiers = sorted(glob.glob(f"{swot_dir}/SWOT_L3_LR_SSH_Expert_*.nc"))
print(len(fichiers), "fichiers")

f_test = [f for f in fichiers if "_010_451_" in f][0]
print("boite :", boite_gs)
print(infos_passage(f_test, boite_gs))

liste = []
for i, f in enumerate(fichiers):
    try:
        infos = infos_passage(f, boite_gs)
    except Exception as e:
        print("ERREUR", f, e)
        continue
    if infos is not None:
        liste.append(infos)
    if i % 500 == 0:
        print(i, "/", len(fichiers), "->", len(liste), "passages")
        pd.DataFrame(liste).to_csv(fichier_sortie, index=False)

passages = pd.DataFrame(liste)
passages.to_csv(fichier_sortie, index=False)
print("FINI :", len(passages), "passages dans", fichier_sortie)