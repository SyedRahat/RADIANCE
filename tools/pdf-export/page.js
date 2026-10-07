// Runs inside each page before printing: layout helpers + Mermaid rendering.
(async () => {
  try {
    document.querySelectorAll('.mermaid-src').forEach(el => { const d = document.createElement('div'); d.className = 'mermaid'; d.textContent = el.textContent; el.replaceWith(d); });
    // short identifiers in inline code (schema names, group names) must not wrap
    document.querySelectorAll('code').forEach(c => { if (!c.closest('pre') && !/\s/.test(c.textContent) && c.textContent.length <= 32) c.classList.add('nw'); });
    // IDs like TV-2026-00015, TC-01, US-01, CC-4100 and ISO dates must not break at the hyphen
    const ID = /\b(?:[A-Z]{2,5}(?:-[A-Z]{2,5})?-\d{2,5}(?:-\d{1,6})*|\d{4}-\d{2}-\d{2}|\d{1,2}-[A-Z][a-z]{2}-\d{4})\b/g;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n =>
      n.parentElement.closest('pre, code, script, style, .mermaid, .mermaid-src') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const texts = []; while (walker.nextNode()) { ID.lastIndex = 0; if (ID.test(walker.currentNode.nodeValue)) texts.push(walker.currentNode); }
    for (const t of texts) {
      const frag = document.createDocumentFragment(); let last = 0; const v = t.nodeValue; ID.lastIndex = 0; let m;
      while ((m = ID.exec(v))) { frag.append(v.slice(last, m.index)); const sp = document.createElement('span'); sp.className = 'nw'; sp.textContent = m[0]; frag.append(sp); last = m.index + m[0].length; }
      frag.append(v.slice(last)); t.replaceWith(frag);
    }
    // paths / URLs in inline code: allow line breaks only after '/'
    document.querySelectorAll('code:not(.nw)').forEach(c => {
      if (c.closest('pre') || !c.textContent.includes('/')) return;
      const parts = c.textContent.split(/(?<=\/)/); c.textContent = ''; c.classList.add('path');
      parts.forEach((t, i) => {
        if (i) c.append(document.createElement('wbr'));
        if (t.length <= 40) { const sp = document.createElement('span'); sp.className = 'nw'; sp.textContent = t; c.append(sp); } else c.append(t);
      });
    });
    // short tables stay whole; longer ones keep at least 2 rows on each side of a page break
    document.querySelectorAll('table').forEach(t => { if (t.querySelectorAll('tr').length <= 7) t.classList.add('keep'); });
    // short lists (<= 4 items) stay whole
    document.querySelectorAll('ul, ol').forEach(l => { if (l.children.length <= 4) l.classList.add('keep'); });
    // code blocks: one block per source line with a hanging indent, so wrapped parts are indented
    document.querySelectorAll('pre > code').forEach(code => {
      const lines = code.textContent.replace(/\n$/, '').split('\n'); code.textContent = '';
      for (const line of lines) { const n = line.match(/^ */)[0].length + 3; const sp = document.createElement('span'); sp.className = 'ln';
        sp.style.paddingLeft = n + 'ch'; sp.style.textIndent = -n + 'ch'; sp.textContent = line === '' ? ' ' : line; code.append(sp); }
      // a long block that must break keeps at least 3 lines on each side of the break
      const spans = [...code.children];
      spans.forEach((sp, i) => { if (i < 2) sp.style.breakAfter = 'avoid'; if (i > spans.length - 4) sp.style.breakBefore = 'avoid'; });
    });
    mermaid.initialize({ startOnLoad: false, theme: 'neutral', fontFamily: 'Inter, sans-serif', securityLevel: 'loose',
      er: { useMaxWidth: false, minEntityHeight: 28, minEntityWidth: 90, entityPadding: 8, nodeSpacing: 10, rankSpacing: 70, fontSize: 14 },
      flowchart: { useMaxWidth: false, nodeSpacing: 28, rankSpacing: 34 } });
    if (document.querySelector('.mermaid')) await mermaid.run({ querySelector: '.mermaid' });
    // never enlarge a diagram; shrink it to fit the text width and ~209 mm of height
    document.querySelectorAll('.mermaid svg').forEach(svg => {
      const vb = svg.viewBox.baseVal, maxW = svg.closest('.mermaid').clientWidth, maxH = 790;
      const k = Math.min(0.85, maxW / vb.width, maxH / vb.height);
      svg.removeAttribute('width'); svg.style.maxWidth = 'none'; svg.style.width = (vb.width * k) + 'px'; svg.style.height = (vb.height * k) + 'px';
    });
    await document.fonts.ready;
    window.__done = 'ok';
  } catch (e) { window.__done = 'error: ' + e.message; }
})();
