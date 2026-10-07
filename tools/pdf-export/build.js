// Convert all .md and .csv files of the repo into styled PDFs (+ one combined guide PDF).
// Usage: node build.js <repoDir> <outDir> <mermaidJsPath>   (normally run through make-pdfs.sh)
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [REPO, OUT, MERMAID] = process.argv.slice(2).map(p => path.resolve(p));
const TMP = path.join(__dirname, '.build-html');
fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
fs.copyFileSync(MERMAID, path.join(TMP, 'mermaid.min.js'));
fs.copyFileSync(path.join(__dirname, 'page.js'), path.join(TMP, 'page.js'));

// ---------- file lists (reading / import order) ----------
const MD = ['README.md', ...fs.readdirSync(path.join(REPO, 'docs')).filter(f => f.endsWith('.md')).sort().map(f => 'docs/' + f), 'sample-data/README.md'];
const CSV_INFO = [
  ['departments.csv', 'Department', 'tvr_department'],
  ['locations.csv', 'Location', 'tvr_location'],
  ['research_institutions.csv', 'Research Institution / Vendor', 'tvr_researchinstitution'],
  ['cost_centers.csv', 'Cost Center', 'tvr_costcenter'],
  ['app_settings.csv', 'App Setting', 'tvr_appsetting'],
  ['email_templates.csv', 'Email Template', 'tvr_emailtemplate'],
  ['tv_requests.csv', 'TV Request', 'tvr_tvrequest'],
  ['feasibility_options.csv', 'Feasibility Option', 'tvr_feasibilityoption'],
  ['milestones.csv', 'Milestone', 'tvr_milestone'],
  ['cost_entries.csv', 'Cost Entry', 'tvr_costentry'],
];
const CSV = CSV_INFO.map(c => 'sample-data/' + c[0]);
for (const f of fs.readdirSync(path.join(REPO, 'sample-data')).filter(f => f.endsWith('.csv')))
  if (!CSV.includes('sample-data/' + f)) throw new Error('CSV not in list: ' + f);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slug = rel => rel.replace(/\.(md|csv)$/, '').replace(/[^A-Za-z0-9]+/g, '-').toLowerCase();

// ---------- Markdown -> HTML (pandoc, GitHub flavour) ----------
function pandoc(rel, idPrefix) {
  const args = ['-f', 'gfm', '-t', 'html', '--no-highlight', '--wrap=none'];
  if (idPrefix) args.push('--id-prefix=' + idPrefix);
  return execFileSync('pandoc', [...args, path.join(REPO, rel)], { encoding: 'utf8' });
}
function firstH1(rel) {
  const m = fs.readFileSync(path.join(REPO, rel), 'utf8').match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : rel;
}
// Resolve a relative link found in file `fromRel` to a repo path (or null if external)
function resolveLink(fromRel, href) {
  if (/^[a-z]+:/i.test(href) || href.startsWith('#')) return null;
  const [p, frag] = href.split('#');
  let target = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), p));
  if (target.replace(/\/$/, '') === 'sample-data') target = 'sample-data/README.md';
  return { target, frag: frag || '' };
}
// Individual PDFs: .md links -> .pdf links (relative), cross-file fragments dropped
// Chromium turns relative hrefs into absolute file:// URLs, so mark them here and
// convert them to relative GoToR links in post-processing (fix_outline.py).
const REL_MARK = 'https://relative.link.invalid/';
function rewriteLinksIndividual(html, fromRel) {
  return html.replace(/<a href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (all, href, attrs, text) => {
    const r = resolveLink(fromRel, href);
    if (!r) return all;
    const rel = path.posix.relative(path.posix.dirname(fromRel), r.target.replace(/\.(md|csv)$/, '.pdf'));
    const d = r.frag ? `&d=${encodeURIComponent(r.frag)}` : '';
    return `<a href="${REL_MARK}?p=${encodeURIComponent(rel)}${d}"${attrs}>${text.replace(/\.md(?=(<\/code>)?$)/, '.pdf')}</a>`;
  });
}
// Combined PDF: every cross-file link becomes an internal anchor
function rewriteLinksCombined(html, fromRel) {
  return html.replace(/<a href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g, (all, href, attrs, text) => {
    const r = resolveLink(fromRel, href);
    if (!r) return all;
    const pre = slug(r.target) + '--';
    return `<a href="#${r.frag ? pre + r.frag : 'sec-' + slug(r.target)}"${attrs}>${text.replace(/\.md(?=(<\/code>)?$)/, '')}</a>`;
  });
}
// Fragments other documents link to, per target doc. Chromium only writes a named destination for
// an id that is the target of a link in the same PDF, so each target doc gets hidden links to them.
const CROSS = {};
function collectCrossFragments() {
  for (const rel of MD) for (const m of pandoc(rel).matchAll(/href="([^"]+)"/g)) {
    const r = resolveLink(rel, m[1]);
    if (r && r.frag && r.target !== rel) (CROSS[r.target] = CROSS[r.target] || new Set()).add(r.frag);
  }
}
const destLinks = rel => CROSS[rel] ? `<nav class="dest-links">${[...CROSS[rel]].map(f => `<a href="#${f}">.</a>`).join('')}</nav>` : '';
const mermaidFix = html => html.replace(/<pre class="mermaid"><code>([\s\S]*?)<\/code><\/pre>/g, '<div class="mermaid-src">$1</div>');
// Keep short code blocks (<= 18 lines) on one page; long ones may still break
const shortPre = html => html.replace(/<pre(?: class="([^"]*)")?>(<code>[\s\S]*?<\/code>)<\/pre>/g, (all, cls, inner) => inner.split('\n').length <= 18 ? `<pre class="short ${cls || ''}">${inner}</pre>` : all);

