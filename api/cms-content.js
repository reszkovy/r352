// CMS API â edycja tresci stron statycznych w repo r352.
// Wymagane env: GITHUB_TOKEN, GITHUB_REPO, CMS_PASSWORD. Opcjonalne: GITHUB_BRANCH.
//
// Akcje:
//   GET  ?action=pages              â lista edytowalnych stron
//   GET  ?action=texts&page=X&raw=1 â {sha, items, html}
//   PUT  ?action=texts&page=X       â {sha, edits} â commit
//   POST ?action=upload             â upload obrazka (base64) do repo
//   GET  ?action=deploy-status&commit=X â status deployu Vercela

import crypto from 'node:crypto';
import { PAGES, UPLOAD } from './_cms-config.js';

const GITHUB_API = 'https://api.github.com';
const repo = () => process.env.GITHUB_REPO;
const branch = () => process.env.GITHUB_BRANCH || 'main';

function verifyAuth(req) {
  const auth = req.headers['x-cms-token'];
  if (!auth || !process.env.CMS_PASSWORD) return false;
  const expected = crypto.createHmac('sha256', process.env.CMS_PASSWORD).update('tb-cms-session-v1').digest('hex');
  return Buffer.from(auth, 'base64').toString() === `cms:${expected}`;
}

async function gh(path, options = {}) {
  return fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

async function readFile(path, ref) {
  const res = await gh(`/repos/${repo()}/contents/${encodeURIComponent(path)}?ref=${ref || branch()}`);
  if (!res.ok) return null;
  const data = await res.json();
  return { content: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
}

async function listDir(path) {
  const res = await gh(`/repos/${repo()}/contents/${encodeURIComponent(path)}?ref=${branch()}`);
  if (!res.ok) return [];
  return res.json();
}

async function commitFiles(files, message) {
  const refRes = await gh(`/repos/${repo()}/git/ref/heads/${branch()}`);
  if (!refRes.ok) throw new Error('Nie mozna odczytac galezi ' + branch());
  const baseSha = (await refRes.json()).object.sha;
  const baseCommitRes = await gh(`/repos/${repo()}/git/commits/${baseSha}`);
  const baseTree = (await baseCommitRes.json()).tree.sha;
  const tree = files.map(f => ({ path: f.path, mode: '100644', type: 'blob', content: f.content }));
  const treeRes = await gh(`/repos/${repo()}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: baseTree, tree }) });
  if (!treeRes.ok) throw new Error('Blad tworzenia drzewa: ' + (await treeRes.text()).slice(0, 200));
  const treeSha = (await treeRes.json()).sha;
  const commitRes = await gh(`/repos/${repo()}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: treeSha, parents: [baseSha] }) });
  if (!commitRes.ok) throw new Error('Blad tworzenia commita');
  const commitSha = (await commitRes.json()).sha;
  const updateRes = await gh(`/repos/${repo()}/git/refs/heads/${branch()}`, { method: 'PATCH', body: JSON.stringify({ sha: commitSha, force: false }) });
  if (!updateRes.ok) throw new Error('Konflikt zapisu â sprobuj ponownie');
  return commitSha;
}

// âââ INWENTARZ TEKSTOW âââ

const VOID_TAGS = new Set(['img','br','hr','input','meta','link','source','area','base','col','embed','track','wbr']);
const SKIP_CONTENT = new Set(['script','style','svg','noscript','head']);

