import numpy as np

coords = np.load("input_data/coord_grids.npy")
lon0 = coords[:, 63:65, 63:65, 0].mean(axis=(1, 2)) #pour tous les patches (:), on prend les lignes 63 et 64, les colonnes 63 et 64 (le 65 est exclu), et la longitude (0). Cela donne les 4 pixels centraux de chaque patch, forme (n_patches, 2, 2).moyenne sur ces 2 × 2 pixels. Résultat : un tableau de n_patches valeurs, la longitude du centre de chaque patch.
lat0 = coords[:, 63:65, 63:65, 1].mean(axis=(1, 2)) #idem pour la latitude
lon0 = (lon0 + 180) % 360 - 180

m = 4   # marge en degrés autour de la zone 
sel = (lon0 > -33 - m) & (lon0 < -24 + m) & (lat0 > 29 - m) & (lat0 < 37 + m) #Construit un masque booléen de longueur n_patches : True si le centre du patch est dans la zone élargie, c’est-à-dire longitude entre -69 et -51, et latitude entre 30 et 46. Les & combinent les 4 conditions (il faut qu’elles soient toutes vraies).
print(sel.sum(), "patches retenus sur", len(sel)) #sel.sum() compte les True (les patches retenus), len(sel) est le nombre total de patches. C’est un contrôle : si le nombre retenu est très petit (moins d’une dizaine), augmentez m.

np.save("input_data/coord_grids_azores.npy", coords[sel]) #coords[sel] garde uniquement les patches où sel est True (forme (n_retenus, 128, 128, 2)), et np.save les écrit dans un nouveau fichier. C’est ce fichier que l’on donne ensuite à --coord_grid_path pour predict_ssh.py et merge_maps.py