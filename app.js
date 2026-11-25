/* ============================================================
   EFM Lite — gare e convocazioni di Easy Football Manager dal telefono
   - a ogni apertura: accesso Google + PIN dell'app del PC
   - i dati arrivano da Google Drive (EFM_lite.efm, cifrato con il PIN),
     vengono decifrati e tenuti SOLO in memoria: sul telefono non si salva nulla
   - le gare create o modificate tornano al PC come file cifrati
     (EFM_dal_telefono_*.efm) nella stessa cartella di Drive
   ============================================================ */
"use strict";

const VERSIONE = "1.8";
const CLIENT_ID = "214816832496-4aljuon9t9dpb7usqstupk0gs27utf2k.apps.googleusercontent.com";
const SCOPE = "https://www.googleapis.com/auth/drive";
const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const LITE_FILE = "EFM_lite.efm";
const TEL_PREF = "EFM_dal_telefono_";
const MAGIC = "EFMLITE1";
const BLOCCO_MINUTI = 5;          // in background per più di 5 minuti: si richiudono i dati

/* ---------- utilità ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ICO = {"home":"<path d=\"M3 11 12 3l9 8\"/><path d=\"M5 10v10h14V10\"/>","palla":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m12 7.5 4 3-1.5 4.5h-5L8 10.5Z\"/>","coppa":"<path d=\"M8 4h8v5a4 4 0 0 1-8 0Z\"/><path d=\"M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6\"/>","amichevole":"<path d=\"m3 11 4-4 3 2 2-1 3 1 6 5-3 3\"/><path d=\"m7 7-4 4 3 3M10 14l2 2M12 12l3 3M14 10l3 3\"/>","calendario":"<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"2\"/><path d=\"M3.5 10h17M8 3v4M16 3v4\"/>","torta":"<path d=\"M4 20h16v-7H4Z\"/><path d=\"M4 15.5c2 1.5 4 1.5 5.3 0s4-1.5 5.4 0 4 1.5 5.3 0M8 13v-3M12 13v-3M16 13v-3M8 7.5v-.01M12 7.5v-.01M16 7.5v-.01\"/>","salva":"<path d=\"M5 4h11l3 3v13H5Z\"/><path d=\"M8 4v5h7V4M8 20v-6h8v6\"/>","indietro":"<path d=\"M19 12H5M11 6l-6 6 6 6\"/>","sblocca":"<rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 11V7a4 4 0 0 1 7.5-2\"/>","nuvola":"<path d=\"M7 18a5 5 0 0 1-.8-9.9A6 6 0 0 1 17.7 9 4.5 4.5 0 0 1 17 18Z\"/>","nuvolaGiu":"<path d=\"M7 17a5 5 0 0 1-.8-9.9A6 6 0 0 1 17.7 8 4.5 4.5 0 0 1 17.5 17\"/><path d=\"M12 11v9M8.5 16.5 12 20l3.5-3.5\"/>","orologio":"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>","avviso":"<path d=\"M12 3 2 20h20Z\"/><path d=\"M12 9v5M12 17v.01\"/>","fatto":"<path d=\"m5 12.5 4.5 4.5L19 7.5\"/>","chiudi":"<path d=\"M6 6l12 12M18 6 6 18\"/>","piu":"<path d=\"M12 5v14M5 12h14\"/>","casa":"<path d=\"M3 11 12 3l9 8\"/><path d=\"M5 10v10h5v-6h4v6h5V10\"/>","trasferta":"<path d=\"M3 16V9l3-4h9l3 4h3v7\"/><circle cx=\"7\" cy=\"17\" r=\"2\"/><circle cx=\"17\" cy=\"17\" r=\"2\"/><path d=\"M9 17h6M3 11h18\"/>","report":"<path d=\"M6 3h9l4 4v14H6Z\"/><path d=\"M14 3v5h5M9 12h7M9 15.5h7M9 19h4\"/>","staff":"<circle cx=\"12\" cy=\"7\" r=\"3.5\"/><path d=\"M5 21v-2a7 7 0 0 1 14 0v2\"/><path d=\"m10.5 13 1.5 3 1.5-3\"/>","inf":"<path d=\"M12 4v16M4 12h16\"/>","sq":"<path d=\"M6 6l12 12M18 6 6 18\"/>","ass":"<path d=\"M5 12h14\"/>","lucchetto":"<rect x=\"5\" y=\"11\" width=\"14\" height=\"10\" rx=\"2\"/><path d=\"M8 11V7a4 4 0 0 1 8 0v4\"/>","aggiorna":"<path d=\"M20 12a8 8 0 1 1-2.3-5.6\"/><path d=\"M20 4v5h-5\"/>","cerca":"<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m16 16 4.5 4.5\"/>","immagine":"<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"1.8\"/><path d=\"m20.5 16-5-5-9 8.5\"/>","condividi":"<circle cx=\"18\" cy=\"5.5\" r=\"2.5\"/><circle cx=\"6\" cy=\"12\" r=\"2.5\"/><circle cx=\"18\" cy=\"18.5\" r=\"2.5\"/><path d=\"m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1\"/>","scarica":"<path d=\"M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14\"/>","canc":"<path d=\"M9 5h11v14H9l-6-7Z\"/><path d=\"m12 9 5 6M17 9l-5 6\"/>","presenze":"<rect x=\"5\" y=\"4\" width=\"14\" height=\"17\" rx=\"2\"/><path d=\"M9 4V2.8h6V4M8.5 12.5l2.3 2.3 4.7-4.8\"/>","elimina":"<path d=\"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13\"/>","maglia":"<path d=\"M8 3 3 6l2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0Z\"/>","bersaglio":"<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><circle cx=\"12\" cy=\"12\" r=\"1\"/>","fischietto":"<path d=\"M3 11a5 5 0 0 0 9.5 2.2L21 11V7H8a5 5 0 0 0-5 4Z\"/><circle cx=\"8\" cy=\"12\" r=\"1.5\"/><path d=\"M14 7V4\"/>","cambio":"<path d=\"M7 4v13M3.5 13.5 7 17l3.5-3.5M17 20V7M13.5 10.5 17 7l3.5 3.5\"/>","gialla":"<rect x=\"7\" y=\"3.5\" width=\"10\" height=\"17\" rx=\"1.5\" fill=\"#F2C230\" stroke=\"#B8901A\"/>","rossa":"<rect x=\"7\" y=\"3.5\" width=\"10\" height=\"17\" rx=\"1.5\" fill=\"#D23C3C\" stroke=\"#9E2424\"/>","grafico":"<path d=\"M4 20V10M10 20V4M16 20v-7M22 20H2\"/>","prec":"<path d=\"M15 6l-6 6 6 6\"/>","succ":"<path d=\"M9 6l6 6-6 6\"/>","alfa":"<path d=\"M4 17 7.5 7l3.5 10M5.2 13.5h4.6M14 7h6l-6 10h6\"/>","persone":"<circle cx=\"9\" cy=\"8\" r=\"3.3\"/><path d=\"M3 20v-1.5a6 6 0 0 1 12 0V20\"/><path d=\"M16 4.6a3.3 3.3 0 0 1 0 6.6M21 20v-1.5a6 6 0 0 0-3.5-5.5\"/>"};
const ico = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICO[n] || ""}</svg>`;
const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const GG = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const MESI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const COMP = { CAMP: ["palla", "Campionato"], COPPA: ["coppa", "Coppa"], AMI: ["amichevole", "Amichevole"] };
const REP = { POR: "Portieri", DIF: "Difensori", CEN: "Centrocampisti", TRQ: "Trequartisti", ATT: "Attaccanti", "-": "Senza ruolo" };
const REP_ORD = ["POR", "DIF", "CEN", "TRQ", "ATT", "-"];
const REP_LET = { POR: "P", DIF: "D", CEN: "C", TRQ: "T", ATT: "A" };
const STATO = { Infortunato: ["inf", "inf"], Squalificato: ["sq", "sq"], Assente: ["ass", "ass"] };

const pad = (n) => String(n).padStart(2, "0");
const isoOggi = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const dataDa = (iso) => { const [y, m, d] = String(iso).split("-").map(Number); return new Date(y, m - 1, d); };
const dataIt = (iso) => iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "";
const giornoData = (iso) => `${GIORNI[dataDa(iso).getDay()]} ${dataIt(iso)}`;
const giorniA = (iso) => Math.round((dataDa(iso) - dataDa(isoOggi())) / 86400000);
/** giorni al prossimo compleanno (0 = oggi), come nell'app del PC */
function giorniCompleanno(nascita) {
  if (!nascita || !/^\d{4}-\d\d-\d\d/.test(nascita)) return null;
  const oggi = dataDa(isoOggi()), [, m, d] = nascita.split("-").map(Number);
  let p = new Date(oggi.getFullYear(), m - 1, d);
  if (m === 2 && d === 29 && p.getMonth() !== 1) p = new Date(oggi.getFullYear(), 1, 28);
  if (p < oggi) p = new Date(oggi.getFullYear() + 1, m - 1, d);
  return Math.round((p - oggi) / 86400000);
}
const etaA = (nascita, iso) => {
  const n = dataDa(nascita), a = dataDa(iso);
  return a.getFullYear() - n.getFullYear() - ((a.getMonth() < n.getMonth() || (a.getMonth() === n.getMonth() && a.getDate() < n.getDate())) ? 1 : 0);
};
const enc = new TextEncoder(), dec = new TextDecoder();

let toastT;
function toast(msg, err = false) {
  clearTimeout(toastT);
  $("toast").innerHTML = `<div class="${err ? "err" : ""}">${esc(msg)}</div>`;
  toastT = setTimeout(() => ($("toast").innerHTML = ""), err ? 6000 : 3500);
}

/* ---------- stato (solo in memoria) ---------- */
let S = null;
function azzera() {
  if (S?.chiave) try { sodium.memzero(S.chiave); } catch (e) { /* già azzerata */ }
  S = { disp: S?.disp || null, token: null, scade: 0, lite: null, bin: null, sale: null, chiave: null, D: null, pend: {}, ref: {}, partita: null, modello: "", errori: 0, attesa: 0, vista: null };
}
azzera();

/* ---------- accesso Google ---------- */
let tokenClient = null;
class ErroreAccesso extends Error {}

function attendiGoogle() {
  return new Promise((ok, ko) => {
    let n = 0;
    const t = setInterval(() => {
      if (window.google?.accounts?.oauth2) { clearInterval(t); ok(); }
      else if (++n > 100) { clearInterval(t); ko(new Error("Non riesco a contattare Google: controlla la connessione a internet.")); }
    }, 100);
  });
}

async function chiediToken() {
  await attendiGoogle();
  return new Promise((ok, ko) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: SCOPE, prompt: "",
      callback: (r) => {
        if (r.error) return ko(new Error(r.error === "access_denied" ? "Accesso a Google Drive non consentito." : "Accesso Google non riuscito (" + r.error + ")."));
        if (!google.accounts.oauth2.hasGrantedAllScopes(r, SCOPE)) return ko(new Error("Serve il permesso di vedere i file di Google Drive: riprova e lascia la casella spuntata."));
        S.token = r.access_token;
        S.scade = Date.now() + (Number(r.expires_in) || 3600) * 1000 - 60000;
        ok();
      },
      error_callback: (e) => ko(new Error(e?.type === "popup_closed" ? "Accesso annullato." : e?.type === "popup_failed_to_open" ? "Il browser ha bloccato la finestra di Google: consenti i popup e riprova." : "Accesso Google non riuscito.")),
    });
    tokenClient.requestAccessToken();
  });
}

async function gd(url, opt = {}) {
  if (!S.token || Date.now() > S.scade) throw new ErroreAccesso("Accesso a Google scaduto.");
  let r;
  try { r = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: "Bearer " + S.token } }); }
  catch (e) { throw new Error("Connessione a Google Drive non riuscita: controlla internet."); }
  if (r.status === 401) { S.token = null; throw new ErroreAccesso("Accesso a Google scaduto."); }
  if (!r.ok) {
    let m = ""; try { m = (await r.json()).error?.message || ""; } catch (e) { /* risposta non JSON */ }
    const e = new Error(`Google Drive ha risposto con un errore (${r.status})${m ? ": " + m : ""}`);
    e.stato = r.status;
    throw e;
  }
  return r;
}
const q = (s) => encodeURIComponent(s);
const elenca = async (query, campi = "files(id,name,parents,modifiedTime,size)") =>
  (await (await gd(`${DRIVE}/files?q=${q(query)}&fields=${q(campi)}&orderBy=modifiedTime desc&pageSize=50&spaces=drive`)).json()).files || [];
const scarica = async (id) => new Uint8Array(await (await gd(`${DRIVE}/files/${id}?alt=media`)).arrayBuffer());

/** Il file inviato prima è ancora lì? (null se il PC l'ha già preso: cancellato o nel cestino) */
async function ancoraSuDrive(id) {
  try { const f = await (await gd(`${DRIVE}/files/${id}?fields=id,trashed`)).json(); return f.trashed ? null : f; }
  catch (e) { if (e.stato === 404) return null; throw e; }
}
/** Toglie da Drive un file inviato dal telefono. false = il PC l'aveva già preso. */
async function eliminaDaDrive(id) {
  if (!(await ancoraSuDrive(id))) return false;
  try { await gd(`${DRIVE}/files/${id}`, { method: "DELETE" }); } catch (e) { if (e.stato !== 404) throw e; return false; }
  return true;
}

