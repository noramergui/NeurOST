const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/home/nora/.claude/skills/synced/004ee9c9-1243-4825-9f1e-64699851e149_0983cf1c-d147-48a5-a030-6966af4baac6/pptx/scripts/apply_theme.js");
const D = __dirname;
const THEME = { name: "Ocean NeurOST", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "1B2631", lt1: "FFFFFF", dk2: "0B3954", lt2: "EEF3F6",
    accent1: "087E8B", accent2: "E07A1F", accent3: "0B3954", accent4: "8AA3B5", accent5: "C81D25", accent6: "5C6B73",
    hlink: "087E8B", folHlink: "5C6B73" } };
const HEX = { navy: "0B3954", teal: "087E8B", orange: "E07A1F", lt2: "EEF3F6", grey: "5C6B73", code: "0F2233" };
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";            // 13.33 x 7.5
pres.theme = { headFontFace: "Cambria", bodyFontFace: "Calibri" };
pres.title = "Paires nadir → KaRIn pour NeurOST (Gulf Stream)";
const C = pres.SchemeColor;

pres.defineSlideMaster({ title: "TITRE", background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.1, w: 11.7, h: 1.9, fontSize: 42, bold: true, color: C.background1, valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 4.2, w: 11.7, h: 1.4, fontSize: 20, color: C.background2, valign: "top" }, text: "" } },
  ] });
pres.defineSlideMaster({ title: "CONTENU", background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontSize: 30, bold: true, color: C.text2, valign: "middle", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 12.4, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.accent6 } });

const etape = (s, n, txt) => {   // motif : pastille numérotée
  s.addShape(pres.shapes.OVAL, { x: 0.6, y: 1.3, w: 0.42, h: 0.42, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: "pastille" });
  s.addText(String(n), { x: 0.6, y: 1.3, w: 0.42, h: 0.42, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addText(txt, { x: 1.15, y: 1.3, w: 11.5, h: 0.42, fontSize: 16, italic: true, color: C.accent6, valign: "middle", margin: 0, isTextBox: true });
};
const code = (s, txt, x, y, w, h, size = 12) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: HEX.code }, line: { color: HEX.code }, rectRadius: 0.08, objectName: "fond code" });
  s.addText(txt, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: h - 0.3, fontFace: "Courier New", fontSize: size, color: "E6EDF3", valign: "top", margin: 0, isTextBox: true, objectName: "code" });
};
const puces = (s, items, x, y, w, h, size = 16) => s.addText(
  items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })),
  { x, y, w, h, fontSize: size, color: C.text1, valign: "top", paraSpaceAfter: 8, isTextBox: true, margin: 0 });
const stat = (s, val, lab, x, y, w, col = C.accent1) => {
  s.addText(val, { x, y, w, h: 0.75, fontSize: 40, bold: true, color: col, margin: 0, isTextBox: true, fontFace: "Cambria" });
  s.addText(lab, { x, y: y + 0.75, w, h: 0.5, fontSize: 13, color: C.accent6, margin: 0, valign: "top", isTextBox: true });
};

// 1 — titre
pres.addSection({ title: "Introduction" });
let s = pres.addSlide({ masterName: "TITRE", sectionTitle: "Introduction" });
s.addText("Construire des paires nadir → KaRIn pour affiner NeurOST sur le Gulf Stream", { placeholder: "title" });
s.addText("Point d'avancement : extraction des passages SWOT et mise au format NeurOST · novembre 2026", { placeholder: "body" });
s.addNotes("But de la présentation : montrer la chaîne qui transforme un fichier SWOT L3 en un exemple (entrée, cible) au format NeurOST, et discuter des choix pour la suite.");

