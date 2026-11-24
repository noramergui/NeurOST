import sys, json, numpy as np, pandas as pd, matplotlib
matplotlib.use("Agg"); import matplotlib.pyplot as plt
from scipy import stats
OUT = sys.argv[1]
nb = json.load(open("/home/nora/projects/NeurOST/my_work/notebooks/02_extraction_passage_GS.ipynb"))
src = {c["id"]: "".join(c["source"]) for c in nb["cells"]}
g = {}
for cid in ["d29eee82", "1fccf21c", "638758de", "26bc52c1", "8478defc", "db5dacca", "879d102d"]:
    exec(src[cid], g)
exec("from scipy import stats", g)
boite_gs, passages, coord_grids = g["boite_gs"], g["passages"], g["coord_grids"]
ligne = passages[(passages.cycle == 10) & (passages.passe == 451)].iloc[0]
nadir, karin = g["extraire_passage"](ligne["fichier"], boite_gs)
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 13, "axes.spines.top": False, "axes.spines.right": False})
kw = dict(cmap="RdBu_r", vmin=-0.5, vmax=0.5)

# 1. passage dans la boite
fig, ax = plt.subplots(figsize=(6.4, 5.6))
im = ax.scatter(karin["lon"], karin["lat"], c=karin["ssh"], s=1, **kw)
ax.scatter(nadir["lon"], nadir["lat"], c="k", s=6, label="nadir (entrée)")
fig.colorbar(im, ax=ax, label="SSH corrigée (m)")
ax.set_xlim(boite_gs[0], boite_gs[1]); ax.set_ylim(boite_gs[2], boite_gs[3])
ax.set_xlabel("longitude (°)"); ax.set_ylabel("latitude (°)"); ax.legend(loc="lower right")
fig.tight_layout(); fig.savefig(f"{OUT}/fig_passage.png", dpi=200); plt.close(fig)

# 2. feuilles + nb points nadir
fig, ax = plt.subplots(figsize=(6.6, 5.6))
for r in range(coord_grids.shape[0]):
    lon0, lat0 = g["centre_patch"](coord_grids, r)
    _, _, d = g["projeter"](nadir["lon"], nadir["lat"], lon0, lat0)
    c = coord_grids[r]
    edge = np.concatenate([c[0, :], c[:, -1], c[-1, ::-1], c[::-1, 0]])
    col, lw = ("#E07A1F", 2.4) if r == 24 else ("#C5D3DD", 0.5)
    ax.plot(edge[:, 0], edge[:, 1], color=col, lw=lw, zorder=3 if r == 24 else 1)
    ax.text(lon0, lat0, str(int(d.sum())), ha="center", va="center", fontsize=8,
            color="#0B3954" if d.sum() else "#B0BEC5", fontweight="bold" if r == 24 else None)
ax.plot(nadir["lon"], nadir["lat"], "k.", ms=2)
x0, x1, y0, y1 = boite_gs
ax.plot([x0, x1, x1, x0, x0], [y0, y0, y1, y1, y0], "k--", lw=1.2)
ax.set_xlabel("longitude (°)"); ax.set_ylabel("latitude (°)")
fig.tight_layout(); fig.savefig(f"{OUT}/fig_feuilles.png", dpi=200); plt.close(fig)

# 3. entree / cible en xy, feuille 24
r = 24; lon0, lat0 = g["centre_patch"](coord_grids, r)
xn, yn, dn = g["projeter"](nadir["lon"], nadir["lat"], lon0, lat0)
xk, yk, dk = g["projeter"](karin["lon"], karin["lat"], lon0, lat0)
L, n = 960e3, 128
mn, xb, yb, _ = stats.binned_statistic_2d(xn, yn, nadir["ssh"], "mean", bins=n, range=[[-L/2, L/2]]*2)
img = np.rot90(mn)
mk, _, _, _ = stats.binned_statistic_2d(xk, yk, karin["ssh"], "mean", bins=n, range=[[-L/2, L/2]]*2)
xc = (xb[:-1] + xb[1:]) / 2; yc = (yb[:-1] + yb[1:]) / 2
X, Y = np.meshgrid(xc, yc, indexing="ij"); rem = np.isfinite(mk)
print("cases nadir", np.isfinite(img).sum(), "cible", rem.sum())
fig, axes = plt.subplots(1, 2, figsize=(11, 5.2), constrained_layout=True)
axes[0].imshow(img, extent=[-480, 480, -480, 480], **kw, interpolation="nearest")
axes[0].set_title("Entrée : image nadir 128×128")
im = axes[1].scatter(X[rem]/1e3, Y[rem]/1e3, c=mk[rem], s=3, marker="s", **kw)
axes[1].set_title("Cible : KaRIn moyenné par case (7,5 km)")
for ax in axes:
    ax.set_xlim(-480, 480); ax.set_ylim(-480, 480); ax.set_aspect("equal")
    ax.set_xlabel("x (km)"); ax.set_ylabel("y (km)")
fig.colorbar(im, ax=axes, label="SSH (m)", shrink=0.85)
fig.savefig(f"{OUT}/fig_grille.png", dpi=200); plt.close(fig)