function decode(s) {
  return s.replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&amp;/g,'&');
}
function encodeNode(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function encodeAttr(s) { return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function extractTexts(html) {
  const items = [];
  let id = 0;

  // <title>
  const t = html.match(/<title>([\s\S]*?)<\/title>/);
  if (t) items.push({ id: id++, start: t.index + 7, end: t.index + 7 + t[1].length, text: decode(t[1]), tag: 'title', section: 'SEO strony', kind: 'node' });

  // meta description + og:description
  for (const re of [/<meta name="description" content="/g, /<meta property="og:description" content="/g]) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const start = m.index + m[0].length;
      const end = html.indexOf('"', start);
      if (end > start) items.push({ id: id++, start, end, text: decode(html.slice(start, end)), tag: 'meta', section: 'SEO strony', kind: 'attr' });
    }
  }

  // Tokenizacja body
  const bodyStart = html.search(/<body[^>]*>/);
  if (bodyStart < 0) return items;

  const tagRe = /<!--[\s\S]*?-->|<[^>]+>/g;
  tagRe.lastIndex = bodyStart;
  const stack = [];
  let skipDepthTag = null;
  let lastSection = 'Poczatek strony';
  let lastIndex = tagRe.lastIndex;
  let m;
  let headingCapture = null;

  while ((m = tagRe.exec(html)) !== null) {
    const between = html.slice(lastIndex, m.index);
    if (between.trim() && !skipDepthTag) {
      const raw = between;
      const trimmedStart = raw.length - raw.replace(/^\s+/,'').length;
      const trimmedEnd = raw.length - raw.replace(/\s+$/,'').length;
      const start = lastIndex + trimmedStart;
      const end = m.index - trimmedEnd;
      const text = decode(raw.trim());
      const tag = stack.length ? stack[stack.length - 1] : 'body';
      if (text.length >= 2 && !/^[\d\s.,:;|âââ¢-]+$/.test(text)) {
        items.push({ id: id++, start, end, text, tag, section: lastSection, kind: 'node' });
      }
      if (headingCapture) headingCapture.buf.push(text);
    }
    lastIndex = tagRe.lastIndex;

    const token = m[0];
    if (token.startsWith('<!--')) continue;
    const isClose = token.startsWith('</');
    const nameM = token.match(/^<\/?\s*([a-zA-Z0-9-]+)/);
    if (!nameM) continue;
    const name = nameM[1].toLowerCase();

    if (!isClose && name === 'img') {
      const altM = token.match(/\balt="([^"]*)"/);
      if (altM && altM[1].trim().length >= 2 && !skipDepthTag) {
        const altStart = m.index + token.indexOf(altM[0]) + 5;
        items.push({ id: id++, start: altStart, end: altStart + altM[1].length, text: decode(altM[1]), tag: 'img-alt', section: lastSection, kind: 'attr' });
      }
      const srcM = token.match(/\bsrc="([^"]*)"/);
      if (srcM && !skipDepthTag && !/^data:/.test(srcM[1])) {
        const srcStart = m.index + token.indexOf(srcM[0]) + 5;
        items.push({ id: id++, start: srcStart, end: srcStart + srcM[1].length, text: srcM[1], tag: 'img-src', section: lastSection, kind: 'img-src' });
      }
    }
    if (VOID_TAGS.has(name)) continue;
    const selfClosed = token.endsWith('/>');
    if (selfClosed) continue;

    if (isClose) {
      const idx = stack.lastIndexOf(name);
      if (idx >= 0) stack.length = idx;
      if (skipDepthTag === name) skipDepthTag = null;
      if (headingCapture && headingCapture.tag === name) {
        const txt = headingCapture.buf.join(' ').trim();
        if (txt) lastSection = txt.slice(0, 60);
        headingCapture = null;
      }
    } else {
      stack.push(name);
      if (SKIP_CONTENT.has(name) && !skipDepthTag) skipDepthTag = name;
      if (/^h[1-3]$/.test(name) && !headingCapture) headingCapture = { tag: name, buf: [] };
    }
  }
  return items;
}

function applyEdits(html, edits) {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  for (const e of sorted) {
    if (typeof e.start !== 'number' || typeof e.end !== 'number' || e.end < e.start) throw new Error('Nieprawidlowy zakres edycji');
    const current = html.slice(e.start, e.end);
    if (decode(current.trim()) !== decode(String(e.old).trim())) {
      throw new Error(`Tekst zmienil sie w miedzyczasie ("${String(e.old).slice(0,40)}..."). Odswiez strone i sprobuj ponownie.`);
    }
    let enc;
    if (e.kind === 'img-src') {
      if (!/^[a-zA-Z0-9_/.-]+\.(webp|jpg|jpeg|png|svg|avif)$/.test(String(e.text))) throw new Error('Nieprawidlowa sciezka obrazka');
      enc = String(e.text);
    } else {
      enc = e.kind === 'attr' ? encodeAttr(String(e.text)) : encodeNode(String(e.text));
    }
    html = html.slice(0, e.start) + enc + html.slice(e.end);
  }
  return html;
}