// 2 — idée
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Introduction" });
s.addText("Un passage SWOT fournit à la fois l'entrée et la cible", { placeholder: "title" });
const carte = (x, titre, sous, txt, col) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.7, w: 5.1, h: 3.1, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.12, objectName: "carte " + titre });
  s.addText(titre, { x: x + 0.35, y: 1.95, w: 4.4, h: 0.6, fontSize: 26, bold: true, color: col, margin: 0, isTextBox: true, fontFace: "Cambria" });
  s.addText(sous, { x: x + 0.35, y: 2.55, w: 4.4, h: 0.45, fontSize: 16, italic: true, color: C.accent6, margin: 0, isTextBox: true });
  s.addText(txt, { x: x + 0.35, y: 3.1, w: 4.4, h: 1.5, fontSize: 16, color: C.text1, margin: 0, valign: "top", isTextBox: true });
};
carte(0.6, "Entrée", "SSH nadir (le long de la trace)", "Le pixel KaRIn le plus proche du nadir (i_num_line, i_num_pixel), soit ~1 point tous les 7 km.", C.text2);
carte(7.6, "Cible", "SSH KaRIn (2D, fauchée large)", "Tous les autres pixels valides du même passage, au même instant.", C.accent2);
s.addShape(pres.shapes.RIGHT_ARROW, { x: 5.95, y: 2.95, w: 1.4, h: 0.6, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: "flèche" });
s.addText("Le réseau voit une ligne et doit retrouver la carte 2D autour : pas de décalage temporel entre entrée et cible.", { x: 0.6, y: 5.2, w: 12.1, h: 0.6, fontSize: 18, color: C.text2, bold: true, margin: 0, isTextBox: true });
s.addText("Zone d'étude : boîte Gulf Stream 65°W–55°W, 34°N–42°N · SSH = ssha_unfiltered − LongWavelengthError (cnst + lin)", { x: 0.6, y: 5.9, w: 12.1, h: 0.5, fontSize: 14, color: C.accent6, margin: 0, isTextBox: true });

// 3 — liste des passages
pres.addSection({ title: "Chaîne de traitement" });
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Chaîne de traitement" });
s.addText("734 passages SWOT traversent la boîte Gulf Stream", { placeholder: "title" });
etape(s, 1, "Lister les passages · scripts/lister_passages.py → passages_GS.csv");
stat(s, "18 959", "fichiers SWOT L3 v3.0 parcourus", 0.6, 2.1, 3.4);
stat(s, "734", "passages dans la boîte (juil. 2023 → juin 2025)", 0.6, 3.5, 3.4, C.accent2);
stat(s, "23", "traces distinctes, cycles 1 à 34", 0.6, 4.9, 3.4);
const mois = ["2023-07","2023-08","2023-09","2023-10","2023-11","2023-12","2024-01","2024-02","2024-03","2024-04","2024-05","2024-06","2024-07","2024-08","2024-09","2024-10","2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06"];
const nb = [8,33,30,34,30,32,29,31,32,32,26,31,34,32,34,34,32,33,32,27,34,27,33,34];
s.addChart(pres.charts.BAR, [{ name: "passages", labels: mois.map(m => m.slice(5) + "/" + m.slice(2,4)), values: nb }], {
  x: 4.3, y: 1.95, w: 8.5, h: 4.4, barDir: "col", chartColors: [HEX.teal], showLegend: false,
  showTitle: true, title: "Passages par mois", titleFontSize: 14, titleColor: HEX.navy, titleFontFace: "+mn-lt",
  catAxisLabelColor: HEX.grey, valAxisLabelColor: HEX.grey, catAxisLabelFontSize: 10, valAxisLabelFontSize: 11,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelRotate: 270,
  valGridLine: { color: "DDE4E9", size: 0.5 }, catGridLine: { style: "none" }, barGapWidthPct: 40 });
s.addText("~32 passages / mois. Juillet 2023 incomplet (début des données). 77 fichiers sans indices nadir ont été ignorés ; 94 passages ne touchent la boîte que par KaRIn (0 point nadir).", { x: 0.6, y: 6.45, w: 12.1, h: 0.6, fontSize: 13, color: C.accent6, margin: 0, isTextBox: true });