async function carica(nome, cartella, bytes, idEsistente) {
  // se il PC ha già preso il file di prima, se ne crea uno nuovo (altrimenti la correzione finirebbe nel cestino)
  if (idEsistente && !(await ancoraSuDrive(idEsistente))) idEsistente = null;
  if (idEsistente) {
    return (await gd(`${UPLOAD}/files/${idEsistente}?uploadType=media&fields=id,name`, { method: "PATCH", headers: { "Content-Type": "application/octet-stream" }, body: bytes })).json();
  }
  const b = "efm" + Array.from(sodium.randombytes_buf(12), (x) => x.toString(16).padStart(2, "0")).join("");
  const meta = { name: nome, parents: [cartella], mimeType: "application/octet-stream" };
  const corpo = new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/octet-stream\r\n\r\n`, bytes, `\r\n--${b}--`]);
  return (await gd(`${UPLOAD}/files?uploadType=multipart&fields=id,name`, { method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + b }, body: corpo })).json();
}

/* ---------- cifratura (come il PC: Argon2id + XSalsa20-Poly1305) ---------- */
function apriFile(bin, chiave) {
  if (dec.decode(bin.slice(0, 8)) !== MAGIC) return null;
  const sb = sodium.crypto_pwhash_SALTBYTES, nb = sodium.crypto_secretbox_NONCEBYTES;
  try { return dec.decode(sodium.crypto_secretbox_open_easy(bin.slice(8 + sb + nb), bin.slice(8 + sb, 8 + sb + nb), chiave)); }
  catch (e) { return null; }
}
function chiudiFile(testo) {
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const box = sodium.crypto_secretbox_easy(enc.encode(testo), nonce, S.chiave);
  const out = new Uint8Array(8 + S.sale.length + nonce.length + box.length);
  out.set(enc.encode(MAGIC), 0); out.set(S.sale, 8); out.set(nonce, 8 + S.sale.length); out.set(box, 8 + S.sale.length + nonce.length);
  return out;
}
const stessoSale = (bin) => S.sale && bin.length > 24 && sodium.memcmp(bin.slice(8, 8 + S.sale.length), S.sale);

async function modelloTelefono() {
  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const v = await navigator.userAgentData.getHighEntropyValues(["model", "platform"]);
      if (v.model) return v.model;
    }
  } catch (e) { /* non disponibile */ }
  const m = navigator.userAgent.match(/Android [^;)]+; ([^;)]+)/);
  return m && m[1] !== "K" ? m[1].trim() : /iPhone/.test(navigator.userAgent) ? "iPhone" : "telefono";
}

/* ============================================================
   SCHERMATE
   ============================================================ */
const app = () => $("app");
const icona = `<img class="icona" src="icone/icona-192.png" alt="">`;

function schermataAccesso(errore = "") {
  S.vista = "accesso";
  app().innerHTML = `<section class="accesso">
    ${icona}
    <h1>EFM <em>Lite</em></h1>
    <p>Gare e convocazioni di Easy Football Manager. Ogni volta: accesso Google e PIN dell'app del PC. Sul telefono non resta salvato nulla.</p>
    ${errore ? `<div class="err" role="alert">${esc(errore)}</div>` : ""}
    <button class="btn pri lg" id="bAccedi">${ico("sblocca")} Accedi con Google</button>
    <span class="ver">EFM Lite ${VERSIONE}</span>
  </section>`;
  $("bAccedi").onclick = accedi;
}

function attesa(testo) {
  app().innerHTML = `<section class="accesso">${icona}<h1>EFM <em>Lite</em></h1><div class="attesa"><span class="giro"></span>${esc(testo)}</div></section>`;
}

async function accedi() {
  try {
    if (!window.sodium) throw new Error("Componente di cifratura non caricato: ricarica la pagina.");
    await sodium.ready;
    await chiediToken();
    attesa("Cerco i dati su Google Drive…");
    const f = await elenca(`name = '${LITE_FILE}' and trashed = false`);
    if (!f.length) throw new Error(`Su Google Drive non trovo ${LITE_FILE}. Sul PC: Impostazioni > Google Drive > Telefono, attiva "Dati per il telefono" e aspetta che Drive sincronizzi.`);
    S.lite = f[0];
    if (!S.lite.parents?.length) throw new Error("Non riesco a capire in quale cartella di Drive si trova " + LITE_FILE + ".");
    attesa("Scarico i dati…");
    S.bin = await scarica(S.lite.id);
    if (dec.decode(S.bin.slice(0, 8)) !== MAGIC) throw new Error(LITE_FILE + " non è un file di EFM Lite (o è incompleto).");
    S.sale = S.bin.slice(8, 8 + sodium.crypto_pwhash_SALTBYTES);
    S.modello = await modelloTelefono();
    schermataPin();
  } catch (e) {
    schermataAccesso(e.message);
  }
}

function schermataPin(err = "") {
  S.vista = "pin";
  let pin = "";
  app().innerHTML = `<section class="accesso">
    ${icona}
    <h1>PIN</h1>
    <p>Inserisci il PIN dell'app del PC</p>
    <div class="pallini" id="pall" aria-label="cifre inserite"></div>
    <div class="err" id="pinErr" role="alert" ${err ? "" : "hidden"}>${esc(err)}</div>
    <div class="tastiera" id="tast">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-n="${n}">${n}</button>`).join("")}
      <button class="az" data-a="canc" aria-label="Cancella">${ico("canc")}</button><button data-n="0">0</button>
      <button class="ok" data-a="ok" aria-label="Conferma">${ico("fatto")}</button>
    </div>
    <span class="ver">${esc(S.modello)} · EFM Lite ${VERSIONE}</span>
  </section>`;
  const disegna = () => {
    $("pall").innerHTML = Array.from({ length: Math.max(4, pin.length) }, (_, i) => `<i class="${i < pin.length ? "on" : ""}"></i>`).join("");
    $("tast").querySelector("[data-a=ok]").disabled = pin.length < 4;
  };
  const conferma = async () => {
    if (pin.length < 4) return;
    const attendi = Math.ceil((S.attesa - Date.now()) / 1000);
    if (attendi > 0) { mostraErr(`Troppi tentativi: riprova tra ${attendi} secondi.`); return; }
    $("tast").querySelectorAll("button").forEach((b) => (b.disabled = true));
    $("pinErr").hidden = false; $("pinErr").className = "attesa"; $("pinErr").innerHTML = `<span class="giro"></span>Apro i dati…`;
    await new Promise((r) => setTimeout(r, 30));   // lascia disegnare la rotellina: il calcolo della chiave dura un attimo
    const k = sodium.crypto_pwhash(sodium.crypto_secretbox_KEYBYTES, pin, S.sale, sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE, sodium.crypto_pwhash_ALG_ARGON2ID13);
    pin = "";
    const testo = apriFile(S.bin, k);
    if (testo === null) {
      sodium.memzero(k);
      S.errori++;
      if (S.errori >= 5) S.attesa = Date.now() + Math.min(900, 30 * 2 ** (S.errori - 5)) * 1000;
      $("tast").querySelectorAll("button").forEach((b) => (b.disabled = false));
      mostraErr("PIN errato.");
      disegna();
      $("pall").classList.remove("scuoti"); void $("pall").offsetWidth; $("pall").classList.add("scuoti");
      return;
    }
    S.chiave = k; S.errori = 0; S.bin = null;
    try {
      S.D = JSON.parse(testo);
    } catch (e) { schermataAccesso("I dati scaricati non sono leggibili."); return; }
    S.disp = idDispositivo();
    if ((S.D.bloccati || []).includes(S.disp)) {
      azzera();
      app().innerHTML = `<section class="accesso">${icona}<h1>EFM <em>Lite</em></h1>
        <div class="err" role="alert">Questo telefono è stato <b>bloccato</b> dall'app del PC: i dati non si possono aprire qui.</div>
        <p>Se è un errore, sbloccalo dal PC in Impostazioni › Telefono.</p></section>`;
      return;
    }
    await caricaInAttesa();
    segnaAccesso();
    vaiHome();
  };
  const mostraErr = (m) => { const e = $("pinErr"); e.className = "err"; e.textContent = m; e.hidden = false; };
  $("tast").onclick = (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    if (b.dataset.n && pin.length < 8) pin += b.dataset.n;
    else if (b.dataset.a === "canc") pin = pin.slice(0, -1);
    else if (b.dataset.a === "ok") return conferma();
    disegna();
  };
  document.onkeydown = (e) => {
    if (S.vista !== "pin") return;
    if (/^\d$/.test(e.key) && pin.length < 8) { pin += e.key; disegna(); }
    else if (e.key === "Backspace") { pin = pin.slice(0, -1); disegna(); }
    else if (e.key === "Enter") conferma();
  };
  disegna();
}

/**
 * Codice del telefono, scelto a caso la prima volta: serve solo al PC per riconoscere i telefoni
 * (Impostazioni › Telefono) e, se serve, bloccarli. È l'unica cosa che resta sul telefono e non contiene dati.
 */
function idDispositivo() {
  const nuovo = () => Array.from(sodium.randombytes_buf(16), (x) => x.toString(16).padStart(2, "0")).join("");
  try {
    let id = localStorage.getItem("efm_dispositivo");
    if (!/^[a-f0-9]{32}$/.test(id || "")) { id = nuovo(); localStorage.setItem("efm_dispositivo", id); }
    return id;
  } catch (e) { return S.disp || nuovo(); }
}
/** Avvisa il PC dell'apertura (piccolo file cifrato, il PC lo legge e lo toglie). */
async function segnaAccesso() {
  const nome = TEL_PREF + "d" + S.disp + ".efm";
  // chiede al telefono di non cancellare mai da solo lo spazio di EFM Lite (pulizie e "Ottimizza"):
  // così il codice del telefono resta lo stesso e il PC non lo vede come un telefono nuovo
  let protetto = null;
  try { if (navigator.storage?.persist) protetto = (await navigator.storage.persisted()) || (await navigator.storage.persist()); } catch (e) { /* non indispensabile */ }
  const p = { v: 1, tipo: "accesso", telefono: S.modello, dispositivo: S.disp, creato: new Date().toISOString(), versione: VERSIONE, protetto };
  try { const r = await carica(nome, S.lite.parents[0], chiudiFile(JSON.stringify(p)), S.pend[nome]?.id); S.pend[nome] = { id: r.id, p }; }
  catch (e) { /* non indispensabile */ }
}

/** Le gare salvate dal telefono e non ancora prese dal PC: si vedono come le ha lasciate il telefono. */
async function caricaInAttesa() {
  S.pend = {};
  try {
    const f = await elenca(`'${S.lite.parents[0]}' in parents and name contains '${TEL_PREF}' and trashed = false`);
    for (const x of f) {
      if (S.pend[x.name]) continue;   // il più recente vince (elenco ordinato per data)
      const bin = await scarica(x.id);
      if (!stessoSale(bin)) continue; // fatto con il PIN di prima: lo legge solo il PC
      const t = apriFile(bin, S.chiave);
      if (t) S.pend[x.name] = { id: x.id, p: JSON.parse(t) };
    }
  } catch (e) {
    if (e instanceof ErroreAccesso) throw e;
    toast("Non riesco a leggere le modifiche già inviate dal telefono: " + e.message, true);
  }
}

/* ---------- dati: gare con le modifiche in attesa sopra ---------- */
function gare() {
  const L = S.D.gare.map((g) => ({ ...g, orig: g }));
  for (const [nome, { p }] of Object.entries(S.pend)) {
    if (p.tipo !== "gara") continue;
    const g = { ...p.gara, orig: p.originale || null, uid: p.uid || null, file: nome, attesa: true };
    const i = g.id ? L.findIndex((x) => x.id === g.id) : -1;
    if (i >= 0) L[i] = g; else L.push(g);
  }
  return L.sort((a, b) => (a.data + (a.ora_inizio || "")).localeCompare(b.data + (b.ora_inizio || "")));
}
const persona = (id) => S.D.persone.find((p) => p.id === id);
const nomeFile = (g) => TEL_PREF + (g.id ? "g" + g.id : "n" + g.uid) + ".efm";

/* ---------- testata ---------- */
function testata(titolo, sotto, sinistra = "", destra = "") {
  return `<header class="testata">${sinistra || `<span class="logo">${S.D.logo ? `<img src="${esc(S.D.logo)}" alt="">` : ico("palla")}</span>`}
    <div class="tit"><h1>${esc(titolo)}</h1><small>${esc(sotto)}</small></div>${destra}</header>`;
}

/* ============================================================
   HOME: compleanni e gare
   ============================================================ */