// âââ LISTA STRON âââ

async function listPages() {
  const root = await listDir('');
  const pages = [];
  for (const f of root) {
    if (f.type === 'file' && f.name.endsWith('.html') && !PAGES.excludePattern.test(f.name)) {
      let group = 'Inne';
      for (const [g, re] of Object.entries(PAGES.groups)) {
        if (re.test(f.name)) { group = g; break; }
      }
      pages.push({ path: f.name, group });
    }
  }
  // sortowanie: TB najpierw, potem reszta alfabetycznie
  const ORDER = ['TeamBudget', 'Design System', 'BetterWorkplace', 'DailyFruits', 'Inne'];
  pages.sort((a, b) => {
    const ga = ORDER.indexOf(a.group), gb = ORDER.indexOf(b.group);
    if (ga !== gb) return ga - gb;
    return a.path.localeCompare(b.path);
  });
  return pages;
}

// âââ HANDLER âââ

export default async function handler(req, res) {
  if (!verifyAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const action = req.query.action || req.query.a;

  try {
    // âââ Lista stron âââ
    if (action === 'pages' && req.method === 'GET') {
      const pages = await listPages();
      return res.json({ pages });
    }

    // âââ Odczyt tekstow âââ
    if (action === 'texts' && req.method === 'GET') {
      const page = req.query.page;
      if (!page || !page.endsWith('.html')) return res.status(400).json({ error: 'Brak parametru page' });

      const file = await readFile(page);
      if (!file) return res.status(404).json({ error: 'Strona nie istnieje w repozytorium' });

      const items = extractTexts(file.content);
      const result = { sha: file.sha, items };
      if (req.query.raw === '1') result.html = file.content;
      return res.json(result);
    }

    // âââ Zapis tekstow âââ
    if (action === 'texts' && req.method === 'PUT') {
      const page = req.query.page;
      if (!page) return res.status(400).json({ error: 'Brak parametru page' });

      const { sha, edits } = req.body || {};
      if (!sha || !Array.isArray(edits) || !edits.length) return res.status(400).json({ error: 'Brak sha lub edits' });

      const file = await readFile(page);
      if (!file) return res.status(404).json({ error: 'Strona nie istnieje' });
      if (file.sha !== sha) return res.status(409).json({ error: 'Strona zostala zmieniona â odswiez i sprobuj ponownie' });

      const updated = applyEdits(file.content, edits);
      const commit = await commitFiles(
        [{ path: page, content: updated }],
        `CMS: edycja ${page} (${edits.length} zmian)`
      );

      return res.json({ ok: true, commit });
    }

    // âââ Upload obrazka âââ
    if (action === 'upload' && req.method === 'POST') {
      const { filename, contentBase64 } = req.body || {};
      if (!filename || !contentBase64) return res.status(400).json({ error: 'Brak filename lub contentBase64' });
      if (!UPLOAD.allowedExt.test(filename)) return res.status(400).json({ error: 'Niedozwolone rozszerzenie pliku' });
      if (contentBase64.length > UPLOAD.maxBase64Bytes) return res.status(400).json({ error: 'Plik za duzy' });

      const safeName = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
      const path = safeName;

      const commit = await commitFiles(
        [{ path, content: Buffer.from(contentBase64, 'base64').toString('binary') }],
        `CMS: upload ${safeName}`
      );

      return res.json({ ok: true, path, commit });
    }

    // âââ Status deployu âââ
    if (action === 'deploy-status' && req.method === 'GET') {
      const commit = req.query.commit;
      if (!commit) return res.json({ state: 'unknown' });

      // Sprawdz przez Vercel API â jesli nie ma tokena, zwroc unknown
      // Alternatywnie: polling strony po sha commita
      return res.json({ state: 'unknown', note: 'Sprawdz recznie na Vercel dashboard' });
    }

    return res.status(400).json({ error: 'Nieznana akcja: ' + action });

  } catch (e) {
    console.error('CMS error:', e);
    return res.status(500).json({ error: e.message || 'Blad serwera' });
  }
}
