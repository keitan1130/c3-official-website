# 公開コンテンツの回収結果

取得日: 2026-11-14（JST）。原本: `migration/snapshots/2026-11-14/`。

## 取得元と方法

公開サイト <https://compositecomputer.club/> の初期 HTML は `Loading...` を表示する SPA だった。
HTML のスクレイピングだけでは Markdown の原文を取得できないため、公開 HTML が参照する同一オリジンの JavaScript から配信設定を特定し、Contentful Delivery API を読み取った。
対象は公開 space `9y06rk98t3s7` / environment `master`。Preview / Management API、認証後の情報は取得していない。
Delivery token はログ・資料・原本に保存していない。

- 全コンテンツ型の ID を確認し、`blog` を除く7型を取得。
- 各型を `skip` / `limit` でページングし、`total` と取得件数を比較。
- `locale=*` で公開中の各ロケールを保持し、`include=0` でブログ本文の暗黙取得を避けた。
- 原文をフィールド・ロケール別の Markdown に抽出。メタデータと RichText は JSON 原本に保持。
- Asset 参照と本文内 URL を調べ、Contentful と確認済みの外部メディア配信元から画像・動画を取得。
- URL → ローカルファイル、サイズ、Content-Type、SHA-256 を `manifest.json` に記録。

## 件数

| 公開コンテンツ型 | API total | 取得 | 内容 |
| --- | ---: | ---: | --- |
| `c3Introduction` | 1 | 1 | 紹介本文・概要・代表者情報等 |
| `eachCommunity` | 5 | 5 | GAME / 3DCG / HACK / 2DCG / MUSIC |
| `news` | 16 | 16 | お知らせ本文・サムネイル・タグ・著者参照 |
| `user` | 36 | 36 | 公開プロフィール |
| `aboutCommunity` | 1 | 1 | コミュニティ概要。現行表示での利用は未確認 |
| `executiveMember` | 1 | 1 | 役員情報。現行表示での利用は未確認 |
| `tag` | 46 | 46 | タグ名・色。ブログ専用タグが含まれる可能性あり |
| 合計 | 106 | 106 | ブログ本文を除く |

Markdown は **30ファイル**。これはページ数ではなく、紹介本文・概要・各分野本文・お知らせ・プロフィール内の対象テキストフィールド数。
Contentful のリンク先 Asset は64 ID。本文中の直接 URL、画像変換パラメータ違い、外部ホストの画像も含めて **134ファイル / 151,939,971 bytes（約145 MiB）**を保存した。
同じ画像の別 URL・別サイズを含むため、ファイル数は固有作品数や Asset ID 数とは一致しない。

| 保存した種類 | ファイル数 |
| --- | ---: |
| PNG | 81 |
| JPEG | 30 |
| WebP | 11 |
| GIF | 2 |
| MP4 | 5 |
| WebM | 5 |

134ファイルすべてについて、保存したファイルの SHA-256 と manifest の値の一致を確認済み。
旧 frontend 内のロゴ・loading 画像・SNS アイコン・favicon は `../web/assets/image/` と `../web/static/` に既にあり、UI 移植時にそこからコピーする。

## sitemap との照合

同時に公開 `sitemap.xml` / `robots.txt` を保存した。sitemap の ID を API 取得結果と照合した。

- 分野: sitemap の5 IDすべてを回収。
- 著者: sitemap の36 IDすべてを回収。
- お知らせ: sitemap の15詳細 IDすべてを回収。`/news` 一覧を含めると sitemap 上は16 URL。
- さらに API には sitemap 未掲載の `6JIkTuRU0BP2psDRlD9ZvE`（`【2026年度】工大祭情報・見どころまとめ！`）があり、これも回収した。
- ブログは sitemap に53詳細 URLがあるが、本文回収対象から除外した。

sitemap だけに依存すると最新のお知らせを落とす可能性がある。API と sitemap の件数は同一ではない。

## 欠損1件

お知らせ `2wZGZDaJVzQX5cMNAcz88I`（`C3 Advent Calendar 2022開催中！`）の本文が参照する次の画像は HTTP 404。

```text
https://media.discordapp.net/attachments/703125436053454932/1047814243497562112/image_1.webp?width=1667&height=1169
```

元 CDN `cdn.discordapp.com` の同じパスも404だった。
対象原文は `markdown/news/2wZGZDaJVzQX5cMNAcz88I/body.ja-JP.md`。
本文は取得済みで、画像の URL も原文に残している。2026-11-14 の回答により、運用本文への変換時にこの画像参照を削除する。回収原本と当時の欠損記録は変更しない。
スクリプトはこの欠損を `manifest.json.errors` に記録し、終了コード1を返した。全メディア回収完了とは扱わない。

## 再取得と補完

```bash
# 新しい原本を取得
python3 scripts/export-public-content.py --output migration/snapshots/YYYY-MM-DD

# 既存 manifest の失敗メディアを再試行
python3 scripts/export-public-content.py --output migration/snapshots/2026-11-14 --complete-media
```

公開ページのバンドル形式・space・コンテンツ型が変わると取得スクリプトの更新が必要。
初回取得は既存ディレクトリを上書きしない。補完は本文を再取得せず、失敗したメディアと許可した外部メディアだけを取得する。
外部リンク先のページ全体は辿らない。通常の外部 URL は `externalReferences` に残している。

## 完全性の範囲と残作業

確認済みなのは、取得時点に Delivery API が返した7型の全公開エントリ、そこから検出できたメディア、および sitemap 掲載 ID との対応。
未公開・削除済み・別 environment / 別 space の内容、ブログ、Toybox の作品本文の全量、外部リンク先の文書は含まない。

残作業:

- 決定済みの方針に従い、運用本文から404画像1件の参照を削除する。
- 著者・タグ等の参照と画像 URL を運用用データへ変換し、リンクの破損を検査する。
- サイトの表示中にのみ見つかる追加メディアがないかブラウザで照合する。
- カルーセル・動画の実再生と Markdown の表示、PC / モバイル UI を比較する。
- 本番ブログ API の稼働構成・CORS を確認する。ブログは取得継続、作品欄は静的ファイル管理に確定済み。

この回収調査の時点では実装前だった。現在の運用用content・UI・検証の進捗は [段階別結果](implementation-results.md) を参照。デプロイは未実施。