// 4 — extraction
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Chaîne de traitement" });
s.addText("Un passage donne 129 points nadir et 24 017 points KaRIn", { placeholder: "title" });
etape(s, 2, "Extraire nadir et KaRIn · extraire_passage(fichier, boîte), passe 451 du 10/02/2024");
s.addImage({ path: D + "/figures/fig_passage.png", x: 0.6, y: 1.95, w: 5.2, h: 5.2 * 1120 / 1280, altText: "Passe 451 dans la boîte Gulf Stream : SSH KaRIn en couleur, points nadir en noir" });
code(s, 'est_nadir = np.zeros(ssh.shape, bool)\nest_nadir[i_num_line, i_num_pixel] = True\n\nkarin_ok = dans_boite & ~est_nadir\nnadir_ok = dans_boite &  est_nadir', 6.3, 1.95, 6.4, 1.75, 13);
puces(s, [
  "Nadir = pixel 34 (centre de la fauchée), repéré par i_num_line / i_num_pixel.",
  "Vérification : 129 points nadir SWOT = 129 points CMEMS swon sur le même passage.",
  "Chaque passage est découpé une seule fois, puis réutilisé pour toutes les feuilles.",
], 6.3, 4.0, 6.4, 2.8, 16);

// 5 — projection
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Chaîne de traitement" });
s.addText("Chaque passage tombe sur plusieurs feuilles NeurOST", { placeholder: "title" });
etape(s, 3, "Projeter sur les feuilles · même calcul que get_ssh_h5 (plan tangent local, 960 × 960 km)");
s.addImage({ path: D + "/figures/fig_feuilles.png", x: 0.6, y: 1.95, w: 5.6, h: 5.6 * 1120 / 1320, altText: "44 feuilles NeurOST du Gulf Stream, nombre de points nadir de la passe 451 dans chacune ; feuille 24 en orange" });
code(s, 'def projeter(lon, lat, lon0, lat0, L=960e3):\n    lon_d = (lon - lon0 + 180) % 360 - 180\n    x, y, z = ll2xyz(lat, lon_d, 0, lat0, 0, 0,\n                     transformer_ll2xyz)\n    dedans = (z > -1e6) & (abs(x) < L/2) \\\n                        & (abs(y) < L/2)\n    return x, y, dedans', 6.6, 1.95, 6.1, 2.55, 13);
puces(s, [
  "Centre (lon0, lat0) = moyenne des 4 cases centrales de la feuille, comme dans NeurOST.",
  "Chiffres = points nadir de la passe 451 dans chaque feuille (44 feuilles au total).",
  "Feuille 24 (orange) : 127 points nadir. C'est l'exemple suivi ensuite.",
], 6.6, 4.75, 6.1, 2.2, 15);

// 6 — maillage
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Chaîne de traitement" });
s.addText("Entrée et cible sur la grille 128 × 128 de NeurOST", { placeholder: "title" });
etape(s, 4, "Mailler · binned_statistic_2d à 7,5 km, rot90 et NaN → 0 pour l'entrée (comme bin_ssh)");
s.addImage({ path: D + "/figures/fig_grille.png", x: 0.6, y: 1.9, w: 9.4, h: 9.4 * 1040 / 2200, altText: "Feuille 24 : image d'entrée nadir 128 par 128 à gauche, cible KaRIn moyennée par case à droite" });
stat(s, "119", "cases remplies dans l'image d'entrée", 10.4, 2.2, 2.5);
stat(s, "1 909", "cases cibles KaRIn (x, y, SSH)", 10.4, 3.7, 2.5, C.accent2);
s.addText("Le réseau voit 0,7 % de la feuille et doit reconstruire la fauchée de 120 km autour.", { x: 10.4, y: 5.2, w: 2.5, h: 1.6, fontSize: 14, italic: true, color: C.text2, margin: 0, valign: "top", isTextBox: true });

