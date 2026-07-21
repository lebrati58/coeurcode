# ❤ CŒUR CODE NEXT v3 — L'app complète (voir CONCEPT.md)

**Architecture** : app web (aucune installation, on scanne le QR cœur et c'est ouvert)
+ écran géant + backend Google Apps Script (base de données = ton Google Sheet).
Plus de Google Forms : tout passe par l'app. Rondes illimitées, décidées le soir même.
Coût : 0 ₪. Mise en place : ~15 min.

## 1. Le backend (5 min)
1. Créer un Google Sheet vierge, le nommer "Cœur Code NEXT".
2. Extensions → Apps Script → coller `Code.gs` → Enregistrer.
3. **Déployer → Nouveau déploiement → ⚙ Application Web** :
   - Exécuter en tant que : **Moi**
   - Accès : **Tout le monde**
   - Déployer → autoriser → **copier l'URL qui finit par `/exec`** = l'API_URL.
4. Recharger le Sheet : le menu **💘 Cœur Code** apparaît.
5. Menu 💘 → **🔑 Définir le code de la soirée** (ex : TOUBAV26).
   Ce code s'affiche à l'entrée : sans lui, impossible de s'inscrire — c'est ce
   qui empêche n'importe qui sur internet de polluer ta soirée.

## 2. Le site (5 min)
1. Dans `app.html` ET `ecran.html` : remplacer `COLLE_ICI_L_URL_EXEC_DE_L_APPS_SCRIPT` par l'API_URL.
2. Renommer `app.html` en `index.html` (c'est la page que le QR ouvre).
```bash
mkdir coeurcode && cd coeurcode   # y mettre index.html (ex-app.html) + ecran.html
git init && git add . && git commit -m "Coeur Code NEXT"
gh repo create coeurcode --public --source=. --push
```
3. GitHub → Settings → Pages → Deploy from branch → main → /root.
- App participants : `https://<user>.github.io/coeurcode/`
- Écran géant : `https://<user>.github.io/coeurcode/ecran.html?code=TONCODE`

## Sécurité (v3.1)
- Inscription protégée par le code de la soirée (affiché à l'entrée uniquement).
- Chaque participant reçoit un token privé aléatoire : impossible de voter à la
  place de quelqu'un ou de lire ses infos avec un simple numéro.
- Un seul vote par personne et par ronde (revoter remplace l'ancien vote).
- Toutes les entrées sont validées et neutralisées côté serveur (anti-spam,
  anti-injection de formules Sheets).
- Après la soirée : menu 💘 → Exporter les contacts, puis pense à supprimer
  les données du Sheet (ou Réinitialiser) une fois les mises en relation faites.

## 3. Le QR cœur (1 min)
```bash
pip install qrcode pillow
python3 genere_qr.py "https://<user>.github.io/coeurcode/" qr_coeur.png
```
Imprimer en A3 pour l'entrée (+ le mettre sur les tables).

## 4. Test avant la soirée (5 min)
Ouvrir l'app sur ton téléphone, t'inscrire → tu reçois le n°1.
Dans le Sheet : menu 💘 → "Lancer la ronde suivante" → l'écran géant affiche
l'horloge, ton téléphone affiche ta table. Menu → "Réinitialiser toute la soirée"
pour repartir à zéro avant le jour J.

## 5. Le soir — pilotage 100% depuis le menu 💘 du Sheet (téléphone ou PC)
| Action | Écran géant | Téléphones |
|---|---|---|
| (rien — accueil) | Classement live + compteur d'inscrits | Inscription → numéro perso |
| ▶ LANCER LA RONDE SUIVANTE | Horloge 5:00 + paires par table | "Table 5 — tu dates Léa · 78%" + chrono |
| ⏳ Ouvrir les votes | "Votez sur vos téléphones" | Deux gros boutons ❤ / ✖ (cible automatique) |
| 🍸 Pause | Écran pause | Écran pause |
| 🎆 RÉVÉLATION FINALE | Coups de cœur mutuels publics | **Ses matchs à soi, en privé** |

Cycle : Lancer ronde → 5 min → Ouvrir votes → ~1 min → Lancer ronde suivante.
Autant de rondes que tu veux — tu décides sur place selon le nombre de participants.
"↺ Relancer le chrono" si besoin de refaire partir les 5 minutes.

## Détails qui comptent
- Numéros attribués automatiquement à l'inscription (1, 2, 3…) — prévois quand
  même des étiquettes autocollantes : chacun écrit son numéro dessus en arrivant.
- Le vote est ciblé automatiquement : le serveur sait qui date qui, personne ne
  tape de numéro. Un ❤ donné = +6 pts de priorité dans l'algorithme ensuite.
- Genres déséquilibrés : les personnes en trop passent la ronde au bar et
  reviennent automatiquement à la suivante.
- Si un téléphone est rechargé/perdu : l'identité est gardée dans le navigateur ;
  en dernier recours la personne se réinscrit et prend un nouveau numéro.