function vaiHome() {
  S.vista = "home";
  document.onkeydown = null;
  const D = S.D, oggi = isoOggi();
  const cmp = D.persone.map((p) => ({ p, g: giorniCompleanno(p.nascita) })).filter((x) => x.g !== null && x.g <= 7)
    .sort((a, b) => a.g - b.g || a.p.cognome.localeCompare(b.p.cognome));
  const rigaCmp = ({ p, g }) => {
    const anni = etaA(p.nascita, oggi) + (g === 0 ? 0 : 1);
    const quando = g === 0 ? "Oggi!" : g === 1 ? "Domani" : `${GG[(dataDa(oggi).getDay() + g) % 7]} ${dataIt(p.nascita).slice(0, 5)}`;
    return `<div class="cmp ${g === 0 ? "oggi" : ""}">
      ${g === 0 ? `<span class="torta" aria-hidden="true">🎂</span>` : p.app === "STAFF" ? `<span class="bd staff">${ico("staff")}</span>` : badgeRep(p)}
      <div class="chi"><b>${esc(p.cognome)} ${esc(p.nome)}</b><small>${g === 0 ? "compie" : "compirà"} ${anni} anni${p.app === "STAFF" ? " · staff" + (p.categoria ? " (" + esc(p.categoria) + ")" : "") : ""}</small></div>
      <span class="quando">${quando}</span></div>`;
  };
  const L = gare();
  const future = L.filter((g) => g.data >= oggi);
  const presInv = presenzeInAttesa();
  const card = (g) => {
    const d = dataDa(g.data), n = (g.convocati || []).length, tra = giorniA(g.data);
    return `<button class="gara" data-g="${esc(g.file || "id" + g.id)}">
      <span class="gg"><small>${GG[d.getDay()]}</small><b>${d.getDate()}</b><em>${MESI[d.getMonth()]}</em></span>
      <span class="info"><b>${esc(g.avversario || "Avversario da definire")}</b>
        <span>${ico(g.casa_trasferta === "T" ? "trasferta" : "casa")}${g.casa_trasferta === "T" ? "Trasferta" : g.casa_trasferta === "C" ? "Casa" : "–"} · ${esc(COMP[g.competizione]?.[1] || "")}${g.ora_inizio ? " · ore " + esc(g.ora_inizio) : ""}</span>
        <span>${g.attesa ? `<span class="etc att">${ico("orologio")}In attesa del PC</span>` : ""}${tra === 0 ? `<span class="etc">Oggi</span>` : tra === 1 ? `<span class="etc">Domani</span>` : ""}</span></span>
      <span class="dx"><span class="bd ${n ? "" : "mute"}" style="${n ? "background:var(--accent)" : ""}">${n}</span><small>conv.</small></span>
    </button>`;
  };
  app().innerHTML = testata(D.stagione.squadra, "Stagione " + D.stagione.nome, "",
    `${D.stat ? `<button class="ib" id="bStat" aria-label="Statistiche">${ico("grafico")}</button>` : ""}<button class="ib" id="bEsci" aria-label="Chiudi e blocca">${ico("lucchetto")}</button>`) + `
    <section class="pag">
      ${cmp.length ? `<h2 class="sez">${ico("torta")} Compleanni <span class="n">prossimi 7 giorni</span></h2><div class="card">${cmp.map(rigaCmp).join("")}</div>` : ""}
      <h2 class="sez">${ico("calendario")} Gare in programma <span class="sp"></span><span class="n">${future.length}</span></h2>
      ${future.length ? future.map(card).join("") : `<div class="vuoto">Nessuna gara in programma.<br>Creane una con <b>Nuova gara</b>.</div>`}
      ${presInv.length ? `<h2 class="sez">${ico("presenze")} Presenze inviate <span class="sp"></span><span class="n">in attesa del PC</span></h2>
        <div class="card">${presInv.map((x) => `<button class="pinv" data-pd="${esc(x.data)}"><span class="bd giallo">${x.presenti.length}</span>
          <span class="chi"><b>${esc(giornoData(x.data))}</b><small>${x.presenti.length} presenti · tocca per correggere</small></span>${ico("orologio")}</button>`).join("")}</div>` : ""}
      ${D.stagione.archiviata ? `<p class="avviso">${ico("avviso")}<span>La stagione è archiviata sul PC: le modifiche non verranno applicate.</span></p>` : ""}
      <p class="piede">Dati dal PC ${esc(D.pc)} del ${esc(dataIt(D.creato))} ${esc(String(D.creato || "").slice(11, 16))}<br>${esc(S.modello)} · EFM Lite ${VERSIONE}</p>
    </section>
    <nav class="barra"><button class="btn verde" id="bPres">${ico("presenze")} Presenze</button><button class="btn pri" id="bNuova">${ico("piu")} Nuova gara</button></nav>`;
  $("bEsci").onclick = () => { azzera(); schermataAccesso(); };
  if ($("bStat")) $("bStat").onclick = () => { statComp = ""; statApp = new Set(["ROSA"]); apriStat("gare"); };
  $("bNuova").onclick = () => apriGara(null);
  $("bPres").onclick = () => apriCalendario();
  app().querySelectorAll("[data-pd]").forEach((b) => (b.onclick = () => apriPresenze(b.dataset.pd)));
  app().querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => {
    const k = b.dataset.g, g = L.find((x) => (x.file || "id" + x.id) === k);
    if (g) apriGara(g);
  }));
  window.scrollTo(0, 0);
}

function badgeRep(p, sm = "") {
  return REP_LET[p.reparto] ? `<span class="bd ${sm} ${p.reparto}" title="${esc(p.ruolo || REP[p.reparto])}">${REP_LET[p.reparto]}</span>` : `<span class="bd ${sm} mute">–</span>`;
}

/* ============================================================
   GARA: dati e convocati
   ============================================================ */
const fileR = (id) => TEL_PREF + "r" + id + ".efm";
const TIPI_EV = { GOL: ["palla", "Gol"], AUTOGOL: ["palla", "Autogol avversario"], SOST: ["cambio", "Sostituzione"], AMM: ["gialla", "Ammonizione"], ESP: ["rossa", "Espulsione"] };
const nomeBreve = (p) => p ? `${p.cognome} ${p.nome ? p.nome[0] + "." : ""}` : "?";

/* ============================================================
   GARA: pagina della gara con Dati, Convocati, Formazione, Compiti, Referto
   ============================================================ */
