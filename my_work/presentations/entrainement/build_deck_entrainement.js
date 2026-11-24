// Deck « Fine-tuning de NeurOST » (notebook 03_entrainement).
// Les courbes sont lues dans runs/*.txt (copie de la sortie de la cellule d'entraînement).
// Construire : NODE_PATH=my_work/presentations/node_modules node my_work/presentations/entrainement/build_deck_entrainement.js
const fs = require("fs");
const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/home/nora/.claude/skills/synced/004ee9c9-1243-4825-9f1e-64699851e149_0983cf1c-d147-48a5-a030-6966af4baac6/pptx/scripts/apply_theme.js");
const D = __dirname;
const SORTIE = D + "/NeurOST_fine_tuning.pptx";

// ---------- runs ----------
const lireRun = f => {
  const txt = fs.readFileSync(D + "/runs/" + f, "utf8");
  const ep = [...txt.matchAll(/époque\s+(\d+)\s+loss train ([\d.]+)\s+RMSE val ([\d.]+)/g)];
  const best = txt.match(/meilleure époque : (\d+), RMSE val ([\d.]+) cm \(avant : ([\d.]+) cm\)/);
  return { loss: ep.map(m => +m[2]), val: ep.map(m => +m[3]), bestEp: +best[1], bestVal: +best[2], avant: +best[3] };
};
const RUN = lireRun("run2_avec_dropout.txt");          // run affiché comme résultat principal
const RUN_SANS = lireRun("run1_sans_dropout.txt");     // run 1 : dropout coupé par erreur (TODO 4)
const RUN_PRINCIPAL_SANS_DROPOUT = false;              // passer à false quand le run corrigé remplace celui-ci
const RES = { testAvant: 12.52, testApres: 11.79, exAvant: 15.2, exApres: 13.7 };   // run 2 (cellules du notebook rejouées de zéro)
const RES_SANS = { testApres: 11.91 };                                              // run 1
const fr = v => v.toFixed(2).replace(".", ",");

// ---------- thème et gabarits (identiques au deck 02) ----------
const THEME = { name: "Ocean NeurOST", headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "1B2631", lt1: "FFFFFF", dk2: "0B3954", lt2: "EEF3F6",
    accent1: "087E8B", accent2: "E07A1F", accent3: "0B3954", accent4: "8AA3B5", accent5: "C81D25", accent6: "5C6B73",
    hlink: "087E8B", folHlink: "5C6B73" } };
const HEX = { navy: "0B3954", teal: "087E8B", orange: "E07A1F", lt2: "EEF3F6", grey: "5C6B73", code: "0F2233", ref: "8AA3B5" };
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.theme = { headFontFace: "Cambria", bodyFontFace: "Calibri" };
pres.title = "Fine-tuning de NeurOST sur les paires nadir → KaRIn";
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