// ---------- CSV -> HTML ----------
function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x !== ''));
}
function csvHtml(rel, idPrefix = '') {
  const file = path.basename(rel);
  const [, table, schema] = CSV_INFO.find(c => c[0] === file);
  const order = CSV_INFO.findIndex(c => c[0] === file) + 1;
  const [head, ...rows] = parseCSV(fs.readFileSync(path.join(REPO, rel), 'utf8'));
  for (const r of rows) if (r.length !== head.length) throw new Error(`${rel}: row has ${r.length} cells, header ${head.length}`);
  let h = `<h1 id="${idPrefix}top">Sample data – ${esc(file)}</h1>
<p class="meta"><b>Loads into table:</b> ${esc(table)} (<code>${schema}</code>) &nbsp;·&nbsp; <b>Import order:</b> ${order} of ${CSV_INFO.length} &nbsp;·&nbsp; <b>Rows:</b> ${rows.length} &nbsp;·&nbsp; <b>Columns:</b> ${head.length}</p>
<p class="note">Fake test data for DEV / TEST environments only – never load into PROD. People are given by e-mail and must exist in the environment first.</p>`;
  if (head.length > 9) {
    // Too many columns for one table row: show one card per record (field : value)
    h += `<p class="hint">This file has ${head.length} columns, so each row is shown as a card (column name on the left, value on the right).</p>`;
    h += '<div class="cards">' + rows.map((r, i) => `<div class="card"><div class="card-h">Row ${i + 1} – ${esc(r[0])}${r[1] ? ' · ' + esc(r[1]) : ''}</div>
<table class="kv">${head.map((c, j) => `<tr><th>${esc(c)}</th><td>${r[j] === '' ? '<span class="empty">(empty)</span>' : esc(r[j])}</td></tr>`).join('')}</table></div>`).join('\n') + '</div>';
  } else {
    const isTpl = file === 'email_templates.csv';
    h += `<table class="data${isTpl ? ' tpl' : ''}"><thead><tr><th class="n">#</th>${head.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>
${rows.map((r, i) => `<tr><td class="n">${i + 1}</td>${r.map((v, j) => `<td${isTpl && /Body/.test(head[j]) ? ' class="code"' : ''}>${v === '' ? '<span class="empty">–</span>' : esc(v)}</td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
  }
  return h;
}

// ---------- page template ----------
const CSS = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
function page(title, body, { landscape = false } = {}) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>${CSS}${landscape ? '@page{size:A4 landscape}' : ''}</style>
<script src="mermaid.min.js"></script></head><body>${body}
<script src="page.js"></script></script></body></html>`;
}
const HEADER = `<div style="width:100%;font-family:Inter,sans-serif;font-feature-settings:'calt' 0,'tnum' 0;font-size:7.5px;color:#6b6b80;padding:0 14mm;display:flex;justify-content:space-between"><span>LAM – TV Request Management System (TVRMS)</span><span>A to Z Development Guide</span></div>`;
const footer = label => `<div style="width:100%;font-family:Inter,sans-serif;font-feature-settings:'calt' 0,'tnum' 0;font-size:7.5px;color:#6b6b80;padding:0 14mm;display:flex;justify-content:space-between"><span>${esc(label)}</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;

async function render(browser, htmlName, html, pdfPath, label) {
  const file = path.join(TMP, htmlName);
  fs.writeFileSync(file, html);
  const pg = await browser.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('file://' + file);
  await pg.waitForFunction(() => window.__done, null, { timeout: 60000 });
  const status = await pg.evaluate(() => window.__done);
  if (status !== 'ok' || errors.length) throw new Error(`${htmlName}: ${status} ${errors.join('; ')}`);
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
  await pg.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true,
    headerTemplate: HEADER, footerTemplate: footer(label), outline: true, tagged: true });
  await pg.close();
  console.log('PDF', path.relative(OUT, pdfPath));
}

(async () => {
  collectCrossFragments();
  const browser = await chromium.launch();
  // 1) one PDF per Markdown file
  for (const rel of MD) {
    const title = firstH1(rel);
    const body = `<main class="doc">${shortPre(mermaidFix(rewriteLinksIndividual(pandoc(rel), rel)))}${destLinks(rel)}</main>`;
    await render(browser, slug(rel) + '.html', page(title, body), path.join(OUT, rel.replace(/\.md$/, '.pdf')), title);
  }
  // 2) one PDF per CSV file (landscape)
  for (const rel of CSV) {
    await render(browser, slug(rel) + '.html', page(rel, `<main class="doc csv">${csvHtml(rel)}</main>`, { landscape: true }),
      path.join(OUT, rel.replace(/\.csv$/, '.pdf')), 'Sample data – ' + path.basename(rel));
  }
  // 3) combined guide (one print job: continuous page numbers, internal links, bookmarks)
  const toc = [
    ['Part A – The guide', MD.map(rel => [rel, firstH1(rel)])],
    ['Part B – Sample data (CSV files)', CSV.map(rel => [rel, 'Sample data – ' + path.basename(rel)])],
  ];
  let body = `<section class="cover">
  <div class="eyebrow">A to Z Development Guide</div>
  <h1 class="cover-title">LAM – TV Request Management System</h1>
  <p class="cover-sub">How to build the TVRMS on Microsoft Power Platform, step by step, with sample data and use cases.</p>
  <table class="cover-meta">
    <tr><th>Based on</th><td>ABC_REQUEST.pptx – HCLTech Solution Approach, September 2026</td></tr>
    <tr><th>Platform</th><td>Power Apps (Canvas + Model-Driven), Power Automate, Dataverse, SharePoint Online, Outlook, Power BI</td></tr>
    <tr><th>Prepared</th><td>October 2026</td></tr>
    <tr><th>Contents</th><td>${MD.length} guide documents + ${CSV.length} sample data files</td></tr>
  </table>
  <p class="cover-note">Items marked <b>(ASSUMPTION)</b> are not in the PPT and must be confirmed with the business during the "Plan for Success" phase.</p>
</section>
<section class="toc"><h1>Contents</h1>${toc.map(([part, items]) => `<h2>${part}</h2><ol class="toc-list">${items.map(([rel, t]) =>
    `<li><a href="#sec-${slug(rel)}">${esc(t)}</a> <span class="toc-file">${esc(rel)}</span></li>`).join('')}</ol>`).join('')}
<p class="hint">Tip: use the bookmarks panel of your PDF reader to jump to any heading. All links in this PDF are clickable.</p></section>`;
  for (const rel of MD) {
    const pre = slug(rel) + '--';
    body += `<section class="doc part" id="sec-${slug(rel)}">${shortPre(mermaidFix(rewriteLinksCombined(pandoc(rel, pre), rel)))}</section>`;
  }
  for (const rel of CSV) body += `<section class="doc csv part wide" id="sec-${slug(rel)}">${csvHtml(rel, slug(rel) + '--')}</section>`;
  await render(browser, 'combined.html', page('LAM TVRMS – Complete Development Guide', body), path.join(OUT, 'LAM-TVRMS-Complete-Guide.pdf'), 'LAM TVRMS – Complete Development Guide');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
