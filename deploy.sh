#!/bin/bash
# ❤ Cœur Code PULSE — déploiement en une commande
# Usage : ./deploy.sh "https://script.google.com/macros/s/XXXX/exec" "utilisateur_github"
set -e

API_URL="$1"
GH_USER="$2"
[ -z "$API_URL" ] || [ -z "$GH_USER" ] && { echo "Usage: ./deploy.sh URL_EXEC USER_GITHUB"; exit 1; }

echo "→ 1/5 Injection de l'URL de l'API dans les fichiers…"
sed -i "s|COLLE_ICI_L_URL_EXEC_DE_L_APPS_SCRIPT|$API_URL|g" app.html ecran.html
[ -f index.html ] || mv app.html index.html

echo "→ 2/5 Création du dépôt GitHub…"
git init -q 2>/dev/null || true
git add index.html ecran.html
git commit -qm "Coeur Code PULSE" || true
if gh repo view "$GH_USER/coeurcode" >/dev/null 2>&1; then
  git remote add origin "https://github.com/$GH_USER/coeurcode.git" 2>/dev/null || true
  git branch -M main && git push -qu origin main --force
else
  gh repo create coeurcode --public --source=. --push
fi

echo "→ 3/5 Activation de GitHub Pages…"
gh api "repos/$GH_USER/coeurcode/pages" -X POST \
  -F "source[branch]=main" -F "source[path]=/" >/dev/null 2>&1 || echo "   (Pages déjà actif ou à activer à la main : Settings → Pages → main /root)"

echo "→ 4/5 Génération du QR cœur…"
python3 -m pip install --quiet qrcode pillow 2>/dev/null || python3 -m pip install --quiet --break-system-packages qrcode pillow
python3 genere_qr.py "https://$GH_USER.github.io/coeurcode/" qr_coeur.png

echo "→ 5/5 Terminé !"
echo ""
echo "   📱 App participants : https://$GH_USER.github.io/coeurcode/"
echo "   📺 Écran géant      : https://$GH_USER.github.io/coeurcode/ecran.html"
echo "   ❤  QR cœur          : $(pwd)/qr_coeur.png"
echo ""
echo "   (Pages peut mettre 1-2 min à se mettre en ligne la première fois.)"