const etape = (s, n, txt) => {
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
const optCourbe = (titre, couleurs, extra = {}) => Object.assign({
  chartColors: couleurs, lineSize: 2, lineDataSymbol: "circle", lineDataSymbolSize: 5,
  showTitle: true, title: titre, titleFontSize: 14, titleColor: HEX.navy, titleFontFace: "+mn-lt",
  showLegend: true, legendPos: "b", legendFontSize: 11, legendFontFace: "+mn-lt", legendColor: HEX.grey,
  catAxisLabelColor: HEX.grey, valAxisLabelColor: HEX.grey, catAxisLabelFontSize: 10, valAxisLabelFontSize: 11,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt",
  showCatAxisTitle: true, catAxisTitle: "époque", catAxisTitleFontSize: 11, catAxisTitleColor: HEX.grey, catAxisTitleFontFace: "+mn-lt",
  valGridLine: { color: "DDE4E9", size: 0.5 }, catGridLine: { style: "none" } }, extra);
const epoques = n => Array.from({ length: n }, (_, i) => String(i + 1));

// 1 — titre
pres.addSection({ title: "Introduction" });
let s = pres.addSlide({ masterName: "TITRE", sectionTitle: "Introduction" });
s.addText("Fine-tuning de NeurOST sur les paires nadir → KaRIn", { placeholder: "title" });
s.addText("Gulf Stream, feuille 23 · notebook 03_entrainement · novembre 2026", { placeholder: "body" });
s.addNotes("Suite du deck sur la construction des paires : ici on réentraîne NeurOST sur ces paires et on mesure le gain.");

// 2 — principe
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Introduction" });
s.addText("On ajuste NeurOST au lieu de repartir de zéro", { placeholder: "title" });
const boites = [
  ["Entrée", "trace nadir SWOT\nau jour 15 sur 30", C.text2],
  ["SimVP", "2,3 M de poids\nappris par NeurOST", C.accent1],
  ["Carte prédite", "128 × 128\npar jour", C.text2],
  ["Comparaison", "lue aux points KaRIn\n→ loss", C.accent2],
];
boites.forEach(([t, d, col], i) => {
  const x = 0.6 + i * 3.2;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.9, w: 2.6, h: 1.9, fill: { color: col }, line: { color: col }, rectRadius: 0.12, objectName: "bloc " + t });
  s.addText([{ text: t, options: { bold: true, fontSize: 20, breakLine: true } }, { text: d, options: { fontSize: 14 } }],
    { x: x + 0.15, y: 1.9, w: 2.3, h: 1.9, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  if (i < 3) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 2.68, y: 2.6, w: 0.44, h: 0.5, fill: { color: C.accent4 }, line: { color: C.accent4 }, objectName: "flèche" });
});
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 4.2, w: 12.1, h: 1.0, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.12, objectName: "retour" });
s.addText("loss.backward() calcule dans quel sens bouger chaque poids ; opt.step() les bouge d'un petit pas. On répète par batch de 4 exemples, sur plusieurs époques.",
  { x: 0.9, y: 4.2, w: 11.5, h: 1.0, fontSize: 16, color: C.text2, valign: "middle", margin: 0, isTextBox: true });
puces(s, [
  "Poids de départ : NeurOST « SSH seule », entraîné sur 1 million d'exemples globaux.",
  "Données : 250 exemples train, 52 val, 96 test (feuille 23, découpage temporel avec trous).",
], 0.6, 5.55, 12.1, 1.3, 16);

// 3 — loss
pres.addSection({ title: "Méthode" });
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Méthode" });
s.addText("La loss ne regarde que les points KaRIn", { placeholder: "title" });
etape(s, 1, "Mesurer l'erreur · torch_tracked_mse_interp de NeurOST, réduite au jour 15");
code(s, 'J = 15\n\ndef perte(pred, cible):\n    # pred  : (B, 30, 1, 128, 128)\n    # cible : (B, 30, 2134, 3)\n    return torch_tracked_mse_interp(\n        pred[:, J:J+1], cible[:, J:J+1])', 0.6, 1.95, 6.2, 2.9, 13);
puces(s, [
  "La carte est lue à chaque point KaRIn par interpolation bilinéaire, puis on fait la moyenne des écarts au carré.",
  "Seul le jour 15 a une cible : sur 30 jours, la loss serait divisée par 30 sans rien apporter.",
  "Hors fauchée, aucun point : ces pixels ne reçoivent aucun gradient et restent ceux de NeurOST.",
], 7.2, 1.95, 5.5, 3.6, 15);
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: 5.2, w: 6.2, h: 1.4, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.12, objectName: "conversion" });
s.addText([{ text: "RMSE ≈ √loss × 9,86 cm", options: { bold: true, fontSize: 22, color: C.text2, breakLine: true } },
  { text: "La loss est en SSH normalisée au carré (std_ssh = 0,0986 m).", options: { fontSize: 14, color: C.accent6 } }],
  { x: 0.9, y: 5.2, w: 5.7, h: 1.4, valign: "middle", margin: 0, isTextBox: true });

