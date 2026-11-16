# CLAUDE.md — Cœur Code NEXT

Application de **speed dating** pour les soirées de célibataires francophones de Tel Aviv, créée à l'origine pour une soirée de Tou B'Av. Elle propose des rounds chronométrés, des votes secrets et la révélation des matchs réciproques. Chaque participant a un thème : lettre hébraïque, couleur ou planète. Le QR code est en forme de cœur.

## Fichiers
| Fichier | Rôle |
|---|---|
| `index.html` | App participant, sur le téléphone |
| `ecran.html` | Écran géant de la soirée |
| `console.html` | Console de l'animateur |
| `qr_coeur.png` | QR code en cœur qui mène à l'app |

Le site est **statique** (HTML + JS inline, sans build), hébergé sur GitHub Pages. Le **backend est un Google Apps Script** (une URL `script.google.com/macros/s/…/exec`, la même dans les 3 pages) avec une Google Sheet comme base. Le code de l'Apps Script **n'est pas dans ce dépôt**.

## Vérifier
```bash
python3 -m http.server 8000    # puis /, /ecran.html, /console.html
```
Il n'y a pas de tests automatisés. Pour simuler une soirée, ouvre la console, l'écran et 2 participants (dont un en navigation privée). Pour les captures et les parcours, utilise le skill **playwright** du dépôt. ⚠️ En local, les pages parlent au **vrai** Apps Script, donc à la vraie feuille.

## Règles de travail
- Si l'URL de l'Apps Script change, mets-la à jour **dans les 3 pages en même temps**.
- Les votes restent secrets : un participant ne voit un match que s'il est réciproque. Ne jamais afficher qui a voté pour qui.
- Interface en français, pensée pour un téléphone tenu d'une main pendant une soirée : gros boutons, lisible dans la pénombre.
- Ne vide jamais et ne modifie jamais les données de la Google Sheet sans la confirmation de Lionel.
- Travaille sur une branche avec une PR. « **yallah** » veut dire : fusionne dans `main`, puis vérifie la publication.
- Ne dis jamais qu'une chose est testée si elle ne l'a pas été.
