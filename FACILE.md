# ❤ CŒUR CODE NEXT — La méthode FACILE (zéro terminal, zéro OpenClaw)

Tout se fait dans le navigateur. ~12 minutes.

## Étape 1 — Le backend Google (5 min)
1. Va sur **sheets.new** (idéalement connecté avec un compte Google dédié à l'événement).
2. Extensions → Apps Script → **Ctrl+A pour tout sélectionner, Supprimer**, puis colle `Code.gs` → 💾 Enregistrer.
3. Bouton bleu **Déployer → Nouveau déploiement → ⚙ → Application Web** :
   Exécuter en tant que : **Moi** · Accès : **Tout le monde** → Déployer → Autoriser.
4. **Copie l'URL qui finit par /exec** (garde-la sous la main).
5. Retourne dans le Sheet, recharge la page → menu **💘 Cœur Code** →
   **🔑 Définir le code de la soirée** (ex : NEXT-7842).

## Étape 2 — Coller l'URL dans les 2 fichiers (2 min)
Ouvre `index.html` puis `ecran.html` avec le Bloc-notes (clic droit → Ouvrir avec).
Tout en haut du bloc `<script>`, remplace :
```
COLLE_ICI_L_URL_EXEC_DE_L_APPS_SCRIPT
```
par ton URL /exec (en gardant les guillemets autour). Enregistre.

## Étape 3 — Le site GitHub (3 min, à la souris)
1. **github.com** → bouton vert **New** (nouveau dépôt) → nom : `coeurcode` →
   **Public** → Create repository.
2. Lien **"uploading an existing file"** → glisse-dépose `index.html` et
   `ecran.html` → bouton vert **Commit changes**.
3. **Settings → Pages** → Source : "Deploy from a branch" → Branch : **main** /
   **(root)** → Save. Attends 1-2 minutes.

Tes adresses :
- 📱 App : `https://TON_USER.github.io/coeurcode/`
- 📺 Écran : `https://TON_USER.github.io/coeurcode/ecran.html?code=TONCODE`

## Étape 4 — Le QR cœur (0 min pour toi)
Donne l'adresse de l'app à Claude, qui génère le QR cœur final et vérifie
qu'il scanne. (Ou envoie à OpenClaw la seule tâche qui lui reste :
`pip install qrcode pillow && python3 genere_qr.py "https://TON_USER.github.io/coeurcode/" qr.png`)

## Étape 5 — Test (3 min)
Téléphone → ouvre l'app → inscris-toi avec le code → tu es n°1.
PC → ouvre l'écran. Sheet → menu 💘 → **▶ Lancer la ronde suivante**.
(Il faut au moins 1 femme + 1 homme inscrits pour voir une paire.)
Fini le test ? Menu 💘 → **⚠ Réinitialiser**.

## Pour modifier un fichier plus tard sans rien réinstaller
GitHub → clique sur le fichier → icône ✏ (crayon) → modifie → Commit changes.
Le site se met à jour en ~1 minute.

## Après la soirée (sécurité)
1. Menu 💘 → 📧 Exporter les contacts → fais tes mises en relation.
2. Apps Script → Déployer → Gérer les déploiements → **Archiver** (l'API s'éteint).
3. Menu 💘 → ⚠ Réinitialiser (efface les données personnelles).