// 4 — BatchNorm
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Méthode" });
s.addText("Les BatchNorm doivent rester figées", { placeholder: "title" });
etape(s, 2, "Régler le mode des couches · essai de 8 époques, lr = 1e-4");
const avantBN = 13.24;
s.addChart(pres.charts.LINE, [
  { name: "BatchNorm libres", labels: epoques(8), values: [15.86, 14.26, 12.98, 13.34, 13.23, 13.24, 13.39, 14.73] },
  { name: "BatchNorm figées", labels: epoques(8), values: [12.04, 12.07, 11.99, 12.06, 12.13, 12.17, 12.11, 12.19] },
  { name: "avant fine-tuning", labels: epoques(8), values: Array(8).fill(avantBN) },
], Object.assign(optCourbe("RMSE validation (cm)", [HEX.orange, HEX.teal, HEX.ref]), { x: 0.6, y: 1.95, w: 6.6, h: 4.9, valAxisMinVal: 11, valAxisMaxVal: 16.5 }));
puces(s, [
  "Une BatchNorm recentre les valeurs avec des statistiques. En entraînement, elle prend celles du batch courant.",
  "Nos batchs : 4 exemples, 29 jours vides sur 30. Rien à voir avec le million d'exemples d'origine.",
  "Libres : la validation se dégrade dès la 1re époque (15,9 cm). Figées : elle descend tout de suite (12,0 cm).",
  "Même piège au chargement : un modèle neuf est en mode entraînement, d'où model.eval() juste après.",
], 7.6, 1.95, 5.1, 4.9, 15);

// 5 — boucle
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Méthode" });
s.addText("Quatre lignes font apprendre le réseau", { placeholder: "title" });
etape(s, 3, "Entraîner · Adam, lr = 3e-5, 30 époques, on garde la meilleure en validation");
code(s, 'for epoque in range(1, 31):\n    mode_entrainement(model)   # dropout actif, BatchNorm figées\n    for x, y in dl_train:\n        opt.zero_grad()            # 1. gradients à zéro\n        loss = perte(model(x), y)  # 2. prédire, mesurer\n        loss.backward()            # 3. gradients\n        opt.step()                 # 4. bouger les poids\n    rmse_val = rmse_cm(model, dl_val)\n    if rmse_val < meilleure_rmse:\n        meilleurs_poids = copy.deepcopy(model.state_dict())', 0.6, 1.95, 7.6, 4.1, 13);
puces(s, [
  "lr = 1e-4 : sur-apprend dès 3 ou 4 époques.",
  "lr = 3e-5 ou 1e-5 : même plateau vers 12,0 cm ; 3e-5 y arrive plus vite.",
  "On garde les poids de la meilleure époque en validation, pas ceux de la dernière.",
  "Une époque prend environ 2 s sur une RTX 4090.",
], 8.6, 1.95, 4.1, 4.4, 15);

// 6 — courbes
pres.addSection({ title: "Résultats" });
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Résultats" });
s.addText(`Meilleur modèle à l'époque ${RUN.bestEp}, puis sur-apprentissage`, { placeholder: "title" });
etape(s, 4, RUN_PRINCIPAL_SANS_DROPOUT ? "Lire les courbes · run 1 (dropout désactivé par erreur, voir points de vigilance)" : "Lire les courbes · run 2, dropout actif, exécuté de zéro");
const n = RUN.loss.length;
s.addChart(pres.charts.LINE, [{ name: "loss train", labels: epoques(n), values: RUN.loss }],
  Object.assign(optCourbe("Loss d'entraînement (normalisée)", [HEX.navy], { showLegend: false }), { x: 0.6, y: 1.95, w: 5.9, h: 4.3 }));
s.addChart(pres.charts.LINE, [
  { name: "RMSE val", labels: epoques(n), values: RUN.val },
  { name: "avant fine-tuning", labels: epoques(n), values: Array(n).fill(RUN.avant) },
], Object.assign(optCourbe("RMSE validation (cm)", [HEX.teal, HEX.ref]), { x: 6.8, y: 1.95, w: 5.9, h: 4.3 }));
s.addText(`La loss train baisse sans arrêt (${fr(RUN.loss[0])} → ${fr(RUN.loss[n - 1])}) : le réseau apprend ses 250 exemples par cœur. La validation, elle, est au plus bas à l'époque ${RUN.bestEp} (${fr(RUN.bestVal)} cm), puis remonte à ${fr(RUN.val[n - 1])} cm.`,
  { x: 0.6, y: 6.35, w: 12.1, h: 0.7, fontSize: 14, color: C.accent6, margin: 0, valign: "top", isTextBox: true });

