#!/usr/bin/env python3
"""Convert an immutable public export into editable page/article folders (no overwrites)."""
import argparse
import hashlib
import json
import re
import shutil
import urllib.parse
from pathlib import Path

COMMUNITIES = {'21AY3pJOP214Gsw1d9u6cD': 'game', '5Ay58j7CHdYFqKShRbr5tD': '3dcg', '39t5DaMrgq579LDvqWGKZK': 'hack', '1q0aXzj2r1O0pC5soNRQok': '2dcg', 'mlIRfpRrISVzKc6K0l181': 'music'}
NEWS_SLUGS = dict(zip(['1KB6nHLVmYxB84FdikDFRq','1Py5juSW3x9IBzzZ5Tqd0h','1X1oOFZEenbnqdMYD076jM','1y1xT8pvbWb9GoNn7KwDh8','2XrJpQFS3ekB4trPBz6r7p','2ksEJYBJDR4tR1KJTJMURR','2wZGZDaJVzQX5cMNAcz88I','5V8E5cNosZJTSGFzE9cVlF','5aklq4XrU4dPcN0ab1sWuf','6B3wNHoFRCgMKtHFLpvySd','6Gu9e169ef7W0X2FKwt9VK','6JIkTuRU0BP2psDRlD9ZvE','7G9KnelAL78YySPIvw14F9','7okRpmB8JDyPQMhbobmxwb','Ft2AhAaU8ZLT9dySKoUS8','sz0VzeWi6THmMHPpERxZW'], ['optim-hands-on','festival-day-two','welcome-events','open-campus','welcome-new-students','c3-workshop-day-two','advent-calendar','welcome-guide','festival-exhibition','website-renewal','c3-workshop','festival-guide','c3-workshop','c3-workshop-day-one','festival-announcement','open-campus']))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('content'))
    args = parser.parse_args()
    snapshot, output = args.snapshot, args.output
    if output.exists():
        parser.error('Output exists. Convert to a new directory and review before replacing.')
    manifest = json.loads((snapshot / 'manifest.json').read_text())
    records = []

    def normalized(url):
        url = 'https:' + url if url.startswith('//') else url
        return urllib.parse.unquote(url.split('?')[0])

    assets = {normalized(a['url']): a for a in manifest['assets']}
    assets_by_id = {a['sourceId']: a for a in manifest['assets'] if a['sourceId'] not in ('inline-reference', 'recovered-reference')}
    # Recover asset-ID lookup even if an encoded filename was completed in a later run.
    for asset in manifest['assets']:
        parts = urllib.parse.urlsplit(asset['url']).path.split('/')
        if 'ctfassets.net' in asset['url'] and len(parts) > 2:
            assets_by_id.setdefault(parts[2], asset)

    def entries(kind):
        return [json.loads(p.read_text()) for p in sorted((snapshot / 'entries' / kind).glob('*.json'))]

    def fields(entry):
        return {key: value.get('ja-JP', next(iter(value.values()), None)) for key, value in entry['fields'].items()}

    def write(directory, data, body=None):
        directory.mkdir(parents=True, exist_ok=True)
        if body is not None:
            data['body'] = './body.md'
            (directory / 'body.md').write_text(body)
        (directory / 'index.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

    def media(directory, value, label):
        asset = assets_by_id.get(value.get('sys', {}).get('id')) if isinstance(value, dict) else assets.get(normalized(value))
        if not asset:
            raise ValueError(f'Missing recovered media: {value}')
        ext = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'video/webm': '.webm', 'video/mp4': '.mp4'}.get(asset['contentType'], Path(asset['path']).suffix)
        target = directory / 'assets' / (label + ext)
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copyfile(snapshot / asset['path'], target)
        records.append({'sourceUrl': asset['url'], 'target': str(target), 'sha256': asset['sha256']})
        return './assets/' + target.name

    def body(directory, text):
        # Explicitly remove the missing Discord image only from editable content.
        text = re.sub(r'!\[[^\]]*\]\(https://media\.discordapp\.net/attachments/703125436053454932/1047814243497562112/[^\s)]+\)', '', text)
        for legacy, slug in COMMUNITIES.items():
            text = text.replace('https://compositecomputer.club/community/' + legacy, '/community/' + slug).replace('/community/' + legacy, '/community/' + slug)
        counter = 0
        def replace(match):
            nonlocal counter
            url = match.group()
            if normalized(url) not in assets:
                return url
            counter += 1
            return media(directory, url, f'photo-{counter:02}')
        return re.sub(r'(?:https?:)?//[^\s<>"\)\]]+', replace, text)

    about = entries('c3Introduction')[0]
    f = fields(about); directory = output / 'about'
    write(directory, {'id': about['sys']['id'], 'title': 'C3について', 'summary': f.get('summaryOfIntroduction', '')}, body(directory, f['introduction']))
    for entry in entries('eachCommunity'):
        f = fields(entry); slug = COMMUNITIES[entry['sys']['id']]; directory = output / 'communities' / slug
        write(directory, {'id': entry['sys']['id'], 'slug': slug, 'name': f['name'], 'domain': f.get('domain', ''), 'webm': media(directory, f['image'], 'hero'), 'mp4': media(directory, f['smallimg'], 'hero')}, body(directory, f['about']))
    for entry in entries('news'):
        f = fields(entry); entry_id = entry['sys']['id']; directory = output / 'news' / (entry['sys']['createdAt'][:10] + '-' + NEWS_SLUGS[entry_id])
        write(directory, {'id': entry_id, 'title': f['title'].strip(), 'digest': f.get('digest',''), 'createdAt': entry['sys']['createdAt'], 'updatedAt': entry['sys']['updatedAt'], 'isPublished': True, 'isImportant': f.get('important',False), 'thumbnail': media(directory, f['thumbnail'], 'cover'), 'authorIds': [x['sys']['id'] for x in f.get('user',[])], 'tagIds': [x['sys']['id'] for x in f.get('tags',[])]}, body(directory,f.get('body','')))
    tags=[{'id':e['sys']['id'], **fields(e)} for e in entries('tag')]
    (output/'tags.json').write_text(json.dumps(tags,ensure_ascii=False,indent=2)+'\n')
    write(output/'site', {'title': 'Composite Computer Club [ C3 ]', 'description': '九州工業大学情報工学部のComposite Computer Club公式サイト', 'canonicalOrigin': 'https://compositecomputer.club', 'worksUrl': 'https://toybox.compositecomputer.club/', 'communities': ['2dcg','3dcg','game','hack','music'], 'links': [{'title':'ToyBox','url':'https://toybox.compositecomputer.club/'},{'title':'Twitter','url':'https://twitter.com/c3_kyutech'},{'title':'GitHub','url':'https://github.com/Kyutech-C3'},{'title':'YouTube','url':'https://www.youtube.com/channel/UCeRY2jujVBYRqmilrCZytFw'}]})
    write(output/'home', {'title':'Composite Computer Club', 'aboutTitle':'C3について'})
    for name in ['s_logo.webp','loading.webp']:
        target=output/'site'/'assets'/name;target.parent.mkdir(exist_ok=True);shutil.copyfile(Path('../web/assets/image')/name,target)
    write(output/'featured-works',{'items':[]})
    Path('migration/content-conversion.json').write_text(json.dumps({'snapshot':str(snapshot),'assets':records,'removedDiscordImageReferences':1},ensure_ascii=False,indent=2)+'\n')
    print('Converted about, 5 communities, 16 news and 46 tags (authors remain live in Contentful); asset references:',len(records))


if __name__ == '__main__':
    main()