// 7 — faire_exemple
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Chaîne de traitement" });
s.addText("Une fonction produit un exemple d'entraînement", { placeholder: "title" });
etape(s, 5, "Assembler · faire_exemple(fichier, r) → (image_entree, cible)");
code(s, 'def faire_exemple(fichier, r, L=960e3, n=128):\n    nadir, karin = extraire_passage(fichier, boite_feuille(r))\n    lon0, lat0 = centre_patch(coord_grids, r)\n    xn, yn, dn = projeter(nadir["lon"], nadir["lat"], lon0, lat0, L)\n    xk, yk, dk = projeter(karin["lon"], karin["lat"], lon0, lat0, L)\n\n    # entrée : moyenne par case, rot90, NaN -> 0      (128, 128)\n    # cible  : cases KaRIn remplies -> [x, y, ssh]    (N, 3)\n    return image_entree, cible', 0.6, 1.95, 8.0, 3.6, 13);
stat(s, "131", "cases nadir, feuille 24", 9.1, 2.0, 3.6);
stat(s, "(2 096, 3)", "forme de la cible", 9.1, 3.5, 3.6, C.accent2);
s.addText("Plus qu'à l'étape 4 (119 et 1 909) : ici le découpage suit l'emprise de la feuille (+0,1°), qui dépasse la boîte Gulf Stream.", { x: 0.6, y: 5.85, w: 12.1, h: 0.8, fontSize: 15, color: C.accent6, margin: 0, isTextBox: true });

// 8 — jeu de données feuille 23
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Chaîne de traitement" });
s.addText("671 exemples pour la feuille 23, dont 548 retenus", { placeholder: "title" });
etape(s, 6, "Construire le jeu · faire_exemple sur les 734 passages → exemples_GS_feuille23.npz + .csv");
code(s, 'for i, ligne in passages.iterrows():\n    img, cible = faire_exemple(ligne["fichier"], 23)\n    if (img != 0).sum() == 0:\n        continue                  # pas de nadir sur la feuille\n    entrees.append(img); cibles.append(cible)\n\n# cibles complétées par des zéros jusqu\'à 2 134 points\ninfos["garde"] = infos["n_nadir"] >= 75', 0.6, 1.95, 6.6, 3.3, 12);
stat(s, "63", "passages sans aucun nadir sur la feuille 23", 0.6, 5.5, 3.1);
stat(s, "123", "exemples écartés : moins de 75 cases nadir", 3.9, 5.5, 3.3, C.accent2);
const bornes = ["0", "15", "30", "45", "60", "75", "90", "105", "120"].map(b => b + "–" + (Number(b) + 15));
s.addChart(pres.charts.BAR, [
  { name: "écartés (< 75)", labels: bornes, values: [16, 16, 34, 29, 28, 0, 0, 0, 0] },
  { name: "gardés (≥ 75)", labels: bornes, values: [0, 0, 0, 0, 0, 16, 49, 48, 435] },
], { x: 7.6, y: 1.95, w: 5.2, h: 4.9, barDir: "col", barGrouping: "stacked", chartColors: [HEX.grey, HEX.teal],
  showTitle: true, title: "Exemples par nombre de cases nadir", titleFontSize: 14, titleColor: HEX.navy, titleFontFace: "+mn-lt",
  showLegend: true, legendPos: "b", legendFontSize: 11, legendFontFace: "+mn-lt", legendColor: HEX.grey,
  catAxisLabelColor: HEX.grey, valAxisLabelColor: HEX.grey, catAxisLabelFontSize: 10, valAxisLabelFontSize: 11,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelRotate: 270,
  valGridLine: { color: "DDE4E9", size: 0.5 }, catGridLine: { style: "none" }, barGapWidthPct: 30 });
s.addNotes("435 exemples ont plus de 120 cases nadir : la trace traverse toute la feuille. Les petites valeurs correspondent aux passages qui ne font que couper un coin de la feuille.");