// 7 — résultats
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Résultats" });
s.addText("Un gain de 0,7 cm en test, visible sous la fauchée", { placeholder: "title" });
etape(s, 5, "Mesurer · validation pour choisir, test une seule fois pour conclure");
stat(s, `${fr(RUN.avant)} → ${fr(RUN.bestVal)}`, "RMSE validation (cm), meilleure époque", 0.6, 1.95, 4.0);
stat(s, `${fr(RES.testAvant)} → ${fr(RES.testApres)}`, "RMSE test (cm), jamais utilisé pour un choix", 4.7, 1.95, 4.0, C.accent2);
stat(s, `${RES.exAvant.toFixed(1).replace(".", ",")} → ${RES.exApres.toFixed(1).replace(".", ",")}`, "RMSE sous la fauchée (cm), exemple val n° 10", 8.8, 1.95, 3.9, C.text2);
s.addImage({ path: D + "/figures/fauchee_run2.png", x: 1.15, y: 3.55, w: 11.0, h: 11.0 * 459 / 1800, altText: "Exemple de validation sous la fauchée : prédiction avant, prédiction après, vérité KaRIn et erreur après fine-tuning" });
s.addText("Sous la fauchée : prédiction avant, après, vérité KaRIn, erreur après. Le fine-tuning resserre le tourbillon froid ; les plus grosses erreurs restent le long du front et du tourbillon.",
  { x: 0.6, y: 6.35, w: 12.1, h: 0.7, fontSize: 14, color: C.accent6, margin: 0, valign: "top", isTextBox: true });

// 7b — avec ou sans dropout
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Résultats" });
s.addText("Le dropout freine le sur-apprentissage", { placeholder: "title" });
etape(s, 6, "Comparer · run 1 (dropout coupé par erreur) et run 2 (dropout actif), mêmes réglages");
const n2 = Math.min(RUN.val.length, RUN_SANS.val.length);
s.addChart(pres.charts.LINE, [
  { name: "avec dropout (run 2)", labels: epoques(n2), values: RUN.val.slice(0, n2) },
  { name: "sans dropout (run 1)", labels: epoques(n2), values: RUN_SANS.val.slice(0, n2) },
  { name: "avant fine-tuning", labels: epoques(n2), values: Array(n2).fill(RUN.avant) },
], Object.assign(optCourbe("RMSE validation (cm)", [HEX.teal, HEX.orange, HEX.ref]), { x: 0.6, y: 1.95, w: 7.4, h: 4.9 }));
stat(s, `${fr(RUN.val[n2 - 1])} / ${fr(RUN_SANS.val[n2 - 1])}`, "RMSE val à l'époque 30 (cm), avec / sans", 8.4, 2.0, 4.4);
stat(s, `${fr(RUN.bestVal)} / ${fr(RUN_SANS.bestVal)}`, "meilleure RMSE val (cm), avec / sans", 8.4, 3.5, 4.4, C.text2);
stat(s, `${fr(RES.testApres)} / ${fr(RES_SANS.testApres)}`, "RMSE test (cm), avec / sans", 8.4, 5.0, 4.4, C.accent2);
s.addNotes("Le dropout éteint au hasard une partie des neurones à chaque batch : le réseau ne peut pas s'appuyer sur un détail précis d'un exemple pour le mémoriser. Sans lui, la loss train descend à 0,80 et la validation remonte à 14,5 cm. Le meilleur point est presque le même : ce qui change surtout, c'est la vitesse à laquelle le modèle se dégrade ensuite.");

// 7c — toutes les feuilles : courbe
const HIST = JSON.parse(fs.readFileSync(D + "/runs/runs_toutes_feuilles_historique.json", "utf8"));
const LOG_TF = fs.readFileSync(D + "/runs/log_entrainement_toutes_feuilles.txt", "utf8");
const avantTF = +LOG_TF.match(/RMSE val avant fine-tuning : ([\d.]+) cm/)[1];
const bestTF = LOG_TF.match(/meilleur pas : (\d+) \(époque ([\d.]+)\), RMSE val ([\d.]+) cm/);
const testTF = [...LOG_TF.matchAll(/TEST (.+?)\s+: toutes feuilles ([\d.]+) cm \| feuille 23 \((\d+) ex\.\) ([\d.]+) cm/g)]
  .map(m => ({ nom: m[1].trim(), tout: +m[2], f23: +m[4] }));