function apriGara(g, vistaIniziale = null) {
  S.vista = "gara";
  const nuova = !g;
  const E = g ? JSON.parse(JSON.stringify({ ...g, orig: undefined })) : {
    id: null, uid: crypto.randomUUID(), data: "", avversario: "", campo: "", ora_presentazione: "", ora_inizio: "",
    casa_trasferta: "C", competizione: "CAMP", convocati: [], compiti: { ruoli: {}, note: {} }, durata: S.D.durata_default || 90,
  };
  delete E.orig;
  if (!E.compiti || Array.isArray(E.compiti)) E.compiti = { ruoli: {}, note: {} };
  if (Array.isArray(E.compiti.ruoli)) E.compiti.ruoli = {};
  if (Array.isArray(E.compiti.note)) E.compiti.note = {};
  if (!E.durata) E.durata = S.D.gare.find((x) => x.id === E.id)?.durata || S.D.durata_default || 90;
  const orig = g ? (g.orig ? JSON.parse(JSON.stringify(g.orig)) : null) : null;
  let vista = vistaIniziale || (nuova ? "dati" : "hub"), salvata = !nuova, filtro = "";
  const conv = new Map((E.convocati || []).map((c) => [c.id, c]));

  const convocabili = () => S.D.persone.filter((p) => (p.app !== "STAFF" || conv.has(p.id)) && (garaFR || p.app !== "FUORI_ROSA" || conv.has(p.id)))
    .sort((a, b) => REP_ORD.indexOf(a.reparto) - REP_ORD.indexOf(b.reparto) || (a.cognome + a.nome).localeCompare(b.cognome + b.nome));
  const convOrd = () => [...conv.values()].map((c) => ({ ...c, p: persona(c.id) })).filter((c) => c.p)
    .sort((a, b) => (a.n == null) - (b.n == null) || (a.n || 0) - (b.n || 0) || (a.p.cognome + a.p.nome).localeCompare(b.p.cognome + b.p.nome));
  const leggiForm = () => {
    const f = $("fGara");
    if (f) for (const k of ["data", "ora_presentazione", "ora_inizio", "avversario", "campo"]) E[k] = f[k].value.trim();
    app().querySelectorAll("[data-num]").forEach((i) => { const c = conv.get(+i.dataset.num); if (c) c.n = i.value === "" ? null : +i.value; });
    app().querySelectorAll("[data-nota]").forEach((i) => { const t = i.value.trim(); if (t) E.compiti.note[i.dataset.nota] = t; else delete E.compiti.note[i.dataset.nota]; });
  };
  const titolo = () => nuova && !E.data ? "Nuova gara" : E.data ? `${GIORNI[dataDa(E.data).getDay()]} ${dataIt(E.data)}` : "Gara";
  const sotto = () => E.avversario ? (E.casa_trasferta === "T" ? "in trasferta · " : "in casa · ") + E.avversario : (nuova ? "da salvare su Drive" : "");
  const nCompiti = () => Object.entries(E.compiti.ruoli).reduce((t, [, v]) => t + v.filter((id) => conv.has(id)).length, 0);
  const titolari = () => [...conv.values()].filter((c) => c.n >= 1 && c.n <= 11).length;

  /** controlli come sul PC: numeri 1–99 non ripetuti, un capitano, un vice */
  const erroriFormazione = () => {
    const visti = {}, err = [];
    for (const c of conv.values()) {
      if (c.n == null) continue;
      if (!Number.isInteger(c.n) || c.n < 1 || c.n > 99) err.push(`numero ${c.n} non valido (1-99)`);
      else if (visti[c.n]) err.push(`il numero ${c.n} è assegnato due volte`);
      visti[c.n] = true;
      if (c.c && c.v) err.push(`${nomeBreve(persona(c.id))} non può essere capitano e vice`);
    }
    if ([...conv.values()].filter((c) => c.c).length > 1) err.push("c'è più di un capitano");
    if ([...conv.values()].filter((c) => c.v).length > 1) err.push("c'è più di un vice capitano");
    return err;
  };

  const tile = (v, ic, nome, stato, dis = "") => `<button class="tile ${dis ? "dis" : ""}" data-v="${v}" ${dis ? `data-dis="${esc(dis)}"` : ""}>
    <span class="ti">${ico(ic)}</span><span class="tt"><b>${nome}</b><small>${stato}</small></span>${ico("succ")}</button>`;

  const disegna = () => {
    leggiForm();
    S.vista = "gara";
    const n = conv.size;
    const barra = `<nav class="barra"><button class="btn" id="bReport">${ico("report")} Report</button><button class="btn pri" id="bSalva">${ico("nuvola")} Salva</button></nav>`;
    let corpo = "";
    if (vista === "hub") {
      const cap = [...conv.values()].find((c) => c.c), oggi = isoOggi();
      const R = E.id ? (S.ref[E.id] || S.pend[fileR(E.id)]?.p) : null;
      const refStato = !E.id ? "si potrà fare quando la gara sarà sul PC" : E.data !== oggi ? `disponibile il giorno della gara (${dataIt(E.data)})`
        : R ? (R.chiuso ? "inviato al PC con Fine gara" : `in corso · ${R.eventi.length} eventi`) : "da compilare";
      corpo = `<div class="card riass">
          <div><b>${esc(giornoData(E.data || oggi))}</b>${E.ora_inizio ? ` · ore ${esc(E.ora_inizio)}` : ""}</div>
          <div class="muted">${E.casa_trasferta === "T" ? "In trasferta" : "In casa"} · ${esc(COMP[E.competizione]?.[1] || "")}${E.campo ? " · " + esc(E.campo) : ""}</div></div>
        <div class="tiles">
          ${tile("dati", "calendario", "Dati gara", E.data ? `${dataIt(E.data)}${E.ora_presentazione ? " · pres. " + esc(E.ora_presentazione) : ""}` : "da compilare")}
          ${tile("conv", "persone", "Convocati", n ? `${n} convocati` : "nessuno")}
          ${tile("form", "maglia", "Formazione", n ? `${titolari()} titolari (1-11)${cap ? " · C: " + esc(nomeBreve(persona(cap.id))) : ""}` : "prima i convocati", n ? "" : "Scegli prima i convocati.")}
          ${tile("comp", "bersaglio", "Compiti", n ? (nCompiti() ? `${nCompiti()} posti assegnati` : "da assegnare") : "prima i convocati", n ? "" : "Scegli prima i convocati.")}
          ${tile("ref", "fischietto", "Referto", refStato, !E.id ? "La gara nuova deve prima arrivare al PC: il referto si fa sulle gare già presenti sul PC." : E.data !== oggi ? "Il referto si compila dal telefono solo il giorno della gara." : "")}
        </div>`;
    } else if (vista === "dati") {
      corpo = `<form id="fGara" autocomplete="off" onsubmit="return false">
        <label class="campo"><span>Data</span><input type="date" name="data" value="${esc(E.data)}" min="${isoOggi()}" required></label>
        <div class="due">
          <label class="campo"><span>Ora presentazione</span><input type="time" name="ora_presentazione" value="${esc(E.ora_presentazione)}"></label>
          <label class="campo"><span>Ora inizio gara</span><input type="time" name="ora_inizio" value="${esc(E.ora_inizio)}"></label>
        </div>
        <label class="campo"><span>Avversario</span><input name="avversario" list="lAvv" value="${esc(E.avversario)}" autocapitalize="characters"></label>
        <label class="campo"><span>Campo (luogo)</span><input name="campo" list="lCampi" value="${esc(E.campo)}"></label>
        <div class="campo"><span>Si gioca</span><div class="seg" id="sCT">
          <button type="button" data-v="C" class="${E.casa_trasferta !== "T" ? "on" : ""}">${ico("casa")} In casa</button>
          <button type="button" data-v="T" class="${E.casa_trasferta === "T" ? "on" : ""}">${ico("trasferta")} In trasferta</button></div></div>
        <div class="campo"><span>Competizione</span><div class="seg" id="sComp">
          ${Object.entries(COMP).map(([k, [ic, nome]]) => `<button type="button" data-v="${k}" class="${E.competizione === k ? "on" : ""}">${ico(ic)} ${nome}</button>`).join("")}</div></div>
        <datalist id="lAvv">${S.D.avversari.map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
        <datalist id="lCampi">${S.D.campi.map((x) => `<option value="${esc(x)}">`).join("")}</datalist>
      </form>`;
    } else if (vista === "conv") {
      corpo = `<div class="riep" id="riep"><span>${riep()}</span><span class="sp"></span>
        ${n ? `<button class="btn" id="bNessuno" style="min-height:40px">Togli tutti</button>` : ""}</div>
      ${interFR(S.D.persone.filter((p) => p.app === "FUORI_ROSA").length)}
      <label class="campo cerca"><input type="search" id="cerca" placeholder="Cerca per cognome…" value="${esc(filtro)}"></label>
      <div id="elenco">${elenco(convocabili())}</div>`;
    } else if (vista === "form") {
      const tutti = convOrd(), nFRc = tutti.filter((x) => x.p.app === "FUORI_ROSA").length, err = erroriFormazione();
      const L = garaFR ? tutti : tutti.filter((x) => x.p.app !== "FUORI_ROSA");
      corpo = `<div class="riep"><span id="rForm"><b>${titolari()}</b> titolari (numeri 1-11) su ${n} convocati</span></div>
        <p class="avviso err" id="eForm" ${err.length ? "" : "hidden"}>${ico("avviso")}<span>${esc(err.join("; "))}</span></p>
        ${interFR(nFRc, "convocati")}
        <p class="nota">Scrivi il numero di maglia: dall'1 all'11 sono i titolari (servono al PC per i minuti giocati). Tocca <b>C</b> per il capitano e <b>V</b> per il vice.</p>
        <div class="lista">${L.map(({ id, n: num, c, v, p }) => `<div class="rform">
          <input class="num" type="number" inputmode="numeric" min="1" max="99" data-num="${id}" value="${num ?? ""}" aria-label="Numero di ${esc(p.cognome)}">
          ${badgeRep(p, "sm")}<span class="nome"><b>${esc(p.cognome)}</b> ${esc(p.nome)}<small>${esc(p.ruolo || "")}</small></span>
          <button class="cv ${c ? "on" : ""}" data-cap="${id}" aria-pressed="${!!c}" aria-label="Capitano">C</button>
          <button class="cv ${v ? "on" : ""}" data-vice="${id}" aria-pressed="${!!v}" aria-label="Vice capitano">V</button></div>`).join("")}</div>`;
    } else if (vista === "comp") {
      const L = convOrd();
      const opz = (sel) => `<option value="">—</option>` + L.map(({ id, n: num, p }) => `<option value="${id}" ${sel === id ? "selected" : ""}>${num != null ? num + " · " : ""}${esc(p.cognome)} ${esc(p.nome)}</option>`).join("");
      const D = Object.fromEntries((S.D.compiti_def || []).map((x) => [x.id, x]));
      const sez = (X) => {
        if (!X) return "";
        let gruppo = null, out = "";
        for (const r of X.ruoli) {
          if (r.g && r.g !== gruppo) { gruppo = r.g; out += `<div class="cpg">${esc(r.g)}</div>`; }
          const v = (E.compiti.ruoli[r.k] || []).filter((id) => conv.has(id));
          out += `<div class="cpr"><span class="cpl">${esc(r.l)}</span><div class="cps">${Array.from({ length: r.n }, (_, i) =>
            `<label>${r.ord ? `<i>${i + 1}°</i>` : ""}<select data-r="${r.k}" data-i="${i}">${opz(v[i])}</select></label>`).join("")}</div></div>`;
        }
        return `<details class="card cpsez" ${Object.keys(E.compiti.ruoli).some((k) => X.ruoli.some((r) => r.k === k)) || X.id === "bar" ? "open" : ""}>
          <summary>${esc(X.titolo)}<span class="n">${X.ruoli.reduce((t, r) => t + (E.compiti.ruoli[r.k] || []).filter((id) => conv.has(id)).length, 0)}</span></summary>
          ${out}<label class="campo" style="margin:10px 0 0"><span>Nota</span><input data-nota="${X.id}" value="${esc(E.compiti.note[X.id] || "")}" maxlength="300" placeholder="facoltativa"></label></details>`;
      };
      corpo = `<p class="nota">Si sceglie tra i ${n} convocati; nello stesso compito un giocatore non si ripete.</p>${sez(D.bar)}${sez(D.pun)}${sez(D.ac)}${sez(D.af)}`;
    }
    const nomiVista = { dati: "Dati gara", conv: "Convocati", form: "Formazione", comp: "Compiti" };
    app().innerHTML = testata(vista === "hub" ? titolo() : nomiVista[vista], vista === "hub" ? sotto() : titolo() + (E.avversario ? " · " + E.avversario : ""),
      `<button class="ib" id="bInd" aria-label="Indietro">${ico("indietro")}</button>`) + `
    <section class="pag">
      ${g?.attesa && vista === "hub" ? `<p class="avviso">${ico("orologio")}<span>Modifiche già inviate dal telefono: il PC le applicherà all'apertura (se intanto la gara è cambiata anche sul PC, ti chiederà quale versione tenere).</span></p>` : ""}
      ${!salvata && vista === "hub" ? `<p class="avviso">${ico("avviso")}<span>Ci sono modifiche <b>non salvate</b>: premi Salva per mandarle al PC.</span></p>` : ""}
      ${corpo}
    </section>${barra}`;
    $("bInd").onclick = () => { leggiForm(); if (vista !== "hub" && (!nuova || E.data)) { vista = "hub"; disegna(); window.scrollTo(0, 0); } else esci(); };
    if ($("cGFR")) $("cGFR").onchange = (e) => { leggiForm(); garaFR = e.target.checked; disegna(); };
    $("bSalva").onclick = salva;
    $("bReport").onclick = () => { leggiForm(); E.convocati = [...conv.values()]; if (!E.data) { toast("Indica prima la data della gara.", true); vista = "dati"; disegna(); return; } report(E, salvata, () => { disegna(); }); };
    if (vista === "hub") app().querySelectorAll(".tile").forEach((b) => (b.onclick = () => {
      if (b.dataset.dis) return toast(b.dataset.dis, true);
      if (b.dataset.v === "ref") {
        if (!salvata) return toast("Salva prima la gara: il referto usa convocati e formazione salvati.", true);
        return apriReferto(E, () => apriGara(S.D && gare().find((x) => x.id === E.id) || g, "hub"));
      }
      vista = b.dataset.v; disegna(); window.scrollTo(0, 0);
    }));
    if (vista === "dati") {
      $("sCT").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; E.casa_trasferta = b.dataset.v; salvata = false; disegna(); };
      $("sComp").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; E.competizione = b.dataset.v; salvata = false; disegna(); };
      $("fGara").oninput = () => { salvata = false; };
    }
    if (vista === "conv") {
      $("cerca").oninput = (e) => { filtro = e.target.value; $("elenco").innerHTML = elenco(convocabili()); };
      if ($("bNessuno")) $("bNessuno").onclick = () => { if (confirm("Togliere tutti i convocati?")) { conv.clear(); salvata = false; disegna(); } };
      $("elenco").onclick = (e) => {
        const r = e.target.closest("[data-p]");
        if (!r) return;
        const id = +r.dataset.p;
        if (conv.has(id)) conv.delete(id); else conv.set(id, { id, n: null, c: 0, v: 0 });
        salvata = false;
        r.classList.toggle("on", conv.has(id));
        r.setAttribute("aria-pressed", conv.has(id));
        $("riep").firstElementChild.outerHTML = `<span>${riep()}</span>`;
      };
    }
    if (vista === "form") {
      app().querySelector(".pag").oninput = () => { salvata = false; };
      // al cambio di un numero si aggiornano solo conteggio e avvisi (ridisegnare farebbe perdere il tocco su C/V)
      app().querySelector(".pag").addEventListener("change", () => {
        leggiForm();
        const err = erroriFormazione();
        $("rForm").innerHTML = `<b>${titolari()}</b> titolari (numeri 1-11) su ${conv.size} convocati`;
        $("eForm").hidden = !err.length; $("eForm").lastElementChild.textContent = err.join("; ");
        const usati = {};
        app().querySelectorAll("[data-num]").forEach((i) => { if (i.value) usati[i.value] = (usati[i.value] || 0) + 1; });
        app().querySelectorAll("[data-num]").forEach((i) => i.classList.toggle("doppio", !!i.value && usati[i.value] > 1));
      });
      app().querySelectorAll("[data-cap],[data-vice]").forEach((b) => (b.onclick = () => {
        leggiForm();
        const id = +(b.dataset.cap || b.dataset.vice), k = b.dataset.cap ? "c" : "v", c = conv.get(id), era = c[k];
        for (const x of conv.values()) x[k] = 0;        // un solo capitano e un solo vice
        c[k] = era ? 0 : 1;
        if (c[k]) c[k === "c" ? "v" : "c"] = 0;
        salvata = false;
        disegnaMantieniScroll();
      }));
    }
    if (vista === "comp") {
      app().querySelector(".pag").oninput = () => { salvata = false; };
      app().querySelectorAll("select[data-r]").forEach((s) => (s.onchange = () => {
        const k = s.dataset.r;
        if (s.value) app().querySelectorAll(`select[data-r="${k}"]`).forEach((o) => { if (o !== s && o.value === s.value) o.value = ""; });
        E.compiti.ruoli[k] = [...app().querySelectorAll(`select[data-r="${k}"]`)].map((o) => +o.value).filter(Boolean);
        if (!E.compiti.ruoli[k].length) delete E.compiti.ruoli[k];
        salvata = false;
        const sm = s.closest("details").querySelector("summary .n");
        const sezK = [...s.closest("details").querySelectorAll("select[data-r]")].map((o) => o.dataset.r);
        sm.textContent = [...new Set(sezK)].reduce((t, kk) => t + (E.compiti.ruoli[kk] || []).length, 0);
      }));
    }
  };
  const disegnaMantieniScroll = () => { const y = window.scrollY; disegna(); window.scrollTo(0, y); };

  const riep = () => {
    const eta = [...conv.keys()].map(persona).filter((p) => p?.nascita && E.data).map((p) => etaA(p.nascita, E.data));
    return `<b>${conv.size}</b> convocati${eta.length ? ` · età media <b>${(eta.reduce((a, b) => a + b, 0) / eta.length).toFixed(1).replace(".", ",")}</b>` : ""}`;
  };
  const elenco = (L) => {
    const f = filtro.trim().toUpperCase();
    const vis = f ? L.filter((p) => (p.cognome + " " + p.nome).toUpperCase().includes(f)) : L;
    if (!vis.length) return `<div class="vuoto">Nessun giocatore${f ? " trovato" : " in rosa"}.</div>`;
    let out = "", rep = null, gruppo = [];
    const chiudi = () => { if (gruppo.length) out += `<div class="rep"><span>${REP[rep] || rep}</span><span>${gruppo.length}</span></div><div class="lista">${gruppo.join("")}</div>`; gruppo = []; };
    for (const p of vis) {
      const rp = p.app === "STAFF" ? "-" : p.reparto;
      if (rp !== rep) { chiudi(); rep = rp; }
      const on = conv.has(p.id), st = STATO[p.stato];
      gruppo.push(`<button class="riga ${on ? "on" : ""} ${st ? "no" : ""}" data-p="${p.id}" aria-pressed="${on}">
        <span class="sel">${ico("fatto")}</span>${badgeRep(p, "sm")}
        <span class="nome"><b>${esc(p.cognome)}</b> ${esc(p.nome)}<small>${esc(p.ruolo || "")}${p.nascita ? " · " + p.nascita.slice(0, 4) : ""}${p.app === "FUORI_ROSA" ? " · fuori rosa" : ""}</small></span>
        <span class="ext">${st ? `<span class="bd sm ${st[0]}" title="${esc(p.stato)}">${ico(st[1])}</span>` : ""}</span></button>`);
    }
    chiudi();
    return out;
  };

  const esci = () => {
    leggiForm();
    if (!salvata && !confirm("Le modifiche non sono state salvate su Drive. Uscire lo stesso?")) return;
    vaiHome();
  };

  const salva = async () => {
    leggiForm();
    E.convocati = [...conv.values()].sort((a, b) => a.id - b.id);
    if (!E.data) { toast("La data della gara è obbligatoria.", true); vista = "dati"; disegna(); return; }
    if (E.data < isoOggi()) { toast("Dal telefono si programmano solo gare da oggi in poi.", true); vista = "dati"; disegna(); return; }
    if (E.ora_presentazione && E.ora_inizio && E.ora_presentazione > E.ora_inizio) { toast("L'ora di presentazione deve essere prima dell'inizio gara.", true); vista = "dati"; disegna(); return; }
    const err = erroriFormazione();
    if (err.length) { toast("Formazione: " + err.join("; ") + ".", true); vista = "form"; disegna(); return; }
    // i compiti valgono solo per chi è convocato
    const ruoli = {};
    for (const [k, v] of Object.entries(E.compiti.ruoli)) { const f = v.filter((id) => conv.has(id)); if (f.length) ruoli[k] = f; }
    E.compiti = { ruoli, note: { ...E.compiti.note } };
    const b = $("bSalva");
    b.disabled = true; b.innerHTML = `<span class="giro"></span> Salvo…`;
    try {
      const nome = nomeFile(E);
      const p = {
        v: 1, tipo: "gara", telefono: S.modello, dispositivo: S.disp, creato: new Date().toISOString(), stagione_id: S.D.stagione.id,
        uid: E.id ? null : E.uid,
        gara: { id: E.id || null, data: E.data, avversario: E.avversario, campo: E.campo, ora_presentazione: E.ora_presentazione, ora_inizio: E.ora_inizio,
                casa_trasferta: E.casa_trasferta, competizione: E.competizione, convocati: E.convocati, compiti: E.compiti, durata: E.durata },
        originale: orig,
      };
      const prima = S.pend[nome];
      const r = await carica(nome, S.lite.parents[0], chiudiFile(JSON.stringify(p)), prima?.id);
      S.pend[nome] = { id: r.id || prima?.id, p };
      salvata = true;
      g = { ...p.gara, attesa: true, file: nome, orig, uid: p.uid };
      toast("Salvata su Google Drive: il PC la prenderà all'apertura dell'app.");
      disegna();
    } catch (e) {
      b.disabled = false; b.innerHTML = `${ico("nuvola")} Salva`;
      if (e instanceof ErroreAccesso) return riaccedi();
      toast(e.message, true);
    }
  };

  disegna();
  window.scrollTo(0, 0);
}

/* ============================================================
   REFERTO: scritto a mano come sulla carta, solo il giorno della gara.
   Il PC lo applica quando si preme "Fine gara".
   ============================================================ */
function erroriReferto(R, G) {
  const conv = new Map((G.convocati || []).map((c) => [c.id, c]));
  const staff = new Set(S.D.persone.filter((p) => p.app === "STAFF").map((p) => p.id));
  const durata = R.durata_base + (R.recupero || 0);
  const nome = (id) => nomeBreve(persona(id));
  if (!conv.size) return ["mancano i convocati"];
  if (durata < 10 || durata > 130) return ["durata della gara non valida"];
  for (const e of R.eventi) {
    const et = TIPI_EV[e.tipo]?.[1] || e.tipo, m = e.minuto;
    if (m != null && (m < 0 || m > durata + 30)) return [`${et}: minuto ${m} non valido`];
    if (e.tipo === "AUTOGOL") continue;
    if (!e.giocatore_id) return [`${et}${m != null ? ` al ${m}'` : ""}: manca il giocatore`];
    if (!conv.has(e.giocatore_id) && !(["AMM", "ESP"].includes(e.tipo) && staff.has(e.giocatore_id))) return [`${et}: ${nome(e.giocatore_id)} non è tra i convocati`];
    if (e.tipo === "SOST") {
      if (m == null) return ["per ogni sostituzione serve il minuto"];
      if (!e.entra_id) return [`sostituzione al ${m}': manca chi entra`];
      if (!conv.has(e.entra_id)) return [`sostituzione al ${m}': chi entra non è tra i convocati`];
      if (e.entra_id === e.giocatore_id) return [`sostituzione al ${m}': esce ed entra lo stesso giocatore`];
    }
  }
  // chi esce deve essere in campo (titolari = numeri 1-11, poi le sostituzioni in ordine di minuto)
  const campo = new Set([...conv.values()].filter((c) => c.n >= 1 && c.n <= 11).map((c) => c.id)), espulsi = new Set();
  const cron = R.eventi.map((e, i) => ({ ...e, i })).filter((e) => e.minuto != null && ["SOST", "ESP"].includes(e.tipo)).sort((a, b) => a.minuto - b.minuto || a.i - b.i);
  for (const e of cron) {
    if (e.tipo === "ESP") { campo.delete(e.giocatore_id); espulsi.add(e.giocatore_id); continue; }
    if (!campo.has(e.giocatore_id)) return [`sostituzione al ${e.minuto}': ${nome(e.giocatore_id)} non è in campo in quel momento (i titolari sono i numeri 1-11 della formazione)`];
    if (campo.has(e.entra_id)) return [`sostituzione al ${e.minuto}': ${nome(e.entra_id)} è già in campo`];
    if (espulsi.has(e.entra_id)) return [`sostituzione al ${e.minuto}': ${nome(e.entra_id)} è stato espulso`];
    campo.delete(e.giocatore_id); campo.add(e.entra_id);
  }
  return [];
}