// 9 — découpage temporel
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Chaîne de traitement" });
s.addText("Découpage temporel, avec des trous contre les fuites", { placeholder: "title" });
etape(s, 7, "Séparer · quel_jeu(date) : motif de 231 jours répété depuis le 26/07/2023 (≈ 3 fois sur la période)");
const motif = [["train", 105, C.accent1], ["trou", 21, null], ["val", 21, C.text2], ["trou", 21, null], ["test", 42, C.accent2], ["trou", 21, null]];
let xm = 0.6; const W = 12.1 / 231;
motif.forEach(([nom, j, col], k) => {
  const w = j * W;
  s.addShape(pres.shapes.RECTANGLE, { x: xm, y: 2.2, w: w - 0.04, h: 1.1, fill: { color: col || C.background2 }, line: { color: col || C.background2 }, objectName: "motif " + nom + " " + k });
  s.addText([{ text: nom, options: { bold: true, breakLine: true } }, { text: j + " j" }], { x: xm, y: 2.2, w: w - 0.04, h: 1.1, fontSize: 14, color: col ? C.background1 : C.accent6, align: "center", valign: "middle", margin: 0, isTextBox: true });
  xm += w;
});
s.addText("Un motif = 231 jours = 11 cycles SWOT de 21 jours", { x: 0.6, y: 3.4, w: 12.1, h: 0.4, fontSize: 13, italic: true, color: C.accent6, margin: 0, isTextBox: true });
stat(s, "250", "exemples train (gardés)", 0.6, 4.2, 2.8);
stat(s, "52", "exemples val", 3.6, 4.2, 2.8, C.text2);
stat(s, "96", "exemples test", 6.6, 4.2, 2.8, C.accent2);
stat(s, "150", "dans les trous, non utilisés", 9.6, 4.2, 3.1, C.accent6);
s.addText("Les trous de 21 jours séparent chaque jeu du suivant : deux passages proches dans le temps voient le même océan, ils ne doivent pas se retrouver l'un en train et l'autre en val ou test.", { x: 0.6, y: 5.75, w: 12.1, h: 0.9, fontSize: 15, color: C.text1, margin: 0, valign: "top", isTextBox: true });

// 10 — Dataset PyTorch
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Chaîne de traitement" });
s.addText("Un Dataset PyTorch au format exact de NeurOST", { placeholder: "title" });
etape(s, 8, "Charger · SwotNadirKarinDataset (my_work/scripts/dataset_swot.py), sur les jeux de l'étape 7");
code(s, 'ds = SwotNadirKarinDataset(npz, csv, jeu="train")\nentree, cible = ds[0]\n\nentree.shape   # (30, 1, 128, 128) nadir au jour 15\ncible.shape    # (30, 2134, 3) (x_pix, y_pix, ssh)\n\n# SSH : (ssh - 0.074) / 0.0986  (constantes NeurOST)\n# x_pix = (x + L/2) * 127 / L\n# y_pix = (L/2 - y) * 127 / L   (axe vers le bas)', 0.6, 1.95, 7.4, 3.75, 13);
s.addText("Mêmes formes, même normalisation et mêmes coordonnées pixel que NeurOST_dataset : les poids pré-entraînés (SSH seule) et la loss torch_tracked_mse_interp s'utilisent tels quels.", { x: 0.6, y: 5.95, w: 7.4, h: 1.0, fontSize: 15, color: C.accent6, margin: 0, valign: "top", isTextBox: true });
stat(s, "250 / 52 / 96", "exemples train / val / test (548 gardés sur 671)", 8.5, 1.95, 4.3);
stat(s, "0,98", "corrélation nadir / KaRIn voisin (0,02 si l'image était transposée)", 8.5, 3.45, 4.3);
stat(s, "13,1 cm", "RMSE en validation du modèle pré-entraîné, sans fine-tuning (26,1 cm si SSH = 0)", 8.5, 4.95, 4.3, C.accent2);