pres.addSection({ title: "Toutes les feuilles" });
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Toutes les feuilles" });
s.addText("Sur 44 feuilles, tout le gain arrive en 500 pas", { placeholder: "title" });
etape(s, 7, "Étendre · 10 360 exemples d'entraînement (676 passages), validation tous les 500 pas, mêmes réglages");
const pasLab = HIST.map(h => String(h.pas));
s.addChart(pres.charts.LINE, [
  { name: "RMSE val", labels: ["0", ...pasLab], values: [avantTF, ...HIST.map(h => +h.rmse_val.toFixed(2))] },
  { name: "avant fine-tuning", labels: ["0", ...pasLab], values: Array(HIST.length + 1).fill(avantTF) },
], Object.assign(optCourbe("RMSE validation, 44 feuilles (cm)", [HEX.teal, HEX.ref], { catAxisTitle: "pas d'apprentissage", catAxisLabelRotate: 270 }), { x: 0.6, y: 1.95, w: 7.4, h: 4.9, valAxisMinVal: 9, valAxisMaxVal: 11 }));
stat(s, `${fr(avantTF)} → ${fr(+bestTF[3])}`, "RMSE validation (cm), avant → meilleur point", 8.4, 2.0, 4.4);
stat(s, `${fr(HIST[0].rmse_val)} cm`, "dès 500 pas, soit 1/5 d'époque", 8.4, 3.5, 4.4, C.text2);
s.addText("Ensuite, plus rien ne bouge pendant 10 000 pas : ni gain, ni sur-apprentissage. Le réseau ne s'adapte qu'une fois, très vite.",
  { x: 8.4, y: 5.0, w: 4.4, h: 1.6, fontSize: 15, color: C.text1, margin: 0, valign: "top", isTextBox: true });
s.addNotes("Une époque fait maintenant 2 590 pas (contre 63 sur la feuille 23 seule), d'où une validation tous les 500 pas au lieu de chaque époque. La validation sur toutes les feuilles part de 10,66 cm, plus bas que les 13,24 cm de la feuille 23 : les feuilles du bord sont plus calmes que le cœur du Gulf Stream.");

// 7d — toutes les feuilles : test
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Toutes les feuilles" });
s.addText("Entraîner sur une seule feuille suffit presque", { placeholder: "title" });
etape(s, 8, "Tester · trois modèles sur le même test (4 048 exemples, 264 passages)");
s.addChart(pres.charts.BAR, [
  { name: "test, 44 feuilles", labels: testTF.map(t => t.nom), values: testTF.map(t => t.tout) },
  { name: "test, feuille 23 (96 ex.)", labels: testTF.map(t => t.nom), values: testTF.map(t => t.f23) },
], { x: 0.6, y: 1.95, w: 7.4, h: 4.9, barDir: "col", barGrouping: "clustered", chartColors: [HEX.teal, HEX.navy],
  showTitle: true, title: "RMSE de test (cm)", titleFontSize: 14, titleColor: HEX.navy, titleFontFace: "+mn-lt",
  showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.00", dataLabelFontSize: 11, dataLabelColor: HEX.grey, dataLabelFontFace: "+mn-lt",
  showLegend: true, legendPos: "b", legendFontSize: 11, legendFontFace: "+mn-lt", legendColor: HEX.grey,
  catAxisLabelColor: HEX.grey, valAxisLabelColor: HEX.grey, catAxisLabelFontSize: 11, valAxisLabelFontSize: 11,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", valAxisMinVal: 0,
  valGridLine: { color: "DDE4E9", size: 0.5 }, catGridLine: { style: "none" }, barGapWidthPct: 60 });
puces(s, [
  `Sur les 44 feuilles : ${fr(testTF[0].tout)} → ${fr(testTF[2].tout)} cm. Le modèle de la feuille 23 seule fait déjà ${fr(testTF[1].tout)} cm.`,
  `Sur la feuille 23 : ${fr(testTF[1].f23)} cm dans les deux cas. 2,7 fois plus de passages n'apportent rien.`,
  "Le fine-tuning améliore 43 feuilles sur 44 (gain médian 0,83 cm). Exception : la feuille 39, au nord-ouest, avec seulement 11 exemples de test.",
  "Hypothèse : le réseau apprend surtout à lire notre entrée inhabituelle (une trace, un seul jour), pas l'océan du Gulf Stream.",
], 8.4, 1.95, 4.4, 4.9, 14);