let invioRef = null;   // invio del referto in attesa (rete assente o accesso scaduto)
async function inviaReferto(R, silenzioso = false) {
  const nome = fileR(R.gara_id);
  const p = { v: 1, tipo: "referto", telefono: S.modello, dispositivo: S.disp, creato: new Date().toISOString(), stagione_id: S.D.stagione.id,
    gara_id: R.gara_id, chiuso: !!R.chiuso, gol_subiti: R.gol_subiti, durata: R.durata_base + (R.recupero || 0),
    durata_base: R.durata_base, recupero: R.recupero || 0, eventi: R.eventi };
  try {
    const r = await carica(nome, S.lite.parents[0], chiudiFile(JSON.stringify(p)), S.pend[nome]?.id);
    S.pend[nome] = { id: r.id || S.pend[nome]?.id, p: JSON.parse(JSON.stringify(R)) };
    R.inviato = new Date(); R.daInviare = false; invioRef = null;
    statoInvio(R);
    return true;
  } catch (e) {
    R.daInviare = true; invioRef = R;
    R.erroreInvio = e instanceof ErroreAccesso ? "accesso" : "rete";
    statoInvio(R);
    if (!silenzioso && !(e instanceof ErroreAccesso)) toast(e.message, true);
    return false;
  }
}
function statoInvio(R) {
  const el = $("refInvio");
  if (!el) return;
  el.innerHTML = R.daInviare
    ? (R.erroreInvio === "accesso" ? `<span class="avviso err">${ico("avviso")}<span>Accesso Google scaduto: il referto è al sicuro qui, ma non è ancora su Drive.</span></span><button class="btn verde" id="bRinnova">${ico("sblocca")} Rinnova l'accesso e invia</button>`
      : `<span class="avviso">${ico("orologio")}<span>Nessuna linea: il referto è al sicuro qui e parte da solo quando torna la connessione.</span></span>`)
    : R.inviato ? `<span class="salvato">${ico("nuvola")} Salvato su Drive alle ${pad(R.inviato.getHours())}:${pad(R.inviato.getMinutes())}</span>` : "";
  if ($("bRinnova")) $("bRinnova").onclick = async () => { try { await chiediToken(); await inviaReferto(R); } catch (e) { toast(e.message, true); } };
}
// riprova da solo: al ritorno della linea e ogni 30 secondi
window.addEventListener("online", () => { if (invioRef && S.D && invioRef.erroreInvio !== "accesso") inviaReferto(invioRef, true); });
setInterval(() => { if (invioRef && S.D && navigator.onLine && invioRef.erroreInvio !== "accesso") inviaReferto(invioRef, true); }, 30000);

function apriReferto(G, torna) {
  S.vista = "referto";
  const id = G.id;
  const base = S.pend[fileR(id)]?.p;
  const R = S.ref[id] || (S.ref[id] = base ? JSON.parse(JSON.stringify(base)) : { gara_id: id, chiuso: false, gol_subiti: null, recupero: 0, durata_base: G.durata || S.D.durata_default || 90, eventi: [] });
  if (R.durata_base == null) R.durata_base = G.durata || 90;
  const conv = [...(G.convocati || [])].map((c) => ({ ...c, p: persona(c.id) })).filter((c) => c.p)
    .sort((a, b) => (a.n == null) - (b.n == null) || (a.n || 0) - (b.n || 0) || a.p.cognome.localeCompare(b.p.cognome));
  const staff = S.D.persone.filter((p) => p.app === "STAFF");
  const nomeC = (pid) => { const c = conv.find((x) => x.id === pid); const p = c?.p || persona(pid); return p ? `${c?.n != null ? c.n + " " : ""}${p.cognome}` : "?"; };
  const opz = (sel, conStaff = false) => `<option value="">— scegli —</option>` + conv.map((c) => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>${c.n != null ? c.n + " · " : ""}${esc(c.p.cognome)} ${esc(c.p.nome)}</option>`).join("")
    + (conStaff && staff.length ? `<optgroup label="Staff">${staff.map((p) => `<option value="${p.id}" ${sel === p.id ? "selected" : ""}>${esc(p.cognome)} ${esc(p.nome)}</option>`).join("")}</optgroup>` : "");
  const fatti = () => R.eventi.filter((e) => e.tipo === "GOL" || e.tipo === "AUTOGOL").length;
  const salvaPresto = (() => { let t; return () => { clearTimeout(t); t = setTimeout(() => inviaReferto(R, true), 800); }; })();

  const testoEv = (e) => e.tipo === "GOL" ? `Gol <b>${esc(nomeC(e.giocatore_id))}</b>${e.rigore ? " (rigore)" : ""}`
    : e.tipo === "AUTOGOL" ? "Autogol avversario"
    : e.tipo === "SOST" ? `Esce <b>${esc(nomeC(e.giocatore_id))}</b> · entra <b>${esc(nomeC(e.entra_id))}</b>`
    : `${e.tipo === "AMM" ? "Ammonito" : "Espulso"} <b>${esc(nomeC(e.giocatore_id))}</b>`;

  const disegna = () => {
    const noi = S.D.stagione.squadra, loro = G.avversario || "Avversari";
    const sub = R.gol_subiti ?? "–";
    const [sx, dx, gsx, gdx] = G.casa_trasferta === "T" ? [loro, noi, sub, fatti()] : [noi, loro, fatti(), sub];
    const ev = R.eventi.map((e, i) => ({ ...e, i })).sort((a, b) => (a.minuto ?? 999) - (b.minuto ?? 999) || a.i - b.i);
    const inPartita = S.partita?.gid === id;
    app().innerHTML = testata("Referto", `${G.avversario || ""} · ${dataIt(G.data)}`, `<button class="ib" id="bInd" aria-label="Indietro">${ico("indietro")}</button>`) + `
    <section class="pag">
      ${R.chiuso ? `<p class="avviso ok">${ico("fatto")}<span>Referto chiuso con <b>Fine gara</b> e inviato: il PC lo applicherà all'apertura. Finché non lo prende puoi ancora correggerlo.</span></p>`
        : inPartita ? `<p class="avviso">${ico("orologio")}<span><b>Gara in corso</b> dalle ${pad(new Date(S.partita.inizio).getHours())}:${pad(new Date(S.partita.inizio).getMinutes())}: la chiusura automatica è sospesa fino a <b>Fine gara</b>.</span></p>`
        : `<button class="btn verde lg" id="bInizio">${ico("fischietto")} Inizio gara</button><p class="nota">Sospende la chiusura automatica dell'app fino a <b>Fine gara</b>, così con il telefono in tasca non chiede di nuovo accesso e PIN.</p>`}
      <div class="card risult">
        <div class="sq"><span>${esc(sx)}</span><b>${gsx ?? ""}</b></div>
        <div class="sq"><span>${esc(dx)}</span><b>${gdx ?? ""}</b></div>
        <div class="subiti"><span>Gol subiti</span>
          <span class="step"><button class="ib" data-sub="-1" aria-label="Meno">−</button><b id="vSub">${R.gol_subiti ?? "–"}</b><button class="ib" data-sub="1" aria-label="Più">${ico("piu")}</button></span></div>
        <p class="nota" style="margin:6px 0 0">I gol fatti si contano dai gol e dagli autogol avversari qui sotto.</p>
      </div>
      <div class="card durata">
        <div><span class="muted">Durata regolamentare</span><b>${R.durata_base}'</b></div>
        <div><span class="muted">Recupero 2° tempo</span><span class="step"><button class="ib" data-rec="-1" aria-label="Meno">−</button><b>${R.recupero || 0}'</b><button class="ib" data-rec="1" aria-label="Più">${ico("piu")}</button></span></div>
        <div><span class="muted">Fine gara</span><b>${R.durata_base + (R.recupero || 0)}'</b></div>
      </div>
      <h2 class="sez">${ico("orologio")} Eventi <span class="sp"></span><span class="n">${R.eventi.length}</span></h2>
      <div class="agg">${Object.entries(TIPI_EV).map(([k, [ic, l]]) => `<button class="btn ev-${k}" data-add="${k}">${ico(ic)} ${l.replace(" avversario", " avv.")}</button>`).join("")}</div>
      ${ev.length ? `<div class="lista">${ev.map((e) => `<button class="rev" data-ev="${e.i}"><span class="min">${e.minuto != null ? e.minuto + "'" : "–"}</span>
          <span class="tic ev-${e.tipo}">${ico(TIPI_EV[e.tipo][0])}</span><span class="tx">${testoEv(e)}</span>${ico("succ")}</button>`).join("")}</div>`
        : `<div class="vuoto">Nessun evento: aggiungili con i pulsanti qui sopra.</div>`}
      <div id="refInvio"></div>
    </section>
    <nav class="barra"><button class="btn" id="bSalvaR">${ico("nuvola")} Salva</button><button class="btn pri" id="bFine">${ico("fischietto")} ${R.chiuso ? "Invia di nuovo" : "Fine gara"}</button></nav>`;
    statoInvio(R);
    $("bInd").onclick = torna;
    if ($("bInizio")) $("bInizio").onclick = () => { S.partita = { gid: id, inizio: Date.now() }; toast("Gara iniziata: chiusura automatica sospesa fino a Fine gara."); disegna(); };
    app().querySelectorAll("[data-sub]").forEach((b) => (b.onclick = () => { R.gol_subiti = Math.max(0, Math.min(50, (R.gol_subiti ?? 0) + +b.dataset.sub)); salvaPresto(); disegna(); }));
    app().querySelectorAll("[data-rec]").forEach((b) => (b.onclick = () => { R.recupero = Math.max(0, Math.min(20, (R.recupero || 0) + +b.dataset.rec)); salvaPresto(); disegna(); }));
    app().querySelectorAll("[data-add]").forEach((b) => (b.onclick = () => evento({ tipo: b.dataset.add, minuto: null, giocatore_id: null, entra_id: null, rigore: 0 }, null)));
    app().querySelectorAll("[data-ev]").forEach((b) => (b.onclick = () => evento({ ...R.eventi[+b.dataset.ev] }, +b.dataset.ev)));
    $("bSalvaR").onclick = async () => { if (await inviaReferto(R)) toast("Referto salvato su Drive (il PC lo applica dopo Fine gara)."); };
    $("bFine").onclick = fine;
  };

  const evento = (e, idx) => {
    const [ic, l] = TIPI_EV[e.tipo];
    const foglio = document.createElement("div");
    foglio.className = "foglio";
    foglio.innerHTML = `<div class="fbox" role="dialog" aria-label="${esc(l)}">
      <h3>${ico(ic)} ${esc(l)}</h3>
      <label class="campo"><span>Minuto${e.tipo === "SOST" ? "" : " (facoltativo)"}</span><input type="number" inputmode="numeric" id="eMin" min="0" max="${R.durata_base + (R.recupero || 0) + 30}" value="${e.minuto ?? ""}"></label>
      ${e.tipo === "GOL" ? `<label class="campo"><span>Marcatore</span><select id="eG">${opz(e.giocatore_id)}</select></label>
          <label class="interr"><input type="checkbox" id="eRig" ${e.rigore ? "checked" : ""}><span class="sw"></span> Su rigore</label>` : ""}
      ${e.tipo === "SOST" ? `<label class="campo"><span>Esce</span><select id="eG">${opz(e.giocatore_id)}</select></label>
          <label class="campo"><span>Entra</span><select id="eE">${opz(e.entra_id)}</select></label>` : ""}
      ${e.tipo === "AMM" || e.tipo === "ESP" ? `<label class="campo"><span>${e.tipo === "AMM" ? "Ammonito" : "Espulso"}</span><select id="eG">${opz(e.giocatore_id, true)}</select></label>` : ""}
      <div class="fazioni">${idx != null ? `<button class="btn" id="eDel">${ico("elimina")}</button>` : ""}<span class="sp"></span>
        <button class="btn" id="eNo">Annulla</button><button class="btn pri" id="eOk">${ico("fatto")} OK</button></div></div>`;
    document.body.appendChild(foglio);
    const chiudi = () => foglio.remove();
    foglio.onclick = (ev) => { if (ev.target === foglio) chiudi(); };
    $("eNo").onclick = chiudi;
    if ($("eDel")) $("eDel").onclick = () => { if (!confirm("Eliminare questo evento?")) return; R.eventi.splice(idx, 1); chiudi(); salvaPresto(); disegna(); };
    $("eOk").onclick = () => {
      const m = $("eMin").value === "" ? null : +$("eMin").value;
      const x = { tipo: e.tipo, minuto: m, giocatore_id: $("eG") ? (+$("eG").value || null) : null, entra_id: $("eE") ? (+$("eE").value || null) : null, rigore: $("eRig")?.checked ? 1 : 0 };
      if (e.tipo === "SOST" && m == null) return toast("Per la sostituzione serve il minuto.", true);
      if (e.tipo !== "AUTOGOL" && !x.giocatore_id) return toast("Scegli il giocatore.", true);
      if (e.tipo === "SOST" && (!x.entra_id || x.entra_id === x.giocatore_id)) return toast("Scegli chi entra (diverso da chi esce).", true);
      if (idx != null) R.eventi[idx] = x; else R.eventi.push(x);
      chiudi(); salvaPresto(); disegna();
    };
    setTimeout(() => $("eMin")?.focus(), 50);
  };

  const fine = async () => {
    if (R.gol_subiti == null) return toast("Indica i gol subiti (anche 0).", true);
    const err = erroriReferto(R, G);
    if (err.length) return toast("Referto: " + err[0] + ".", true);
    const tot = R.durata_base + (R.recupero || 0);
    if (!R.chiuso && !confirm(`Fine gara: ${fatti()} - ${R.gol_subiti}, durata ${tot}'. Inviare il referto al PC?`)) return;
    R.chiuso = true;
    const ok = await inviaReferto(R);
    if (S.partita?.gid === id) S.partita = null;     // torna la chiusura automatica
    toast(ok ? "Referto inviato: il PC lo applicherà all'apertura dell'app." : "Referto chiuso: parte da solo appena possibile.", !ok);
    disegna();
  };
  disegna();
  window.scrollTo(0, 0);
}

