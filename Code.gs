/**
 * ❤ CŒUR CODE NEXT v3.2 — Backend sécurisé + tenue de charge 100+ participants
 * ⚠ COLLAGE : dans Apps Script, EFFACER TOUT le contenu par défaut
 *   (y compris "function myFunction() {}") avant de coller ce fichier.
 * Puis : Déployer → Nouveau déploiement → Application Web →
 *   Exécuter en tant que : MOI · Accès : TOUT LE MONDE → copier l'URL /exec.
 *
 * Sécurité :
 *  - Code de soirée obligatoire pour s'inscrire (menu 💘 → "Définir le code").
 *  - Chaque participant reçoit un TOKEN privé aléatoire : impossible de voter
 *    ou de lire l'état de quelqu'un d'autre avec un simple numéro.
 *  - Un seul vote par personne et par ronde (revoter remplace l'ancien).
 *  - Toutes les entrées sont validées et neutralisées (anti-injection de formules).
 */

const DUREE_DATE_MIN = 5;
const MAX_PARTICIPANTS = 300;

/* ---- Cache serveur (indispensable pour 100+ téléphones qui interrogent l'API) ---- */
const CACHE = CacheService.getScriptCache();
function cGet(k) { try { const v = CACHE.get(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function cPut(k, obj, sec) { try { CACHE.put(k, JSON.stringify(obj), sec); } catch (e) {} }
function cDel(ks) { try { CACHE.removeAll(ks); } catch (e) {} }
function cViderTout() { cDel(['cfg', 'codeS', 'ecran', 'personnes', 'affichage', 'matchs']); }

const POIDS = [12, 14, 20, 7, 6, 6, 8, 12, 7, 8];
const ECHELLES = [
  { 'oui': 1, 'partiellement': 0.5, 'non': 0 },
  { 'oui': 1, 'souvent': 0.7, 'parfois': 0.35, 'non': 0 },
  { 'oui': 1, 'déjà parent': 0.9, 'plus tard': 0.7, 'non': 0 },
  { 'oui, beaucoup': 1, 'un peu': 0.5, 'pas vraiment': 0 },
  { 'oui': 1, 'de temps en temps': 0.5, 'non': 0 },
  { "oui, j'en ai": 1, 'moyennement': 0.5, 'très occupé(e)': 0 },
  { 'oui': 1, 'occasionnellement': 0.5, 'non': 0 },
  { 'oui': 1, 'non': 0 },
  null, null
];
// Réponses autorisées (en minuscules) — toute autre réponse est rejetée.
const AUTORISEES = [
  ['oui','non','partiellement'],
  ['oui','souvent','parfois','non'],
  ['oui','plus tard','non','déjà parent'],
  ['oui, beaucoup','un peu','pas vraiment'],
  ['oui','de temps en temps','non'],
  ["oui, j'en ai",'moyennement','très occupé(e)'],
  ['oui','occasionnellement','non'],
  ['oui','non'],
  ['communication','respect','complicité','valeurs'],
  ['carrière','famille','équilibre','aventure','autre']
];

/* ================= API WEB ================= */
function doPost(e) {
  try {
    if (!e.postData || e.postData.length > 5000) return json({ erreur: 'requête invalide' });
    const d = JSON.parse(e.postData.contents);
    if (d.action === 'inscription') {
      // Verrou UNIQUEMENT pour l'inscription (numéros séquentiels uniques)
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(20000)) return json({ erreur: 'grosse affluence — réessaie dans 5 secondes' });
      try { return json(inscrire(d)); } finally { lock.releaseLock(); }
    }
    if (d.action === 'vote') return json(voter(d)); // sans verrou : ajout pur, le dernier vote compte
    return json({ erreur: 'action inconnue' });
  } catch (err) {
    return json({ erreur: 'requête invalide' });
  }
}

function doGet(e) {
  const p = e.parameter || {};
  if (p.action === 'ecran') {
    if (String(p.code || '') !== codeSoiree()) return json({ erreur: 'code de soirée invalide' });
    return json(etatEcran());
  }
  if (p.action === 'etat') {
    const moi = parToken(String(p.token || ''));
    if (!moi) return json({ erreur: 'token invalide' });
    return json(etatPerso(moi));
  }
  return json({ ok: true, app: 'Coeur Code NEXT' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ================= SÉCURITÉ ================= */
function codeSoiree() {
  const c = cGet('codeS');
  if (c) return c.v;
  const v = String(getConfig('code') || '').trim();
  cPut('codeS', { v: v }, 60);
  return v;
}

function sec(v, max) {
  // neutralise l'injection de formules et limite la longueur
  const s = String(v == null ? '' : v).trim().slice(0, max || 60);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function parToken(token) {
  if (!token || token.length < 20) return null;
  let map = cGet('personnes');
  if (!map) {
    map = {};
    lireLignes('Participants').forEach(l => {
      map[String(l[2])] = { num: String(l[1]), prenom: String(l[3]), genre: String(l[6]) };
    });
    cPut('personnes', map, 60);
  }
  return map[token] || null;
}

/* ================= INSCRIPTION ================= */
function inscrire(d) {
  const code = codeSoiree();
  if (!code) return { erreur: 'la soirée n\'est pas encore ouverte' };
  if (String(d.code || '').trim().toLowerCase() !== code.toLowerCase())
    return { erreur: 'code de soirée incorrect' };

  const prenom = String(d.prenom || '').trim();
  const nom = String(d.nom || '').trim();
  const age = Number(d.age);
  const email = String(d.email || '').trim();
  const tel = String(d.tel || '').trim();
  if (!prenom || prenom.length > 25) return { erreur: 'prénom invalide' };
  if (!nom || nom.length > 25) return { erreur: 'nom invalide' };
  if (!(age >= 18 && age <= 99)) return { erreur: 'âge invalide (18-99)' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 60) return { erreur: 'e-mail invalide' };
  if (tel.replace(/\D/g, '').length < 8 || tel.length > 20) return { erreur: 'téléphone invalide' };
  if (!Array.isArray(d.reponses) || d.reponses.length !== 10) return { erreur: '10 réponses obligatoires' };
  const reponses = d.reponses.map((r, i) => {
    const v = String(r || '').trim().toLowerCase();
    return AUTORISEES[i].indexOf(v) !== -1 ? v : null;
  });
  if (reponses.some(r => r === null)) return { erreur: 'réponse non autorisée' };

  const f = feuille('Participants', ['ts','num','token','prenom','nom','age','genre','email','tel','q1','q2','q3','q4','q5','q6','q7','q8','q9','q10']);
  if (f.getLastRow() - 1 >= MAX_PARTICIPANTS) return { erreur: 'soirée complète' };
  const num = f.getLastRow();
  const token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  f.appendRow([new Date(), num, token, sec(prenom, 25), sec(nom, 25), age,
    String(d.genre).toLowerCase().indexOf('f') === 0 ? 'F' : 'H',
    sec(email, 60), "'" + tel, ...reponses]);
  cDel(['personnes', 'ecran']); // le nouveau participant est visible immédiatement
  return { num: num, token: token, prenom: prenom };
}

/* ================= VOTE (1 par ronde, cible automatique) ================= */
function voter(d) {
  const moi = parToken(String(d.token || ''));
  if (!moi) return { erreur: 'token invalide' };
  const ronde = Number(getConfig('ronde') || 0);
  if (ronde < 1) return { erreur: 'aucune ronde en cours' };
  const paire = mesPaires(moi.num).find(p => Number(p.ronde) === ronde);
  if (!paire) return { erreur: 'aucun date trouvé pour cette ronde' };

  const f = feuille('Votes', ['ts','ronde','moi','cible','coeur']);
  const coeur = d.coeur ? 1 : 0;
  // Ajout pur : pas de scan de feuille, pas de verrou → tient les rafales de 100 votes.
  // En cas de re-vote, seul le DERNIER vote de la ronde compte (voir coeursDonnes).
  f.appendRow([new Date(), ronde, moi.num, paire.autre.num, coeur]);
  return { ok: true, cible: paire.autre.prenom };
}

/* ================= ÉTATS ================= */
function configPublique() {
  let c = cGet('cfg');
  if (c) return c;
  const v = feuille('Config').getRange('A1:B12').getValues();
  const m = {};
  v.forEach(l => { if (l[0] !== '') m[String(l[0])] = l[1]; });
  c = {
    mode: String(m.mode || 'accueil'),
    ronde: Number(m.ronde || 0),
    debut: Number(m.debut || 0),
    duree: Number(m.duree || DUREE_DATE_MIN * 60),
    message: String(m.message || '')
  };
  cPut('cfg', c, 5);
  return c;
}

function etatEcran() {
  const cache = cGet('ecran');
  if (cache) return cache;
  const c = configPublique();
  c.classement = lireLignes('Classement');
  c.paires = lignesAffichage().filter(l => Number(l[0]) === c.ronde);
  c.matchs = c.mode === 'final' ? lignesMatchs() : [];
  c.inscrits = Math.max(0, feuille('Participants').getLastRow() - 1);
  cPut('ecran', c, 5);
  return c;
}

function etatPerso(moi) {
  const c = configPublique();
  const r = { mode: c.mode, ronde: c.ronde, debut: c.debut, duree: c.duree, message: c.message };
  const paire = mesPaires(moi.num).find(p => Number(p.ronde) === c.ronde);
  if (paire) r.date = { table: paire.table, num: paire.autre.num, prenom: paire.autre.prenom, pct: paire.pct };
  if (c.mode === 'final') {
    r.matchs = lignesMatchs()
      .filter(l => String(l[0]) === moi.num || String(l[2]) === moi.num)
      .map(l => String(l[0]) === moi.num
        ? { num: String(l[2]), prenom: l[3], pct: l[4] }
        : { num: String(l[0]), prenom: l[1], pct: l[4] });
  }
  return r;
}

function lignesAffichage() {
  let a = cGet('affichage');
  if (a) return a;
  a = lireLignes('Affichage').map(l => l.map(String));
  cPut('affichage', a, 30);
  return a;
}

function lignesMatchs() {
  let m = cGet('matchs');
  if (m) return m;
  m = lireLignes('Matchs').map(l => l.map(String));
  cPut('matchs', m, 30);
  return m;
}

function mesPaires(num) {
  return lignesAffichage()
    .filter(l => String(l[2]) === num || String(l[5]) === num)
    .map(l => ({
      ronde: Number(l[0]), table: l[1], pct: l[4],
      autre: String(l[2]) === num
        ? { num: String(l[5]), prenom: l[6] }
        : { num: String(l[2]), prenom: l[3] }
    }));
}

/* ================= MENU DE PILOTAGE ================= */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('💘 Cœur Code')
    .addItem('🔑 Définir le code de la soirée', 'definirCode')
    .addItem('▶ LANCER LA RONDE SUIVANTE (chrono 5 min)', 'rondeSuivante')
    .addItem('⏳ Ouvrir les votes (fin de ronde)', 'modeVote')
    .addItem('✨ Afficher le classement', 'modeClassement')
    .addItem('🍸 Pause', 'modePause')
    .addItem('🎆 RÉVÉLATION FINALE', 'revelation')
    .addItem('📧 Exporter les coordonnées des matchs', 'exporterContacts')
    .addSeparator()
    .addItem('↺ Relancer le chrono de la ronde en cours', 'relancerChrono')
    .addItem('⚠ Réinitialiser toute la soirée', 'reinitialiser')
    .addToUi();
}

function definirCode() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt('Code de la soirée', 'Choisis un code court (ex: TOUBAV26).\nÀ afficher à l\'entrée : sans lui, impossible de s\'inscrire.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const code = r.getResponseText().trim();
  if (!code) return;
  setConfig('code', code);
  SpreadsheetApp.getActive().toast('🔑 Code défini : ' + code);
}

function rondeSuivante() {
  const ronde = Number(getConfig('ronde') || 0) + 1;
  const res = calculer(ronde);
  ecrire('Classement', [['genre','num','prenom','pct'], ...res.classement]);
  const anciennes = lireLignes('Affichage');
  ecrire('Affichage', [['ronde','table','num_elle','prenom_elle','pct','num_lui','prenom_lui'],
    ...anciennes, ...res.paires]);
  setConfig('ronde', ronde);
  setConfig('mode', 'ronde');
  setConfig('debut', Date.now());
  setConfig('duree', DUREE_DATE_MIN * 60);
  SpreadsheetApp.getActive().toast('Ronde ' + ronde + ' : ' + res.paires.length + ' tables ▶ chrono 5:00');
}

function relancerChrono() { setConfig('debut', Date.now()); }
function modeVote() { setConfig('mode', 'vote'); }
function modeClassement() { majClassement(); setConfig('mode', 'classement'); }
function modePause() { setConfig('mode', 'pause'); }

function reinitialiser() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Tout effacer (participants, votes, rondes) ?', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  ['Participants','Affichage','Votes','Matchs','Classement','Contacts_Matchs','Config'].forEach(n => {
    const f = SpreadsheetApp.getActive().getSheetByName(n);
    if (f) f.clear();
  });
  setConfig('mode', 'accueil'); setConfig('ronde', 0);
}

/* ================= MOTEUR ================= */
function lirePersonnes() {
  return lireLignes('Participants').map(l => ({
    num: String(l[1]), token: String(l[2]), prenom: String(l[3]), genre: String(l[6]),
    rep: l.slice(9, 19).map(v => String(v).trim().toLowerCase())
  }));
}

function score(a, b) {
  let t = 0;
  for (let i = 0; i < 10; i++) {
    const e = ECHELLES[i]; let s;
    if (e) s = 1 - Math.abs(valeur(e, a.rep[i]) - valeur(e, b.rep[i]));
    else s = a.rep[i] && a.rep[i] === b.rep[i] ? 1 : (i === 8 ? 0.5 : 0.4);
    t += POIDS[i] * s;
  }
  return Math.round(t);
}
function valeur(e, r) {
  if (r in e) return e[r];
  for (const k in e) if (r.indexOf(k) !== -1) return e[k];
  return 0.5;
}

function coeursDonnes() {
  // Le DERNIER vote de chaque personne pour chaque ronde est le seul qui compte
  const dernier = {};
  lireLignes('Votes').forEach(l => {
    dernier[Number(l[1]) + '|' + String(l[2])] = { cible: String(l[3]), coeur: Number(l[4]) };
  });
  const s = new Set();
  for (const k in dernier) {
    if (dernier[k].coeur === 1) s.add(k.split('|')[1] + '>' + dernier[k].cible);
  }
  return s;
}

function calculer(ronde) {
  const personnes = lirePersonnes();
  const F = personnes.filter(p => p.genre === 'F');
  const H = personnes.filter(p => p.genre === 'H');
  const coeurs = coeursDonnes();
  const deja = new Set();
  lireLignes('Affichage').forEach(l => deja.add(String(l[2]) + '|' + String(l[5])));

  const scores = [];
  F.forEach(f => H.forEach(h => {
    let pct = score(f, h);
    if (coeurs.has(f.num + '>' + h.num)) pct += 6;
    if (coeurs.has(h.num + '>' + f.num)) pct += 6;
    scores.push({ f: f, h: h, pct: Math.min(pct, 99) });
  }));
  scores.sort((a, b) => b.pct - a.pct);

  const meilleur = {};
  scores.forEach(s => [['F', s.f], ['H', s.h]].forEach(gp => {
    const k = gp[0] + gp[1].num;
    if (!meilleur[k] || s.pct > meilleur[k].pct) meilleur[k] = { p: gp[1], pct: s.pct };
  }));
  const classement = Object.values(meilleur).sort((a, b) => b.pct - a.pct)
    .map(m => [m.p.genre, m.p.num, m.p.prenom, m.pct]);

  const pf = new Set(), ph = new Set(), paires = [];
  scores.forEach(s => {
    if (pf.has(s.f.num) || ph.has(s.h.num) || deja.has(s.f.num + '|' + s.h.num)) return;
    pf.add(s.f.num); ph.add(s.h.num);
    paires.push([ronde, paires.length + 1, s.f.num, s.f.prenom, s.pct, s.h.num, s.h.prenom]);
  });
  return { classement: classement, paires: paires };
}

function majClassement() {
  ecrire('Classement', [['genre','num','prenom','pct'], ...calculer(0).classement]);
}

function revelation() {
  const personnes = lirePersonnes();
  const par = {}; personnes.forEach(p => par[p.num] = p);
  const coeurs = coeursDonnes();
  const matchs = [];
  coeurs.forEach(c => {
    const ab = c.split('>');
    if (Number(ab[0]) < Number(ab[1]) && coeurs.has(ab[1] + '>' + ab[0])) {
      const pa = par[ab[0]], pb = par[ab[1]];
      if (!pa || !pb) return;
      const f = pa.genre === 'F' ? pa : pb, h = pa.genre === 'F' ? pb : pa;
      matchs.push([f.num, f.prenom, h.num, h.prenom, score(f, h)]);
    }
  });
  matchs.sort((x, y) => y[4] - x[4]);
  ecrire('Matchs', [['num_elle','prenom_elle','num_lui','prenom_lui','pct'], ...matchs]);
  setConfig('mode', 'final');
  SpreadsheetApp.getActive().toast('🎆 ' + matchs.length + ' coups de cœur mutuels !');
}

function exporterContacts() {
  const infos = {};
  lireLignes('Participants').forEach(l => {
    infos[String(l[1])] = { prenom: l[3], nom: l[4], age: l[5], email: l[7], tel: String(l[8]).replace(/^'/, '') };
  });
  const lignes = lireLignes('Matchs').map(m => {
    const a = infos[String(m[0])] || {}, b = infos[String(m[2])] || {};
    return [m[0], a.prenom, a.nom, a.age, a.email, a.tel,
            m[2], b.prenom, b.nom, b.age, b.email, b.tel, m[4]];
  });
  ecrire('Contacts_Matchs', [
    ['num_elle','prenom','nom','age','email','tel','num_lui','prenom','nom','age','email','tel','pct'],
    ...lignes]);
  SpreadsheetApp.getActive().toast('📧 ' + lignes.length + ' paires exportées dans Contacts_Matchs');
}

/* ================= FEUILLES & CONFIG ================= */
function feuille(nom, entetes) {
  const ss = SpreadsheetApp.getActive();
  let f = ss.getSheetByName(nom);
  if (!f) { f = ss.insertSheet(nom); if (entetes) f.appendRow(entetes); }
  else if (entetes && f.getLastRow() === 0) f.appendRow(entetes);
  return f;
}
function lireLignes(nom) {
  const f = feuille(nom);
  return f.getLastRow() < 2 ? [] : f.getRange(2, 1, f.getLastRow() - 1, Math.max(1, f.getLastColumn())).getValues();
}
function ecrire(nom, lignes) {
  const f = feuille(nom);
  f.clearContents();
  if (lignes.length) f.getRange(1, 1, lignes.length, lignes[0].length).setValues(lignes);
  cViderTout();
}
function getConfig(cle) {
  const f = feuille('Config');
  const v = f.getRange('A1:B12').getValues();
  for (let i = 0; i < v.length; i++) if (String(v[i][0]) === cle) return v[i][1];
  return '';
}
function setConfig(cle, val) {
  const f = feuille('Config');
  const col = f.getRange('A1:A12').getValues().flat().map(String);
  let i = col.indexOf(cle) + 1;
  if (i === 0) { i = col.filter(x => x !== '').length + 1; f.getRange(i, 1).setValue(cle); }
  f.getRange(i, 2).setValue(val);
  cViderTout();
}