// 8 — vigilance
pres.addSection({ title: "Suite" });
s = pres.addSlide({ masterName: "CONTENU", sectionTitle: "Suite" });
s.addText("Points de vigilance relevés en chemin", { placeholder: "title" });
const pts = [
  ["BatchNorm figées", "Libres, elles dégradent la validation de 13,2 à 15,9 cm dès la 1re époque. On les remet en mode évaluation à chaque époque.", true],
  ["model.eval() au chargement", "Un modèle neuf est en mode entraînement : un simple appel de test modifiait déjà les BatchNorm et faussait la RMSE de départ.", true],
  ["Loss sur le jour 15", "La loss NeurOST moyenne les 30 jours : avec 29 jours vides, elle serait divisée par 30. On la restreint au jour 15.", true],
  RUN_PRINCIPAL_SANS_DROPOUT
    ? ["Dropout coupé (run 1)", "Un « ; » à la place d'un « if » mettait tout le modèle en évaluation, dropout compris. Corrigé, le run est à relancer.", false]
    : ["État du notebook", "Relancer seulement la boucle repartait du modèle déjà entraîné. Pour tout changement d'entraînement : Restart + Run All.", false],
];
pts.forEach(([t, d, ok], i) => {
  const x = 0.6 + (i % 2) * 6.15, y = 1.6 + Math.floor(i / 2) * 2.6;
  const col = ok ? C.accent1 : C.accent2;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.95, h: 2.35, fill: { color: C.background2 }, line: { color: C.background2 }, rectRadius: 0.12, objectName: "carte " + t });
  s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.42, h: 0.42, fill: { color: col }, line: { color: col }, objectName: "pastille" });
  s.addText(ok ? "✓" : "!", { x: x + 0.3, y: y + 0.3, w: 0.42, h: 0.42, fontSize: 16, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
  s.addText(t, { x: x + 0.9, y: y + 0.28, w: 4.8, h: 0.46, fontSize: 20, bold: true, color: C.text2, margin: 0, valign: "middle", isTextBox: true });
  s.addText(d, { x: x + 0.3, y: y + 0.9, w: 5.35, h: 1.3, fontSize: 15, color: C.text1, margin: 0, valign: "top", isTextBox: true });
});
s.addText("✓ réglé    ! à reprendre ou limite connue", { x: 0.6, y: 6.85, w: 8, h: 0.35, fontSize: 12, color: C.accent6, margin: 0, isTextBox: true });

// 9 — suite
s = pres.addSlide({ masterName: "TITRE", sectionTitle: "Suite" });
s.addText("Prochaines étapes et questions", { x: 0.8, y: 0.6, w: 11.7, h: 0.9, fontSize: 34, bold: true, color: C.background1, margin: 0, isTextBox: true, fontFace: "Cambria" });
s.addText("À faire", { x: 0.8, y: 1.8, w: 5.6, h: 0.5, fontSize: 20, bold: true, color: C.accent2, margin: 0, isTextBox: true });
s.addText([
  ...(RUN_PRINCIPAL_SANS_DROPOUT ? [{ text: "Relancer l'entraînement avec le dropout actif et comparer au run 1", options: { bullet: true, breakLine: true } }] : []),
  { text: "Mesurer la variabilité : 3 à 5 graines par configuration", options: { bullet: true, breakLine: true } },
  { text: "Comparer à DUACS sous la fauchée, sur le jeu de test", options: { bullet: true } },
], { x: 0.8, y: 2.4, w: 5.6, h: 3.8, fontSize: 17, color: C.background1, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true });
s.addText("À discuter", { x: 7.0, y: 1.8, w: 5.6, h: 0.5, fontSize: 20, bold: true, color: C.accent2, margin: 0, isTextBox: true });
s.addText([
  { text: "Plus de passages n'aide pas : la limite est l'information en entrée. Ajouter les autres altimètres sur 30 jours ?", options: { bullet: true, breakLine: true } },
  { text: "Le gain vient-il d'une recalibration à notre entrée inhabituelle ? Tester avec une entrée plus proche de l'usage normal de NeurOST.", options: { bullet: true } },
], { x: 7.0, y: 2.4, w: 5.6, h: 4.2, fontSize: 17, color: C.background1, paraSpaceAfter: 10, valign: "top", margin: 0, isTextBox: true });

(async () => {
  await pres.writeFile({ fileName: SORTIE });
  await applyTheme(SORTIE, THEME);
  console.log("écrit", SORTIE);
})();
