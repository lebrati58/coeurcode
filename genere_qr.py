#!/usr/bin/env python3
"""
❤ Cœur Code — QR code EN FORME DE CŒUR (v2).
La silhouette entière est un cœur rempli de petits cœurs.
Astuce : les modules du vrai QR sont foncés (lus par le scanner),
les modules décoratifs qui complètent la forme sont rose clair
(vus comme "blanc" par le scanner). Le tout scanne parfaitement.

Usage : python3 genere_qr.py "https://ton-url/" sortie.png
"""
import sys, math
import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw

URL = sys.argv[1] if len(sys.argv) > 1 else "https://EXEMPLE.github.io/coeurcode/"
OUT = sys.argv[2] if len(sys.argv) > 2 else "qr_coeur.png"

FONCE = (27, 24, 20)        # modules réels (lus par le scanner)
CLAIR = (223, 195, 133)     # modules décoratifs (ignorés par le scanner)
TRES_CLAIR = (247, 240, 224)  # "blanc" du QR, légèrement teinté pour fondre

# --- 1. Matrice QR (correction H) ---
qr = qrcode.QRCode(error_correction=ERROR_CORRECT_H, border=0, box_size=1)
qr.add_data(URL)
qr.make(fit=True)
m = qr.get_matrix()
n = len(m)  # ex: 37 modules

# --- 2. Grille cœur ---
# Le cœur est défini sur une grille de cellules ; le QR est incrusté dans la
# partie large du cœur, le reste est rempli de cellules décoratives.
QUIET = 2
MOD = 30

def _dans(cx, cy, G):
    x = (cx / G) * 2.7 - 1.35
    y = 1.15 - (cy / G) * 2.55
    return (x*x + y*y - 1)**3 - x*x * y*y*y <= 0

# Recherche de la plus petite grille où le QR (+ zone de silence) remplit
# au maximum le cœur.
S = n + 2*QUIET
G = qx = qy = None
for g in range(int(n*1.2), int(n*2.5)):
    x0 = (g - S) // 2
    for y0 in range(0, g - S):
        if all(_dans(x0+c+.5, y0+r+.5, g) for r in range(S) for c in range(S)):
            G, qx, qy = g, x0 + QUIET, y0 + QUIET
            break
    if G: break

def dans_coeur(cx, cy):
    return _dans(cx, cy, G)

W = H = G * MOD + MOD * 4
img = Image.new("RGB", (W, H), "white")
d = ImageDraw.Draw(img)
ox = oy = MOD * 2

def coeur(draw, cx, cy, taille, couleur):
    pts = []
    for i in range(60):
        t = math.pi * 2 * i / 60
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2*t) - 2 * math.cos(3*t) - math.cos(4*t)
        pts.append((cx + x * taille / 32, cy - y * taille / 32))
    draw.polygon(pts, fill=couleur)

def est_finder(r, c):
    return (r < 7 and c < 7) or (r < 7 and c >= n-7) or (r >= n-7 and c < 7)

for gy in range(G):
    for gx in range(G):
        if not dans_coeur(gx + .5, gy + .5):
            continue
        px = ox + gx * MOD + MOD/2
        py = oy + gy * MOD + MOD/2
        r, c = gy - qy, gx - qx
        if 0 <= r < n and 0 <= c < n:
            # ----- zone du vrai QR -----
            if m[r][c]:
                if est_finder(r, c):
                    d.rounded_rectangle([px-MOD/2, py-MOD/2, px+MOD/2, py+MOD/2],
                                        radius=MOD*0.22, fill=FONCE)
                else:
                    coeur(d, px, py + MOD*0.04, MOD * 1.16, FONCE)
            else:
                coeur(d, px, py + MOD*0.04, MOD * 0.72, TRES_CLAIR)
        elif -QUIET <= r < n + QUIET and -QUIET <= c < n + QUIET:
            # ----- zone de silence : quasi blanc -----
            coeur(d, px, py + MOD*0.04, MOD * 0.55, TRES_CLAIR)
        else:
            # ----- remplissage décoratif du cœur -----
            coeur(d, px, py + MOD*0.04, MOD * 1.16, CLAIR)

img.save(OUT)
print(f"OK : {OUT} ({W}x{H}px) · QR v{qr.version} ({n} modules) · grille cœur {G}x{G} · URL = {URL}")