/** Accesso Google scaduto (dura un'ora): si rinnova senza perdere quello che c'è in memoria. */
async function riaccedi() {
  toast("L'accesso a Google è scaduto: accedi di nuovo e poi ripeti l'operazione.", true);
  try { await chiediToken(); toast("Accesso rinnovato: ripeti l'operazione."); }
  catch (e) { toast(e.message, true); }
}

/* ============================================================
   DASHBOARD LITE: risultati, classifiche, presenze per mese, giocatori.
   Sola lettura: i totali li calcola il PC (stessi numeri della sua Dashboard).
   ============================================================ */
const MESI_L = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
const fmt1 = (x, d = 1) => (Math.round(x * 10 ** d) / 10 ** d).toFixed(d).replace(".", ",");
const esitoG = (g) => !g.ref || g.gf == null || g.gs == null ? null : g.gf > g.gs ? "V" : g.gf < g.gs ? "P" : "N";
let statTab = "gare", statComp = "", statApp = new Set(["ROSA"]);
const APP_F = [["ROSA", "Rosa"], ["FUORI_ROSA", "Fuori rosa"], ["USCITO", "Usciti"]];
const filtroApp = () => `<div class="chips" role="group" aria-label="Chi mostrare">${APP_F.map(([k, l]) => `<button class="chip ${statApp.has(k) ? "on" : ""}" data-fa="${k}" aria-pressed="${statApp.has(k)}">${l}</button>`).join("")}</div>`;

function apriStat(tab = statTab) {
  S.vista = "stat"; statTab = tab;
  const T = S.D.stat, gio = T.giocatori.map((x) => ({ ...x, app: x.app || "ROSA", p: x.cognome ? x : persona(x.id) })).filter((x) => x.p);
  const scelti = gio.filter((x) => statApp.has(x.app));
  const tabs = [["gare", "palla", "Gare"], ["class", "coppa", "Classifiche"], ["pres", "presenze", "Presenze"], ["gioc", "persone", "Giocatori"]];
  let corpo = "";
  if (tab === "gare") {
    const L = T.gare.filter((g) => !statComp || g.comp === statComp), con = L.filter(esitoG);
    const c = (e) => con.filter((g) => esitoG(g) === e).length;
    corpo = `<div class="card">
        <div class="forma">${con.length ? con.map((g) => `<span class="fq ${esitoG(g)}" title="${esc(dmy(g.data) + " " + (g.avv || ""))}">${esitoG(g)}</span>`).join("") : `<span class="muted">Nessuna gara con il referto</span>`}</div>
        ${con.length ? `<div class="riep" style="margin:10px 0 0"><span><b style="color:var(--ok)">${c("V")}V</b> <b style="color:var(--inf)">${c("N")}N</b> <b style="color:var(--sq)">${c("P")}P</b>
          · gol ${con.reduce((t, g) => t + g.gf, 0)}–${con.reduce((t, g) => t + g.gs, 0)}</span></div>` : ""}</div>
      <div class="chips" role="group" aria-label="Competizione">${[["", "Tutte"], ["CAMP", "Campionato"], ["COPPA", "Coppa"], ["AMI", "Amichevole"]].map(([k, l]) =>
        `<button class="chip ${statComp === k ? "on" : ""}" data-fc="${k}" aria-pressed="${statComp === k}">${l}</button>`).join("")}</div>
      ${!L.length && T.gare.length ? `<div class="vuoto">Nessuna gara di questo tipo.</div>` : ""}
      ${L.length ? `<div class="lista">${L.slice().reverse().map((g) => { const e = esitoG(g); return `<div class="rgara ${g.conta ? "" : "no"}">
        <span class="d"><b>${dmy(g.data)}</b><small>${GG[dataDa(g.data).getDay()]}</small></span>
        <span class="a"><b>${esc(g.avv || "–")}</b><small>${g.ct === "T" ? "trasferta" : g.ct === "C" ? "casa" : ""}${g.ct ? " · " : ""}${esc(COMP[g.comp]?.[1] || "")}${g.conta ? "" : " · non conteggiata"}</small></span>
        ${e ? `<span class="ris ${e}">${g.gf}–${g.gs}</span>` : `<span class="ris">–</span>`}</div>`; }).join("")}</div>` : `<div class="vuoto">Nessuna gara giocata.</div>`}`;
  } else if (tab === "class") {
    const cat = [["Presenze allenamento", (x) => x.pp, (x) => fmt1(x.pp, 0) + "%"], ["Ultimi 9 allenamenti", (x) => x.ult, (x) => x.ult + "%"],
      ["Più titolari", (x) => x.tit, (x) => `${x.tit}/${T.nG}`], ["Minuti giocati", (x) => x.min, (x) => x.min + "'"],
      ["Marcatori", (x) => x.gol, (x) => x.gol], ["Più ammoniti", (x) => x.amm * 10 + x.esp * 30, (x) => `${x.amm}<i class="yc"></i>${x.esp ? ` ${x.esp}<i class="rc"></i>` : ""}`]];
    corpo = cat.map(([t, f, v], i) => {
      const L = gio.filter((x) => x.app === "ROSA").sort((a, b) => f(b) - f(a) || a.p.cognome.localeCompare(b.p.cognome)).filter((x) => f(x) > 0);
      return `<div class="card ccl"><h3>${t}</h3>${L.length ? `<div class="ccll">${L.map((x, k) => `<div class="rk ${k >= 5 ? "oltre" : ""}"><span class="n">${k + 1}</span><span class="t"><b>${esc(x.p.cognome)}</b> ${esc(x.p.nome[0] || "")}.</span><b>${v(x)}</b></div>`).join("")}</div>
        ${L.length > 5 ? `<button class="btn tutti" data-tutti="${L.length}" aria-expanded="false">Mostra tutti (${L.length})</button>` : ""}` : `<p class="muted" style="margin:0">— ancora nessuno —</p>`}</div>`;
    }).join("");
  } else if (tab === "pres") {
    const presTot = scelti.reduce((t, x) => t + x.pres, 0), possTot = scelti.reduce((t, x) => t + (x.poss ?? T.nAll), 0);
    const mesi = T.mesi.map((m, i) => { const n = scelti.reduce((t, x) => t + (x.pm[i] || 0), 0); return { ...m, media: m.all ? n / m.all : 0, perc: m.all && scelti.length ? (n / (m.all * scelti.length)) * 100 : 0 }; });
    corpo = filtroApp() + `<div class="card kpi3"><div><b>${T.nAll}</b><small>allenamenti</small></div><div><b>${fmt1(T.nAll ? presTot / T.nAll : 0)}</b><small>media presenti su ${scelti.length}</small></div><div><b>${fmt1(possTot ? (presTot / possTot) * 100 : 0)}%</b><small>presenza</small></div></div>
      ${mesi.length ? `<div class="lista">${mesi.slice().reverse().map((m) => { const [y, mo] = m.m.split("-"); return `<div class="rmese">
        <span class="mn"><b>${MESI_L[mo - 1]}</b><small>${y} · ${m.all} allenament${m.all === 1 ? "o" : "i"}</small></span>
        <span class="mb"><span class="bar"><i style="width:${Math.min(100, m.perc)}%"></i></span><small>${fmt1(m.perc, 0)}%</small></span>
        <span class="mv"><b>${fmt1(m.media)}</b><small>media</small></span></div>`; }).join("")}</div>` : `<div class="vuoto">Nessun allenamento.</div>`}`;
  } else {
    const L = scelti.slice().sort((a, b) => REP_ORD.indexOf(a.p.reparto) - REP_ORD.indexOf(b.p.reparto) || a.p.cognome.localeCompare(b.p.cognome));
    corpo = filtroApp() + (L.length ? `<div class="lista">${L.map((x) => `<button class="riga" data-sg="${x.id}">${badgeRep(x.p, "sm")}
      <span class="nome"><b>${esc(x.p.cognome)}</b> ${esc(x.p.nome)}<small>${esc(x.p.ruolo || "")}${x.app === "FUORI_ROSA" ? " · fuori rosa" + (x.categoria ? " " + esc(x.categoria) : "") : x.app === "USCITO" ? " · uscito" + (x.uscita ? " il " + dataIt(x.uscita) : "") : ""}</small></span>
      <span class="ext"><span class="pct">${fmt1(x.pp, 0)}%</span>${ico("succ")}</span></button>`).join("")}</div>` : `<div class="vuoto">Nessun giocatore con questi filtri.</div>`);
  }
  app().innerHTML = testata("Statistiche", `Stagione ${S.D.stagione.nome} · dati del ${dataIt(S.D.creato)}`, `<button class="ib" id="bInd" aria-label="Indietro">${ico("indietro")}</button>`) + `
    <section class="pag"><div class="tabs"><div class="seg st4">${tabs.map(([k, ic, l]) => `<button data-st="${k}" class="${k === tab ? "on" : ""}">${ico(ic)}<span>${l}</span></button>`).join("")}</div></div>
      ${corpo}<p class="piede">${tab === "class" ? "Giocatori della rosa, tutte le competizioni" : tab === "gare" ? "Gare giocate fino all'ultimo aggiornamento del PC" : "Presenze fino all'ultimo aggiornamento del PC"}</p></section>`;
  $("bInd").onclick = vaiHome;
  app().querySelectorAll("[data-st]").forEach((b) => (b.onclick = () => { apriStat(b.dataset.st); window.scrollTo(0, 0); }));
  app().querySelectorAll("[data-tutti]").forEach((b) => (b.onclick = () => {
    const ap = b.previousElementSibling.classList.toggle("aperta");
    b.textContent = ap ? "Chiudi" : `Mostra tutti (${b.dataset.tutti})`;
    b.setAttribute("aria-expanded", ap);
    if (!ap) b.closest(".ccl").scrollIntoView({ block: "nearest" });
  }));
  app().querySelectorAll("[data-fc]").forEach((b) => (b.onclick = () => { statComp = b.dataset.fc; apriStat("gare"); }));
  app().querySelectorAll("[data-fa]").forEach((b) => (b.onclick = () => {
    const k = b.dataset.fa;
    if (statApp.has(k)) { if (statApp.size === 1) return toast("Lascia almeno un gruppo acceso.", true); statApp.delete(k); } else statApp.add(k);
    const y = window.scrollY; apriStat(tab); window.scrollTo(0, y);
  }));
  app().querySelectorAll("[data-sg]").forEach((b) => (b.onclick = () => schedaStat(+b.dataset.sg)));
}
const dmy = (iso) => dataIt(iso).slice(0, 5);

function schedaStat(id) {
  S.vista = "stat";
  const T = S.D.stat, x = T.giocatori.find((g) => g.id === id), p = x?.cognome ? x : persona(id);
  if (!x || !p) return apriStat("gioc");
  const tile = (v, l) => `<div class="stile"><b>${v}</b><small>${l}</small></div>`;
  app().innerHTML = testata(`${p.cognome} ${p.nome}`, `${p.ruolo || ""}${p.nascita ? " · " + etaA(p.nascita, isoOggi()) + " anni" : ""}`, `<button class="ib" id="bInd" aria-label="Indietro">${ico("indietro")}</button>`) + `
    <section class="pag">
      <div class="stiles">
        ${tile(fmt1(x.pp, 0) + "%", `presenze (${x.pres}/${x.poss ?? T.nAll})`)}${tile(x.ult + "%", "ultimi 9 allenamenti")}
        ${tile(`${x.conv}/${T.nG}`, "convocazioni")}${tile(x.tit, "da titolare")}${tile(x.panc, "in panchina")}
        ${tile(x.min + "'", "minuti giocati")}${tile(x.gol, "gol")}${tile(`${x.amm}<i class="yc"></i> ${x.esp}<i class="rc"></i>`, "ammonizioni · espulsioni")}
      </div>
      <h2 class="sez">${ico("presenze")} Presenze per mese</h2>
      ${T.mesi.length ? `<div class="lista">${T.mesi.slice().reverse().map((m) => { const i = T.mesi.indexOf(m), n = x.pm[i] || 0, pc = m.all ? (n / m.all) * 100 : 0, [y, mo] = m.m.split("-"); return `<div class="rmese">
        <span class="mn"><b>${MESI_L[mo - 1]}</b><small>${y}</small></span>
        <span class="mb"><span class="bar"><i style="width:${pc}%"></i></span><small>${fmt1(pc, 0)}% · squadra ${fmt1(m.perc, 0)}%</small></span>
        <span class="mv"><b>${n}/${m.all}</b><small>presenze</small></span></div>`; }).join("")}</div>` : `<div class="vuoto">Nessun allenamento.</div>`}
    </section>`;
  $("bInd").onclick = () => apriStat("gioc");
  window.scrollTo(0, 0);
}

