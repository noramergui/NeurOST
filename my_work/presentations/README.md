# Présentation encadrants : paires nadir → KaRIn

- `make_figures.py <dossier_sortie>` : régénère les figures depuis le notebook 02 (à lancer depuis la racine du projet).
- `build_deck.js` : construit `NeurOST_paires_nadir_KaRIn.pptx` (pptxgenjs).

    python3 my_work/presentations/make_figures.py my_work/presentations/figures
    NODE_PATH=my_work/presentations/node_modules node my_work/presentations/build_deck.js

# Deck 2 : fine-tuning (notebook 03)

Dans `entrainement/`. Les courbes sont lues dans `entrainement/runs/*.txt` (copie de la sortie de la cellule d'entraînement), les figures sont extraites des sorties du notebook.

    NODE_PATH=my_work/presentations/node_modules node my_work/presentations/entrainement/build_deck_entrainement.js