// 9 — vigilance
pres.addSection({ title: "Suite" });
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Suite" });
s.addText("Points de vigilance relevés en chemin", { placeholder: "title" });
const pts = [
  ["Fonction projeter", "Trois signatures différentes coexistaient dans le notebook. Unifiée : (lon, lat, lon0, lat0) → x, y, dedans."],
  ["Unités", "L = 960e3 est en mètres (le commentaire disait km). Tout x, y est en m, divisé par 1e3 seulement pour l'affichage."],
  ["Boîte de découpe", "Boîte GS ou emprise de la feuille : le choix change le nombre de points (119 contre 131). À fixer : l'emprise de la feuille."],
  ["Fichiers incomplets", "77 fichiers sans i_num_line (dont 19 en janvier 2025), donc pas de nadir. Ils sont ignorés pour l'instant."],
];
pts.forEach(([t, d], i) => {
  const x = 0.6 + (i % 2) * 6.15, y = 1.6 + Math.floor(i / 2) * 2.6;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.95, h: 2.35, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.12, objectName: "carte " + t });
  s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.42, h: 0.42, fill: { color: i < 2 ? C.accent1 : C.accent2 }, line: { color: i < 2 ? C.accent1 : C.accent2 }, objectName: "pastille" });
  s.addText(i < 2 ? "✓" : "!", { x: x + 0.3, y: y + 0.3, w: 0.42, h: 0.42, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addText(t, { x: x + 0.9, y: y + 0.28, w: 4.8, h: 0.46, fontSize: 20, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true });
  s.addText(d, { x: x + 0.3, y: y + 0.9, w: 5.35, h: 1.3, fontSize: 15, color: C.text1, margin: 0, valign: "top", isTextBox: true });
});
s.addText("✓ corrigé    ! choix ouvert ou limite connue", { x: 0.6, y: 6.85, w: 8, h: 0.35, fontSize: 12, color: C.accent6, margin: 0, isTextBox: true });

// 9 — suite & questions
s = pres.addSlide({ masterName: "TITRE", sectionTitle: "Suite" });
s.addText("Prochaines étapes et questions", { x: 0.8, y: 0.6, w: 11.7, h: 0.9, fontSize: 34, bold: true, color: C.background1, margin: 0, isTextBox: true, fontFace: "Cambria" });
s.addText("À faire", { x: 0.8, y: 1.8, w: 5.6, h: 0.5, fontSize: 20, bold: true, color: C.accent2, margin: 0, isTextBox: true });
s.addText([
  { text: "Boucle d'entraînement : fine-tuning des poids NeurOST SSH seule", options: { bullet: true, breakLine: true } },
  { text: "Calculer la loss sur le jour 15 seulement (les 29 autres jours sont vides)", options: { bullet: true, breakLine: true } },
  { text: "Suivre la RMSE en validation : point de départ 13,1 cm", options: { bullet: true, breakLine: true } },
  { text: "Étendre le dataset aux autres feuilles que la 23", options: { bullet: true } },
], { x: 0.8, y: 2.4, w: 5.6, h: 3.8, fontSize: 17, color: C.background1, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true });
s.addText("À discuter", { x: 7.0, y: 1.8, w: 5.6, h: 0.5, fontSize: 20, bold: true, color: C.accent2, margin: 0, isTextBox: true });
s.addText([
  { text: "NeurOST prend en entrée 30 jours de tous les altimètres. Ici, un seul passage nadir : faut-il ajouter les autres altimètres autour de la date ?", options: { bullet: true, breakLine: true } },
  { text: "Quel seuil minimal de cases KaRIn par feuille ?", options: { bullet: true, breakLine: true } },
  { text: "Cible moyennée à 7,5 km, ou plus fine pour garder la sous-mésoéchelle ?", options: { bullet: true } },
], { x: 7.0, y: 2.4, w: 5.6, h: 4.2, fontSize: 17, color: C.background1, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true });

(async () => {
  await pres.writeFile({ fileName: D + "/NeurOST_paires_nadir_KaRIn.pptx" });
  await applyTheme(D + "/NeurOST_paires_nadir_KaRIn.pptx", THEME);
})();
