# %% [markdown]
# PSD le long des fauchées SWOT : comparaison SWOT / NeurOST
#
# Principe : chaque colonne de la fauchée (cross_track_distance fixe)
# est traitée comme une trace nadir. On découpe en segments, on calcule
# les PSD (Welch), et on moyenne sur colonnes / fichiers / jours.

# %%
import glob

import numpy as np
import xarray as xr
import scipy.signal
import matplotlib.pyplot as plt

# %%
# --------------------------------------------------
# Paramètres
# --------------------------------------------------

# zone géographique  (à compléter : lon_min manquait dans le script RMSE)
lon_min, lon_max = ..., -55
lat_min, lat_max = 34, 42

ssh_var = 'ssha_filtered'

swot_dir = '/data1/data/obs/level3/SWOT/V-3/'

# paramètres spectraux
delta_x = 2.0                                  # km, pas le long de la trace
longueur_segment = 400.0                       # km
npt = int(longueur_segment / delta_x)          # nombre de points par segment

# colonnes à utiliser : tous les 10 km de chaque côté du nadir
distances_cibles = [-60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60]

# %%
# --------------------------------------------------
# Un jour de test
# --------------------------------------------------

date = '20240201'

swot_files = sorted(glob.glob(f"{swot_dir}/*{date}T*.nc"))
# (garder ensuite seulement ceux qui passent dans la boîte, comme dans le script RMSE)

neurost_file = ...    # chemin du fichier NeurOST de ce jour
nst = xr.open_dataset(neurost_file).isel(time=0)

# %%
# --------------------------------------------------
# Étape 0 : géométrie d'un fichier SWOT
# --------------------------------------------------

f = swot_files[0]
ds = xr.open_dataset(f)

ctd = ds.cross_track_distance.values      # 1D : une valeur par colonne
print(np.round(ctd, 1))

# %%
# --------------------------------------------------
# Étape 1 : extraire une colonne (SWOT + NeurOST interpolé)
# --------------------------------------------------
# Important : on ne supprime pas les points, on met NaN.
# Sinon on colle des points éloignés et la PSD est faussée.

cible = 20.0
j = np.argmin(np.abs(ctd - cible))
print("colonne", j, "->", ctd[j], "km")

lat_col = ds.latitude.values[:, j]
lon_col = ds.longitude.values[:, j]
ssh_col = ds[ssh_var].values[:, j]

# TODO 1 : booléen "dans la boîte" (attention au passage en [-180, 180])
in_box = ...

ssh_col = np.where(in_box, ssh_col, np.nan)

# TODO 2 : interpoler nst.sla sur (lon_col % 360, lat_col)
nst_col = ...

nst_col = np.where(np.isfinite(ssh_col), nst_col, np.nan)

# %%
# vérification visuelle
x = np.arange(len(ssh_col)) * delta_x   # km

plt.figure(figsize=(12, 4))
plt.plot(x, ssh_col, label="SWOT")
plt.plot(x, nst_col, label="NeurOST")
plt.xlabel("distance le long de la trace (km)")
plt.ylabel("SSH (m)")
plt.legend()

# %%
# --------------------------------------------------
# Étape 2 : découpage en segments complets de npt points
# --------------------------------------------------
# (à écrire ensemble à l'étape suivante)

# %%
# --------------------------------------------------
# Étape 3 : boucle sur les colonnes
# --------------------------------------------------

# %%
# --------------------------------------------------
# Étape 4 : Welch + tracés (PSD, score 1 - PSD_diff / PSD_ref)
# --------------------------------------------------
