# 記事・素材の管理

本文・表示設定・写真・動画を、ページまたは記事ごとのフォルダへまとめます。

```text
content/
  about/index.json
  about/body.md
  communities/<slug>/index.json   # game・3dcg・hack・2dcg・music
  communities/<slug>/body.md
  communities/<slug>/assets/
  news/YYYY-MM-DD-topic/index.json
  news/YYYY-MM-DD-topic/body.md
  news/YYYY-MM-DD-topic/assets/
```

共通ロゴ・アイコン・動画読み込み用画像は `src/assets/` に配置し、UIからimportして使用します。記事・紹介本文に付属する素材は `content/` 内の各 `assets/` に配置します。サイト設定・固定ページ名・外部リンクは `src/config/site.ts`、分野名・表示順は `src/config/communities.ts` で管理します。

本文は `body.md`、設定は `index.json`、素材は `assets/` に統一します。本文やJSONから `./assets/cover.jpg` のように相対参照します。写真を `public/` へ二重コピーする必要はありません。

## ニュースの追加

```bash
npm run new:news -- 2026-11-14-event-guide
npm run dev
```

1. 生成されたフォルダの `index.json` でタイトル・概要・日時・著者IDを編集します。
2. `body.md` に本文を書き、写真等を `assets/` へ置きます。
3. 仮のサムネイル `assets/cover.webp` を差し替えるか、別の画像を置いて `thumbnail` を変更します。PCとモバイルでプレビューします。
4. `npm run ci` で検査してから変更を公開します。追加した全記事が配信対象です。

```json
{
  "id": "2026-11-14-event-guide",
  "title": "イベントのご案内",
  "digest": "開催日と会場をご案内します。",
  "createdAt": "2026-11-14T12:00:00+09:00",
  "updatedAt": "2026-11-14T12:00:00+09:00",
  "body": "./body.md",
  "thumbnail": "./assets/cover.jpg",
  "authorIds": []
}
```

Markdownの画像は `![会場の様子](./assets/venue.jpg)` と記述します。

## Markdownの書き方

- 見出し・箇条書き・リンク・画像・GFMの表など、`MarkdownPreview` が対応する記法を使います。日本語の文中の強調は `グッズの**割引券**が貰えます` のように `**` で囲みます。`__` は前後の文字によって強調にならない場合があります。
- 画像は原則 `![画像の説明](./assets/photo.jpg)` で記述します。幅の指定が必要なら `<img src="./assets/photo.jpg" alt="画像の説明" width="200" />` を使えます。画像の高さやパーセント幅は指定できません。
- `div` による中央寄せ・flex配置、`b` タグ、spanのmarginやfont-styleは表示側で除去されます。段落・空行・`**強調**`・画像を使って構成します。
- 表内の `<br>` と、spanの許可された文字色・文字サイズは利用できます。raw HTMLの全要素・全スタイルに対応しているわけではありません。許可内容は [markdownSchema.ts](../src/features/MarkdownPreview/markdownSchema.ts) と [rehypeMarkdownStyles.ts](../src/features/MarkdownPreview/rehypeMarkdownStyles.ts) を参照してください。

## 自動検出とURL

- 記事フォルダは自動検出されるため、Reactのimportや一覧配列へ追記しません。開発サーバーも変更を監視します。
- 表示順は `createdAt` の降順、同日時はID順です。全記事を公開し、ホームのお知らせには最新5件を使用します。公開フラグと下書き機能はありません。
- 作業中の記事はローカルで編集し、完成してからコミット・公開します。新規作成コマンドは仮のサムネイルも配置します。
- ニュースURLは `/news/<id>`。公開後はIDを維持し、タイトル・フォルダ名の変更でURLを変えません。
- 分野URLは `/community/<slug>`。slugはコード側の分野定義とフォルダ名を一致させます。分野のJSONは `domain`・`body`・`mp4` を持ち、名称・旧ID・slugを重複定義しません。新しい分野は定義とフォルダを一緒に追加します。
- ニュースのタグ参照・タグ表示・タグ絞り込みはありません。ブログのタグは引き続き各APIから取得します。
- AboutのJSONは `summary` と `body` を持ち、ページ名は共通設定を参照します。
- 著者はContentfulから取得します。プロフィールのローカルJSONは作りません。

## 掲載作品

ホームとAboutの作品欄は、作品APIから最新の公開作品を最大20件取得します。作品情報・サムネイルを `content/` に保存する必要はありません。接続先は `VITE_API_BASE_URL` で設定します。

## 検査と素材

`scripts/local-content.mjs` は生成処理で共用する検証を担当します。IDは英数字と途中のハイフン・アンダースコアを許可し、既存のContentful IDを保持します。必須値、タイムゾーン付き日時と更新日時の前後関係、著者配列の重複、素材の存在と参照範囲、25 MiBの上限も検査します。サムネイルは記事の `./assets/` 内のPNG / JPEG / WebP / GIF / AVIFに限定し、外部URLは使いません。生成物の `src/generated/contentData.ts` を編集しません。
本文は遅延読込し、相対参照をビルド時に配信用URLへ変換します。Markdownのsanitize処理は維持します。新しい素材は用途の分かる名前で保存し、表示・再生を確認してください。

命名は [命名規則](naming-conventions.md)、配信条件は [Cloudflare Pages](cloudflare-pages.md) を参照します。
