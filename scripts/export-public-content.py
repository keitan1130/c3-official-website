#!/usr/bin/env python3
"""Export published non-blog Contentful entries discovered from the current SPA.

Standard library only. Delivery token stays in memory; bundles are never archived.
Existing exports are not overwritten. Run only against the official public site.
"""
import argparse
import hashlib
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SITE = 'https://compositecomputer.club'
API = 'https://cdn.contentful.com'
TYPES = ('c3Introduction', 'eachCommunity', 'news', 'user', 'aboutCommunity', 'executiveMember', 'tag')
EXTERNAL_MEDIA_HOSTS = {'i.imgur.com', 'media.discordapp.net', 's3.ap-northeast-2.wasabisys.com', 'www.iizuka.kyutech.ac.jp'}


def is_media_url(url):
    parts = urllib.parse.urlsplit(url)
    host = parts.hostname or ''
    return parts.scheme == 'https' and (
        host.endswith('.ctfassets.net') or host.endswith('.contentful.com') or
        (host in EXTERNAL_MEDIA_HOSTS and re.search(r'\.(png|jpe?g|webp|gif|svg|mp4|webm)$', parts.path, re.I)))


def fetch(url, token=None):
    headers = {'User-Agent': 'C3-public-content-export/1.0'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    parts = urllib.parse.urlsplit(url)
    url = urllib.parse.urlunsplit((parts.scheme, parts.netloc,
                                  urllib.parse.quote(parts.path, safe='/%:@'),
                                  urllib.parse.quote(parts.query, safe='=&%:@/?+'), parts.fragment))
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as response:
        return response.read(), response.headers.get_content_type()


def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--complete-media', action='store_true', help='Retry failed media and download reviewed external media from an existing manifest.')
    args = parser.parse_args()
    if args.complete_media:
        complete_media(args.output)
        return
    if args.output.exists():
        parser.error('Output already exists; choose a new snapshot directory.')
    html, _ = fetch(SITE + '/')
    # Read only same-origin scripts explicitly referenced by the public HTML.
    config = {}
    for src in re.findall(r'<script[^>]+src=["\']([^"\']+)', html.decode()):
        url = urllib.parse.urljoin(SITE, src)
        if urllib.parse.urlsplit(url).netloc != urllib.parse.urlsplit(SITE).netloc:
            continue
        bundle, _ = fetch(url)
        text = bundle.decode()
        for key in ('CTF_SPACE_ID', 'CTF_CDA_ACCESS_TOKEN', 'TOYBOX_API_BASE_URL'):
            match = re.search(key + r':"([^"]+)"', text)
            if match:
                config[key] = match.group(1)
    if not all(config.get(key) for key in ('CTF_SPACE_ID', 'CTF_CDA_ACCESS_TOKEN')):
        raise RuntimeError('Public SPA config not found. Inspect the current deployment; do not guess credentials.')
    base = API + '/spaces/' + config['CTF_SPACE_ID'] + '/environments/master/'

    def get(path, params):
        raw, _ = fetch(base + path + '?' + urllib.parse.urlencode(params), config['CTF_CDA_ACCESS_TOKEN'])
        return json.loads(raw)

    def pages(path, params):
        items = []
        skip = 0
        while True:
            result = get(path, {**params, 'limit': 100, 'skip': skip})
            batch = result['items']
            items.extend(batch)
            skip += len(batch)
            if skip >= result['total']:
                return items, result['total']
            if not batch:
                raise RuntimeError('Pagination stopped before total.')

    models, _ = pages('content_types', {})
    unknown = {model['sys']['id'] for model in models} - set(TYPES) - {'blog'}
    if unknown:
        raise RuntimeError('Unreviewed content types: ' + ', '.join(sorted(unknown)))
    root = args.output
    root.mkdir(parents=True)
    (root / 'site.html').write_bytes(html)
    save_json(root / 'content-types.json', [x for x in models if x['sys']['id'] != 'blog'])
    manifest = {'retrievedAt': datetime.now(timezone.utc).isoformat(), 'site': SITE,
                'space': config['CTF_SPACE_ID'], 'environment': 'master',
                'excludedContentTypes': ['blog'], 'counts': {}, 'documents': [], 'assets': [],
                'externalReferences': [], 'errors': []}
    for filename in ('sitemap.xml', 'robots.txt'):
        data, _ = fetch(SITE + '/' + filename)
        (root / filename).write_bytes(data)
    asset_ids = set()
    references = set()

    def walk(value):
        if isinstance(value, dict):
            if value.get('sys', {}).get('linkType') == 'Asset':
                asset_ids.add(value['sys']['id'])
            for nested in value.values():
                walk(nested)
        elif isinstance(value, list):
            for nested in value:
                walk(nested)
        elif isinstance(value, str):
            references.update(re.findall(r'(?:https?:)?//[^\s<>"\)\]]+', value))

    for kind in TYPES:
        items, total = pages('entries', {'content_type': kind, 'include': 0, 'locale': '*'})
        manifest['counts'][kind] = {'expected': total, 'retrieved': len(items)}
        for entry in items:
            entry_id = entry['sys']['id']
            save_json(root / 'entries' / kind / (entry_id + '.json'), entry)
            walk(entry['fields'])
            # Keep original text bytes (UTF-8), including every locale. Metadata stays in JSON.
            for field, locales in entry['fields'].items():
                if field not in ('body', 'about', 'introduction', 'summaryOfIntroduction'):
                    continue
                for locale, value in locales.items():
                    if not isinstance(value, str):
                        continue
                    path = Path('markdown') / kind / entry_id / (field + '.' + locale + '.md')
                    (root / path).parent.mkdir(parents=True, exist_ok=True)
                    (root / path).write_text(value, encoding='utf-8')
                    manifest['documents'].append({'entryId': entry_id, 'field': field, 'locale': locale, 'path': str(path)})

    def download(url, source_id):
        url = urllib.parse.urljoin(SITE, url)
        parts = urllib.parse.urlsplit(url)
        # Download only reviewed media hosts; ordinary external links stay links.
        if not is_media_url(url):
            manifest['externalReferences'].append(url)
            return
        digest = hashlib.sha256(url.encode()).hexdigest()[:16]
        filename = re.sub(r'[^a-zA-Z0-9._-]', '_', urllib.parse.unquote(parts.path.split('/')[-1])) or 'asset'
        path = Path('assets') / (digest + '-' + filename)
        if any(x['url'] == url for x in manifest['assets']):
            return
        try:
            data, content_type = fetch(url)
            (root / path).parent.mkdir(parents=True, exist_ok=True)
            (root / path).write_bytes(data)
            manifest['assets'].append({'sourceId': source_id, 'url': url, 'path': str(path),
                                       'bytes': len(data), 'contentType': content_type, 'sha256': hashlib.sha256(data).hexdigest()})
        except Exception as error:
            manifest['errors'].append({'url': url, 'errorType': type(error).__name__})

    for asset_id in sorted(asset_ids):
        try:
            asset = get('assets/' + asset_id, {'locale': '*'})
            save_json(root / 'asset-metadata' / (asset_id + '.json'), asset)
            for file in asset.get('fields', {}).get('file', {}).values():
                download(file['url'], asset_id)
        except Exception as error:
            manifest['errors'].append({'assetId': asset_id, 'errorType': type(error).__name__})
    for url in sorted(references):
        download(url, 'inline-reference')
    manifest['externalReferences'] = sorted(set(manifest['externalReferences']))
    manifest['linkedAssetCount'] = len(asset_ids)
    save_json(root / 'manifest.json', manifest)
    print(json.dumps({'counts': manifest['counts'], 'markdownFiles': len(manifest['documents']),
                      'downloadedAssets': len(manifest['assets']), 'errors': manifest['errors']}, ensure_ascii=False, indent=2))
    if manifest['errors']:
        raise SystemExit(1)


def complete_media(root):
    manifest = json.loads((root / 'manifest.json').read_text())
    pending = {item['url'] for item in manifest['errors'] if 'url' in item}
    pending.update(url for url in manifest['externalReferences'] if is_media_url(url))
    errors = [item for item in manifest['errors'] if 'url' not in item]
    for url in sorted(pending):
        if not is_media_url(url):
            errors.append({'url': url, 'errorType': 'UnreviewedMediaHost'})
            continue
        parts = urllib.parse.urlsplit(url)
        digest = hashlib.sha256(url.encode()).hexdigest()[:16]
        filename = re.sub(r'[^a-zA-Z0-9._-]', '_', urllib.parse.unquote(parts.path.split('/')[-1])) or 'asset'
        path = Path('assets') / (digest + '-' + filename)
        try:
            data, content_type = fetch(url)
            if not (content_type.startswith(('image/', 'video/', 'audio/')) or content_type == 'application/octet-stream'):
                raise ValueError('Unexpected media content type')
            (root / path).parent.mkdir(parents=True, exist_ok=True)
            (root / path).write_bytes(data)
            manifest['assets'].append({'sourceId': 'recovered-reference', 'url': url, 'path': str(path),
                                       'bytes': len(data), 'contentType': content_type, 'sha256': hashlib.sha256(data).hexdigest()})
        except Exception as error:
            errors.append({'url': url, 'errorType': type(error).__name__,
                           'status': getattr(error, 'code', None)})
    manifest['errors'] = errors
    successful = {item['url'] for item in manifest['assets']}
    manifest['externalReferences'] = [url for url in manifest['externalReferences'] if url not in successful]
    manifest['mediaCompletedAt'] = datetime.now(timezone.utc).isoformat()
    save_json(root / 'manifest.json', manifest)
    print(json.dumps({'downloadedAssets': len(manifest['assets']), 'errors': errors}, ensure_ascii=False, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
