# 記事・素材の管理

本文・表示設定・写真・動画を、ページまたは記事ごとのフォルダへまとめます。

```text
content/
  site/index.json                 # サイト名・リンク・分野の順序
  site/assets/                    # 共通ロゴ等
  home/index.json                 # ホームの見出し
  about/index.json
  about/body.md
  communities/<slug>/index.json   # game・3dcg・hack・2dcg・music
  communities/<slug>/body.md
  communities/<slug>/assets/
  news/YYYY-MM-DD-topic/index.json
  news/YYYY-MM-DD-topic/body.md
  news/YYYY-MM-DD-topic/assets/
  tags.json
```

本文は `body.md`、設定は `index.json`、素材は `assets/` に統一します。本文やJSONから `./assets/cover.jpg` のように相対参照します。写真を `public/` へ二重コピーする必要はありません。

## ニュースの追加

```bash
npm run new:news -- 2026-11-14-event-guide
npm run dev
```

1. 生成されたフォルダの `index.json` でタイトル・概要・日時・著者ID・タグIDを編集します。
2. `body.md` に本文を書き、写真等を `assets/` へ置きます。
3. `thumbnail` を設定し、PCとモバイルでプレビューします。
4. `isPublished` を `true` にして、`npm run ci` で検査してから公開します。

```json
{
  "id": "2026-11-14-event-guide",
  "title": "イベントのご案内",
  "digest": "開催日と会場をご案内します。",
  "createdAt": "2026-11-14T12:00:00+09:00",
  "updatedAt": "2026-11-14T12:00:00+09:00",
  "isPublished": false,
  "isImportant": false,
  "body": "./body.md",
  "thumbnail": "./assets/cover.jpg",
  "authorIds": [],
  "tagIds": []
}
```

Markdownの画像は `![会場の様子](./assets/venue.jpg)` と記述します。

## 自動検出とURL

- 記事フォルダは自動検出されるため、Reactのimportや一覧配列へ追記しません。開発サーバーも変更を監視します。
- 公開順は `createdAt` の降順、同日時はID順です。`isImportant` はホームの重要なお知らせに使用します。
- `isPublished: false` の本文・素材は配信対象外です。
- ニュースURLは `/news/<id>`。公開後はIDを維持し、タイトル・フォルダ名の変更でURLを変えません。
- 分野URLは `/community/<slug>`。ID形式の旧分野URLへの転送はありません。
- 著者はContentfulから取得します。プロフィールのローカルJSONは作りません。

## 掲載作品

ホームとAboutの作品欄は、作品APIから最新の公開作品を最大20件取得します。作品情報・サムネイルを `content/` に保存する必要はありません。接続先は `VITE_API_BASE_URL` で設定します。

## 検査と素材

`scripts/prepare-content.mjs` はID・slugの重複、必須値、日時、著者ID形式、タグ参照、素材の存在と参照範囲、25 MiBのファイルサイズ上限を検査します。生成物の `src/generated/contentData.ts` を編集しません。
本文は遅延読込し、相対参照をビルド時に配信用URLへ変換します。Markdownのsanitize処理は維持します。新しい素材は用途の分かる名前で保存し、表示・再生を確認してください。

命名は [命名規則](naming-conventions.md)、配信条件は [Cloudflare Pages](cloudflare-pages.md) を参照します。
