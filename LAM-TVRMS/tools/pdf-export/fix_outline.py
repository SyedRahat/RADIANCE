# Restore spaces that Chromium drops in PDF bookmark titles when a heading wraps onto 2 lines.
import sys, re, glob, html, os
from urllib.parse import unquote, parse_qs
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject, DictionaryObject, ArrayObject, NumberObject, BooleanObject
MARK = 'https://relative.link.invalid/'
htmldir, pdfroot = sys.argv[1], sys.argv[2]
heads = {}
for f in glob.glob(os.path.join(htmldir, '*.html')):
    for m in re.finditer(r'<h[1-6][^>]*>(.*?)</h[1-6]>', open(f, encoding='utf8').read(), re.S):
        t = html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()
        heads[re.sub(r'\s+', '', t)] = re.sub(r'\s+', ' ', t)
bad = 0
for pdf in sorted(glob.glob(os.path.join(pdfroot, '**', '*.pdf'), recursive=True)):
    w = PdfWriter(clone_from=pdf)
    fixed = 0
    def walk(node):
        global bad
        nonlocal_fixed = 0
        while node is not None:
            node = node.get_object()
            t = str(node.get('/Title', ''))
            k = re.sub(r'\s+', '', t)
            if k in heads and heads[k] != t:
                node[NameObject('/Title')] = TextStringObject(heads[k]); nonlocal_fixed += 1
            elif k not in heads:
                print('  unmatched bookmark in', os.path.basename(pdf), ':', t); bad += 1
            if '/First' in node: nonlocal_fixed += walk(node['/First'])
            node = node.get('/Next')
        return nonlocal_fixed
    # relative links between the PDF files: marker URI -> GoToR (open other PDF, first page)
    links = 0
    for pg in w.pages:
        for a in pg.get('/Annots', []) or []:
            a = a.get_object()
            act = a.get('/A')
            act = act.get_object() if act is not None else None
            uri = str(act.get('/URI', '')) if act is not None else ''
            if uri.startswith(MARK):
                q = parse_qs(uri.split('?', 1)[1]); rel = q['p'][0]; frag = q.get('d', [''])[0]
                dest = ArrayObject([NumberObject(0), NameObject('/Fit')])
                if frag:
                    names = PdfReader(os.path.normpath(os.path.join(os.path.dirname(pdf), rel))).named_destinations
                    if '/' + frag in names: dest = NameObject('/' + frag)
                    else: print('  WARNING no named destination', frag, 'in', rel); bad += 1
                a[NameObject('/A')] = DictionaryObject({NameObject('/S'): NameObject('/GoToR'),
                    NameObject('/F'): TextStringObject(rel),
                    NameObject('/D'): dest,
                    NameObject('/NewWindow'): BooleanObject(False)})
                links += 1
            elif uri.startswith('file:'):
                print('  WARNING absolute file link left in', os.path.basename(pdf), ':', uri); bad += 1
    if links: print(f'{os.path.relpath(pdf, pdfroot)}: {links} relative links fixed')
    ol = w._root_object.get('/Outlines')
    if ol is not None and '/First' in ol.get_object():
        fixed = walk(ol.get_object()['/First'])
    w.write(pdf)
    print(f'{os.path.relpath(pdf, pdfroot)}: {fixed} bookmark titles fixed')
print('unmatched:', bad)