/* ============================================================
   PRESENZE: calendario e foglio del giorno
   Il telefono anticipa soltanto: fa fede il PC. I giorni che sul PC
   hanno già le presenze non si possono scegliere.
   ============================================================ */
const fileP = (data) => TEL_PREF + "p" + data + ".efm";
function presenzeInAttesa() {
  return Object.values(S.pend).filter((x) => x.p.tipo === "presenze").map((x) => x.p).sort((a, b) => a.data.localeCompare(b.data));
}
const giorniPC = () => new Map((S.D.allenamenti || []).map((a) => [a.data, a.n]));

let meseCal = null;
/** sposta = { da, sel }: si sta cambiando il giorno di presenze già segnate */
function apriCalendario(sposta = null) {
  S.vista = "calendario";
  if (!meseCal) { const d = new Date(); meseCal = [d.getFullYear(), d.getMonth()]; }
  const pc = giorniPC(), inv = new Map(presenzeInAttesa().map((p) => [p.data, p.presenti.length]));
  const gareG = new Set(gare().map((g) => g.data)), oggi = isoOggi();
  const [y, m] = meseCal;
  const ora = new Date(), ultimoMese = y > ora.getFullYear() || (y === ora.getFullYear() && m >= ora.getMonth());
  const primo = new Date(y, m, 1), giorni = new Date(y, m + 1, 0).getDate();
  const vuoti = (primo.getDay() + 6) % 7;           // settimana da lunedì
  let celle = "";
  for (let i = 0; i < vuoti; i++) celle += `<span></span>`;
  for (let d = 1; d <= giorni; d++) {
    const iso = `${y}-${pad(m + 1)}-${pad(d)}`;
    const fut = iso > oggi, no = pc.has(iso) || fut;
    const cl = [iso === oggi ? "oggi" : "", pc.has(iso) ? "pc" : "", fut ? "fut" : "", inv.has(iso) ? "inv" : "", gareG.has(iso) ? "gara" : "", sposta?.da === iso ? "da" : ""].join(" ");
    const sotto = pc.has(iso) ? `<small>${pc.get(iso)}</small>` : inv.has(iso) ? `<small>${inv.get(iso)}</small>` : "";
    celle += `<button class="gc ${cl}" data-d="${iso}" ${no ? 'aria-disabled="true"' : ""} aria-label="${esc(giornoData(iso))}${pc.has(iso) ? ", presenze già sul PC" : ""}"><b>${d}</b>${sotto}</button>`;
  }
  const nomeMese = primo.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  app().innerHTML = testata("Presenze", sposta ? `Sposta dal ${dataIt(sposta.da)}: scegli il giorno giusto` : "Scegli il giorno dell'allenamento", `<button class="ib" id="bInd" aria-label="Indietro">${ico("indietro")}</button>`) + `
    <section class="pag">
      <div class="card cal">
        <div class="calh"><button class="ib" id="mPrec" aria-label="Mese precedente">${ico("prec")}</button><b>${esc(nomeMese)}</b><button class="ib" id="mSucc" aria-label="Mese successivo" ${ultimoMese ? "disabled" : ""}>${ico("succ")}</button></div>
        <div class="calg">${["L", "M", "M", "G", "V", "S", "D"].map((x) => `<i>${x}</i>`).join("")}${celle}</div>
      </div>
      <div class="leg">
        <span><i class="l pc"></i>presenze già sul PC (non selezionabile)</span>
        <span><i class="l fut"></i>giorni futuri (non selezionabili)</span>
        <span><i class="l inv"></i>inviate dal telefono, in attesa del PC</span>
        <span><i class="l gara"></i>giorno di gara</span>
      </div>
      <button class="btn verde lg" id="bOggi" ${pc.has(oggi) ? "disabled" : ""}>${ico("presenze")} Presenze di oggi</button>
      ${pc.has(oggi) ? `<p class="nota">Le presenze di oggi sono già sul PC: eventuali correzioni si fanno dal PC.</p>` : ""}
      ${sposta ? "" : `<button class="btn lg" id="bFoglio" style="margin-top:10px">${ico("report")} Stampa foglio presenze</button>
      <p class="nota">Il foglio da compilare a mano, come quello del PC: si stampa con una stampante Wi-Fi o si salva in PDF.</p>`}
    </section>`;
  const scegli = (iso) => {
    if (sposta) {
      if (iso === sposta.da) return apriPresenze(iso, { ...sposta, da: iso });
      if (inv.has(iso) && !confirm(`Il ${dataIt(iso)} ha già presenze inviate dal telefono: sostituirle con queste?`)) return;
    }
    apriPresenze(iso, sposta);
  };
  $("bInd").onclick = () => { if (sposta) return apriPresenze(sposta.da, { ...sposta }); meseCal = null; vaiHome(); };
  $("mPrec").onclick = () => { meseCal = m === 0 ? [y - 1, 11] : [y, m - 1]; apriCalendario(); };
  $("mSucc").onclick = () => { if (ultimoMese) return; meseCal = m === 11 ? [y + 1, 0] : [y, m + 1]; apriCalendario(); };
  $("bOggi").onclick = () => scegli(oggi);
  if ($("bFoglio")) $("bFoglio").onclick = stampaFoglioPresenze;
  app().querySelector(".calg").onclick = (e) => {
    const b = e.target.closest("[data-d]");
    if (!b) return;
    if (pc.has(b.dataset.d)) return toast(`Il ${dataIt(b.dataset.d)} ha già le presenze sul PC (${pc.get(b.dataset.d)} presenti): correggile dal PC.`, true);
    if (b.dataset.d > oggi) return toast("Le presenze si segnano solo per oggi o per i giorni passati.", true);
    scegli(b.dataset.d);
  };
}

let garaFR = false;   // gara (convocati e formazione): fuori rosa nascosti all'apertura dell'app
const interFR = (n, cosa = "") => n ? `<label class="interr"><input type="checkbox" id="cGFR" ${garaFR ? "checked" : ""}><span class="sw"></span> Mostra fuori rosa${cosa ? " " + cosa : ""} (${n})</label>` : "";
let presVista = { fr: false, ord: "rep" };   // solo per questa apertura dell'app
/** sposta = { da, sel }: presenze portate da un altro giorno (quelle del giorno "da" si tolgono all'invio) */
function apriPresenze(data, sposta = null) {
  S.vista = "presenze";
  const origine = sposta?.da || data;                       // giorno di cui ci sono (forse) presenze già inviate
  const prima = S.pend[fileP(data)]?.p;
  const inviataOrig = S.pend[fileP(origine)];
  const sel = new Set(sposta ? sposta.sel : prima ? prima.presenti : []);
  let salvata = !!prima && !sposta;
  const giocatori = () => S.D.persone.filter((p) => p.app !== "STAFF" && (presVista.fr || p.app !== "FUORI_ROSA" || sel.has(p.id)))
    .sort((a, b) => presVista.ord === "rep" ? REP_ORD.indexOf(a.reparto) - REP_ORD.indexOf(b.reparto) || (a.cognome + a.nome).localeCompare(b.cognome + b.nome)
      : (a.cognome + a.nome).localeCompare(b.cognome + b.nome));
  const nFR = S.D.persone.filter((p) => p.app === "FUORI_ROSA").length;
  const riga = (p) => {
    const on = sel.has(p.id), st = STATO[p.stato];
    return `<button class="riga ${on ? "on" : ""}" data-p="${p.id}" aria-pressed="${on}">
      <span class="sel">${ico("fatto")}</span>${badgeRep(p, "sm")}
      <span class="nome"><b>${esc(p.cognome)}</b> ${esc(p.nome)}<small>${esc(p.ruolo || "")}${p.app === "FUORI_ROSA" ? " · fuori rosa" : ""}</small></span>
      <span class="ext">${st ? `<span class="bd sm ${st[0]}" title="${esc(p.stato)}">${ico(st[1])}</span>` : ""}</span></button>`;
  };
  const elenco = () => {
    const L = giocatori();
    if (!L.length) return `<div class="vuoto">Nessun giocatore in rosa.</div>`;
    if (presVista.ord === "alfa") return `<div class="lista">${L.map(riga).join("")}</div>`;
    let out = "";
    for (const r of REP_ORD) {
      const g = L.filter((p) => p.reparto === r);
      if (g.length) out += `<div class="rep"><span>${REP[r]}</span><span>${g.filter((p) => sel.has(p.id)).length}/${g.length}</span></div><div class="lista">${g.map(riga).join("")}</div>`;
    }
    return out;
  };
  const conta = () => `<b>${sel.size}</b> presenti su ${giocatori().length}`;
  const disegna = () => {
    app().innerHTML = testata("Presenze", giornoData(data), `<button class="ib" id="bInd" aria-label="Indietro">${ico("indietro")}</button>`,
      `<button class="ib" id="bGiorno" aria-label="Cambia giorno">${ico("calendario")}</button>`) + `
    <section class="pag">
      ${origine !== data ? `<p class="avviso">${ico("calendario")}<span>Giorno cambiato: dal <b>${esc(giornoData(origine))}</b> al <b>${esc(giornoData(data))}</b>. Con <b>Salva e invia</b> ${inviataOrig ? `quelle già inviate per il ${dataIt(origine)} vengono tolte.` : "si inviano per il giorno nuovo."}</span></p>`
        : prima ? `<p class="avviso">${ico("orologio")}<span>Presenze già inviate dal telefono e non ancora prese dal PC: puoi correggerle, cambiare giorno (${ico("calendario")} in alto) o eliminarle.</span></p>` : ""}
      <div class="tabs"><div class="seg">
        <button data-o="rep" class="${presVista.ord === "rep" ? "on" : ""}">${ico("persone")} Per reparto</button>
        <button data-o="alfa" class="${presVista.ord === "alfa" ? "on" : ""}">${ico("alfa")} A-Z</button></div></div>
      <div class="riep"><span id="conta">${conta()}</span><span class="sp"></span>
        <button class="btn" id="bTutti" style="min-height:40px">Tutti</button><button class="btn" id="bNessuno" style="min-height:40px">Nessuno</button></div>
      ${nFR ? `<label class="interr"><input type="checkbox" id="cFR" ${presVista.fr ? "checked" : ""}><span class="sw"></span> Mostra fuori rosa (${nFR})</label>` : ""}
      <div id="elenco">${elenco()}</div>
    </section>
    <nav class="barra">${inviataOrig ? `<button class="btn" id="bElimina" style="flex:0 0 auto">${ico("elimina")} Elimina</button>` : ""}<button class="btn pri lg" id="bInvia">${ico("nuvola")} Salva e invia</button></nav>`;
    $("bInd").onclick = () => { if (!salvata && sel.size && !confirm("Le presenze non sono state inviate. Uscire lo stesso?")) return; apriCalendario(); };
    $("bGiorno").onclick = () => apriCalendario({ da: origine, sel: [...sel] });
    if ($("bElimina")) $("bElimina").onclick = elimina;
    app().querySelectorAll("[data-o]").forEach((b) => (b.onclick = () => { presVista.ord = b.dataset.o; disegna(); }));
    if ($("cFR")) $("cFR").onchange = (e) => { presVista.fr = e.target.checked; disegna(); };
    $("bTutti").onclick = () => { giocatori().forEach((p) => sel.add(p.id)); salvata = false; disegna(); };
    $("bNessuno").onclick = () => { sel.clear(); salvata = false; disegna(); };
    $("elenco").onclick = (e) => {
      const r = e.target.closest("[data-p]");
      if (!r) return;
      const id = +r.dataset.p;
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      salvata = false;
      r.classList.toggle("on", sel.has(id)); r.setAttribute("aria-pressed", sel.has(id));
      $("conta").innerHTML = conta();
      if (presVista.ord === "rep") $("elenco").querySelectorAll(".rep").forEach((h, i) => {
        const lista = h.nextElementSibling, tot = lista.children.length, on = lista.querySelectorAll(".riga.on").length;
        h.lastElementChild.textContent = `${on}/${tot}`;
      });
    };
    $("bInvia").onclick = invia;
  };
  const invia = async () => {
    if (!sel.size && !confirm("Nessun presente selezionato. Inviare lo stesso?")) return;
    const b = $("bInvia");
    b.disabled = true; b.innerHTML = `<span class="giro"></span> Invio…`;
    try {
      const nome = fileP(data);
      const p = { v: 1, tipo: "presenze", telefono: S.modello, dispositivo: S.disp, creato: new Date().toISOString(), stagione_id: S.D.stagione.id, data, presenti: [...sel].sort((a, b) => a - b) };
      const r = await carica(nome, S.lite.parents[0], chiudiFile(JSON.stringify(p)), S.pend[nome]?.id);
      S.pend[nome] = { id: r.id || S.pend[nome]?.id, p };
      salvata = true;
      let extra = "";
      if (origine !== data && inviataOrig) {
        const tolta = await eliminaDaDrive(inviataOrig.id).catch(() => null);
        delete S.pend[fileP(origine)];
        if (tolta === false) extra = ` Attenzione: quelle del ${dataIt(origine)} erano già state prese dal PC, correggile dal PC.`;
        else if (tolta === null) extra = ` Non sono riuscito a togliere quelle del ${dataIt(origine)}: eliminale dal PC.`;
      }
      toast(`Presenze del ${dataIt(data)} inviate (${sel.size}): il PC le prenderà all'apertura dell'app.` + extra, !!extra);
      meseCal = null;
      vaiHome();
    } catch (e) {
      b.disabled = false; b.innerHTML = `${ico("nuvola")} Salva e invia`;
      if (e instanceof ErroreAccesso) return riaccedi();
      toast(e.message, true);
    }
  };
  const elimina = async () => {
    if (!confirm(`Eliminare le presenze del ${dataIt(origine)} inviate dal telefono?`)) return;
    const b = $("bElimina");
    b.disabled = true;
    try {
      const tolta = await eliminaDaDrive(inviataOrig.id);
      delete S.pend[fileP(origine)];
      toast(tolta ? `Presenze del ${dataIt(origine)} eliminate.` : `Il PC aveva già preso le presenze del ${dataIt(origine)}: correggile o eliminale dal PC.`, !tolta);
      meseCal = null;
      vaiHome();
    } catch (e) {
      b.disabled = false;
      if (e instanceof ErroreAccesso) return riaccedi();
      toast(e.message, true);
    }
  };
  disegna();
  window.scrollTo(0, 0);
}

