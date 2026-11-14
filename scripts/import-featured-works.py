#!/usr/bin/env python3
"""One-time import of a public legacy works response into editable featured works."""
import argparse
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('input', type=Path)
args = parser.parse_args()
root = Path('content/featured-works')
items = []
for index, work in enumerate(json.loads(args.input.read_text())['works'], 1):
    name = re.sub('[^a-z0-9]+', '-', work['title'].lower()).strip('-')[:45] or 'work'
    slug = f'{name}-{index:02}'
    directory = root / slug
    if directory.exists():
        raise SystemExit(f'Refusing to overwrite {directory}')
    directory.mkdir(parents=True)
    url = work['thumbnail']['url']
    parts = urllib.parse.urlsplit(url)
    if parts.scheme != 'https' or parts.hostname != 's3.ap-northeast-2.wasabisys.com':
        raise SystemExit('Unexpected media host')
    with urllib.request.urlopen(url, timeout=60) as response:
        content_type = response.headers.get_content_type()
        if not content_type.startswith('image/'):
            raise SystemExit('Unexpected media type')
        data = response.read()
    extension = {'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'}.get(content_type)
    if not extension:
        raise SystemExit('Unknown image type')
    path = directory / 'assets' / ('thumbnail' + extension)
    path.parent.mkdir()
    path.write_bytes(data)
    (directory / 'index.json').write_text(json.dumps({'id':work['id'],'title':work['title'],'thumbnail':'./assets/'+path.name},ensure_ascii=False,indent=2)+'\n')
    items.append(slug)
(root / 'index.json').write_text(json.dumps({'items':items},ensure_ascii=False,indent=2)+'\n')
print('Imported featured works:',len(items))