/* ============================================================
   REPORT: "Lista convocati" come nell'app del PC, in immagine
   ============================================================ */
async function report(E, salvata, torna) {
  S.vista = "report";
  app().innerHTML = testata("Report convocati", giornoData(E.data), `<button class="ib" id="bInd" aria-label="Indietro">${ico("indietro")}</button>`) +
    `<section class="pag"><div class="attesa" style="justify-content:center;padding:40px;color:var(--muted)"><span class="giro"></span>Preparo l'immagine…</div></section>`;
  $("bInd").onclick = torna;
  let blob;
  try { blob = await disegnaReport(E); } catch (e) { toast("Non riesco a preparare l'immagine: " + e.message, true); torna(); return; }
  const url = URL.createObjectURL(blob);
  const nome = `Convocati_${E.data}_${(E.avversario || "gara").replace(/[^A-Za-z0-9]+/g, "_")}.png`;
  const file = new File([blob], nome, { type: "image/png" });
  const puoi = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  app().querySelector(".pag").innerHTML = `
    ${salvata ? "" : `<p class="avviso">${ico("avviso")}<span>Questa versione della gara <b>non è ancora salvata</b> su Drive: torna indietro e premi Salva perché arrivi anche al PC.</span></p>`}
    <div class="anteprima"><img src="${url}" alt="Lista convocati"></div>
    <p class="nota">Con <b>Condividi</b> scegli WhatsApp e poi la chat o il gruppo della squadra.</p>`;
  const barra = document.createElement("nav");
  barra.className = "barra";
  barra.innerHTML = `<a class="btn" id="bScarica" href="${url}" download="${esc(nome)}">${ico("scarica")} Scarica</a>
    ${puoi ? `<button class="btn pri" id="bCond">${ico("condividi")} Condividi</button>` : ""}`;
  app().appendChild(barra);
  $("bInd").onclick = () => { URL.revokeObjectURL(url); torna(); };
  if (puoi) $("bCond").onclick = async () => {
    try { await navigator.share({ files: [file], title: "Lista convocati" }); }
    catch (e) { if (e.name !== "AbortError") toast("Condivisione non riuscita: usa Scarica e invia l'immagine da WhatsApp.", true); }
  };
  window.scrollTo(0, 0);
}

/**
 * Foglio presenze da compilare a mano (A4), uguale a "Format presenze" del PC:
 * giocatori della rosa, 10 giorni con P/A, totale e 6 righe libere in fondo.
 * Si usa la stampa del telefono: stampanti Wi-Fi oppure "Salva come PDF".
 */
function stampaFoglioPresenze() {
  const COL = 10, LIBERE = 6;
  const rosa = S.D.persone.filter((p) => p.app === "ROSA").sort((a, b) => (a.cognome + " " + a.nome).localeCompare(b.cognome + " " + b.nome));
  const vuote = (cl = "") => Array.from({ length: COL }, () => `<td colspan="2" class="${cl}"></td>`).join("");
  const pa = Array.from({ length: COL }, () => `<td class="pa p">P</td><td class="pa a">A</td>`).join("");
  const sep = `<tr class="sep"><td colspan="${1 + COL * 2}"></td></tr>`;
  document.getElementById("stampa")?.remove();
  const d = document.createElement("div");
  d.id = "stampa";
  d.innerHTML = `<header>${S.D.logo ? `<img src="${esc(S.D.logo)}" alt="">` : ""}<h1>Presenze allenamento</h1></header>
    <table class="fmt" style="--h:${Math.max(5, Math.min(6.6, 205 / (rosa.length + LIBERE))).toFixed(2)}mm"><colgroup><col style="width:24%">${`<col style="width:3.8%">`.repeat(COL * 2)}</colgroup>
      <tr class="data"><td class="nome">Data</td>${vuote()}</tr>${sep}
      ${rosa.map((p) => `<tr><td class="nome">${esc(p.cognome + " " + p.nome)}</td>${pa}</tr>`).join("")}
      <tr class="tot"><td class="nome">Totale: ${rosa.length}</td>${vuote()}</tr>${sep}
      ${`<tr><td class="nome"></td>${pa}</tr>`.repeat(LIBERE)}
    </table>`;
  document.body.appendChild(d);
  const togli = () => { d.remove(); window.removeEventListener("afterprint", togli); };
  window.addEventListener("afterprint", togli);
  const img = d.querySelector("img");
  const vai = () => { try { window.print(); } catch (e) { togli(); toast("La stampa non è disponibile su questo telefono.", true); } };
  if (img && !img.complete) { img.onload = img.onerror = vai; } else vai();
}

function caricaImg(src) {
  return new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
}

/**
 * Disegna la pagina A4 come stampa.php del PC (tipo "convocati").
 * Misure in millimetri e punti tipografici, convertite a 150 dpi (×1,5 per la nitidezza).
 */
async function disegnaReport(E) {
  const D = S.D, K = 1.5;
  const MM = 150 / 25.4 * K, PT = 150 / 72 * K, PX = 150 / 96 * K;
  const W = Math.round(210 * MM), M = 16 * MM, larg = W - 2 * M;
  const FONT = 'Roboto, "Segoe UI", Arial, sans-serif';
  const conv = (E.convocati || []).map((c) => persona(c.id)).filter(Boolean)
    .sort((a, b) => ((a.cognome + a.nome) < (b.cognome + b.nome) ? -1 : (a.cognome + a.nome) > (b.cognome + b.nome) ? 1 : 0));
  const eta = conv.filter((p) => p.nascita).map((p) => etaA(p.nascita, E.data));
  const etaMedia = eta.length ? (eta.reduce((a, b) => a + b, 0) / eta.length).toFixed(1).replace(".", ",") : "–";
  const comp = COMP[E.competizione]?.[1] || "";
  const casa = { C: "in casa", T: "in trasferta" }[E.casa_trasferta] || "";
  const casaTxt = comp ? comp + (casa ? ", " + casa : "") : casa;
  const logo = D.logo ? await caricaImg(D.logo) : null;
  await document.fonts?.ready;

  const rigaH = (11.5 * PT * 1.35) + 10 * PX + 1;
  const altezzaInfo = 4 * (11 * PT * 1.35) + 3 * 5 * PX;
  const contenuto = M + 22 * MM + 20 * PX + 14 * PX + altezzaInfo + 16 * PX + (9.5 * PT * 1.35 + 8 * PX) + conv.length * rigaH + 26 * PX + 40 * PX + M;
  const H = Math.max(Math.round(297 * MM), Math.ceil(contenuto));

  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  c.fillStyle = "#fff"; c.fillRect(0, 0, W, H);
  c.textBaseline = "alphabetic";
  const font = (pt, peso = 400) => (c.font = `${peso} ${pt * PT}px ${FONT}`);
  const testo = (t, x, y, max) => {
    t = String(t ?? "");
    if (max && c.measureText(t).width > max) { while (t.length > 1 && c.measureText(t + "…").width > max) t = t.slice(0, -1); t += "…"; }
    c.fillText(t, x, y); return c.measureText(t).width;
  };
  const spaziato = (t, x, y, sp) => { for (const ch of t) { c.fillText(ch, x, y); x += c.measureText(ch).width + sp; } return x; };

  // intestazione: logo, squadra · stagione, titolo, riga nera
  let y = M;
  const hLogo = 22 * MM;
  let xt = M;
  if (logo) {
    const r = Math.min(hLogo / logo.width, hLogo / logo.height), lw = logo.width * r, lh = logo.height * r;
    c.drawImage(logo, M + (hLogo - lw) / 2, y + (hLogo - lh) / 2, lw, lh);
    xt = M + hLogo + 16 * PX;
  }
  c.fillStyle = "#444"; font(10);
  const blocco = 10 * PT * 1.35 + 2 * PX + 24 * PT * 1.15;
  let yt = y + (hLogo - blocco) / 2 + 10 * PT;
  spaziato(`${D.stagione.squadra} · Stagione ${D.stagione.nome}`.toUpperCase(), xt, yt, 0.5 * PX);
  c.fillStyle = "#111"; font(24, 700);
  yt += 2 * PX + 24 * PT * 1.05;
  spaziato("LISTA CONVOCATI", xt, yt, 0.5 * PX);
  y += hLogo + 10 * PX;
  c.fillRect(M, y, larg, 2 * PX);
  y += 2 * PX + 14 * PX;

  // righe di informazioni
  const lh = 11 * PT * 1.35, il = 34 * MM;
  const riga = (parti) => {
    let x = M;
    y += lh * 0.78;
    for (const [tipo, t] of parti) {
      if (tipo === "l") { font(11); c.fillStyle = "#555"; testo(t, x, y); x += il; }
      else if (tipo === "l2") { font(11); c.fillStyle = "#555"; x += 6 * MM; x += testo(t, x, y) + 2 * MM; }
      else if (tipo === "b") { font(11, 700); c.fillStyle = "#111"; x += testo(t, x, y, M + larg - x); }
      else if (tipo === "n") { font(11); c.fillStyle = "#111"; x += testo(t, x, y, M + larg - x); }
    }
    y += lh * 0.22 + 5 * PX;
  };
  riga([["l", "Data:"], ["b", giornoData(E.data)], ["l2", "Ora Presentazione:"], ["b", E.ora_presentazione || "–"], ["l2", "Ora Inizio Gara:"], ["b", E.ora_inizio || "–"]]);
  riga([["l", "Gara:"], ["b", (E.avversario || "–") + " "], ["n", casaTxt ? `(${casaTxt})` : ""]]);
  riga([["l", "Luogo:"], ["b", E.campo || "–"]]);
  riga([["l", "Totale Convocati:"], ["b", String(conv.length)], ["l2", "Età Media:"], ["b", etaMedia]]);
  y += 16 * PX - 5 * PX;

  // tabella: # | Giocatore | Ruolo | Anno
  const cN = 14 * MM, cR = 48 * MM, cA = 22 * MM, cG = larg - cN - cR - cA;
  const xN = M, xG = M + cN, xR = xG + cG, xA = xR + cR, p6 = 6 * PX;
  font(9.5); c.fillStyle = "#444";
  const thH = 9.5 * PT * 1.35 + 8 * PX;
  const yth = y + 4 * PX + 9.5 * PT;
  const centro = (t, x, w, yy) => c.fillText(t, x + (w - c.measureText(t).width) / 2, yy);
  font(9.5, 700);
  centro("#", xN, cN, yth);
  spaziato("GIOCATORE", xG + p6, yth, 0.4 * PX);
  spaziato("RUOLO", xR + p6, yth, 0.4 * PX);
  const wa = [..."ANNO"].reduce((s, ch) => s + c.measureText(ch).width + 0.4 * PX, 0);
  spaziato("ANNO", xA + (cA - wa) / 2, yth, 0.4 * PX);
  y += thH;
  c.fillStyle = "#111"; c.fillRect(M, y, larg, 1.5 * PX);
  y += 1.5 * PX;
  conv.forEach((p, i) => {
    const yb = y + 5 * PX + 11.5 * PT;
    c.fillStyle = "#111";
    font(11.5, 700); centro(String(i + 1), xN, cN, yb);
    const wc = testo(p.cognome, xG + p6, yb, cG - 2 * p6);
    font(11.5); testo(" " + (p.nome || ""), xG + p6 + wc, yb, Math.max(0, cG - 2 * p6 - wc));
    testo(p.ruolo || "", xR + p6, yb, cR - 2 * p6);
    if (p.nascita) centro(p.nascita.slice(0, 4), xA, cA, yb);
    y += rigaH;
    c.fillStyle = "#ddd"; c.fillRect(M, y - 1 * PX, larg, 1 * PX);
  });

  // firma
  y += 26 * PX;
  const wf = 60 * MM, xf = M + larg - wf;
  c.fillStyle = "#555"; c.fillRect(xf, y, wf, 1 * PX);
  font(10); c.fillStyle = "#444";
  centro("L'allenatore", xf, wf, y + 4 * PX + 10 * PT);

  return new Promise((ok, ko) => cv.toBlob((b) => (b ? ok(b) : ko(new Error("immagine vuota"))), "image/png"));
}

/* ---------- sicurezza: dati richiusi dopo qualche minuto in background ---------- */
let nascostaDal = 0;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { nascostaDal = Date.now(); return; }
  const inPartita = S.partita && Date.now() - S.partita.inizio < 4 * 3600000;
  if (S.D && !inPartita && nascostaDal && Date.now() - nascostaDal > BLOCCO_MINUTI * 60000) {
    azzera();
    schermataAccesso("Per sicurezza i dati sono stati richiusi: accedi di nuovo.");
  }
});
window.addEventListener("pagehide", () => azzera());

schermataAccesso();
