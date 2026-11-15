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

C3ロゴの元画像は `public/C3Logo.svg` です。画面は `SITE.logo` を参照し、favicon・端末用アイコン・OGP用PNG・新規ニュースの仮画像は同じSVGから生成したPNGを使用します。その他の共通アイコン・動画読み込み用画像は `src/assets/` に配置します。記事・紹介本文に付属する素材は `content/` 内の各 `assets/` に配置します。サイト設定・固定ページ名・外部リンクは `src/config/site.ts`、分野名・表示順は `src/config/communities.ts` で管理します。

本文は `body.md`、設定は `index.json`、記事・ページ専用のローカル素材は必ず同居する `assets/` 配下に統一します。新規作成・通常編集とも例外は設けません。動画は `./assets/hero.mp4`、画像は `./assets/photo-07.png` のように参照します。素材が多い場合も `assets/photos/` など、`assets/` の中で整理します。写真を `public/` へ二重コピーする必要はありません。

JSONの相対パスは `index.json` のあるフォルダを基準に、本文の相対URLはMarkdownファイルのあるフォルダを基準に解決します。`./` は省略できます。画像・動画等の相対参照と、`./assets/...`（`assets/...` も可）を指すリンクは素材として検証・変換し、同じ記事・ページの `assets/` 配下から外れる場合はシンボリックリンク経由も含めて生成時にエラーにします。それ以外のリンクはページURLとして保持します。参照形式とHTMLのリンクにも同じ規則を適用します。本文を別フォルダに置く場合は `../assets/...` も素材として解決します。

`/news/article-id` の本文では、次のようにページ遷移を記述できます。相対ページURLはブラウザが表示中のURLを基準に解決するため、末尾スラッシュの有無で移動先が変わります。

```md
[別の記事](./other-article-id)
[Aboutへ](../about)
[お知らせ一覧](/news)
```

## ニュースの追加

```bash
npm run new:news -- 2026-11-14-event-guide
npm run dev
```

1. 生成されたフォルダの `index.json` でタイトル・概要・投稿日を編集します。
2. `body.md` に本文を書き、写真等を `assets/` へ置きます。
3. 仮のサムネイル `assets/cover.png` を差し替えるか、別の画像を置いて `thumbnail` を変更します。PCとモバイルでプレビューします。
4. `npm run ci` で検査してから変更を公開します。追加した全記事が配信対象です。

```json
{
  "id": "2026-11-14-event-guide",
  "title": "イベントのご案内",
  "digest": "開催日と会場をご案内します。",
  "publishedDate": "2026-11-14",
  "body": "./body.md",
  "thumbnail": "./assets/cover.jpg"
}
```

Markdownの画像は `![会場の様子](./assets/venue.jpg)` と記述します。

## Markdownの書き方

- 見出し・箇条書き・リンク・画像・GFMの表など、`MarkdownPreview` が対応する記法を使います。日本語の文中の強調は `グッズの**割引券**が貰えます` のように `**` で囲みます。`__` は前後の文字によって強調にならない場合があります。
- 画像は原則 `![画像の説明](./assets/photo.jpg)` で記述します。幅の指定が必要なら `<img src="./assets/photo.jpg" alt="画像の説明" width="200" />` を使えます。画像の高さやパーセント幅は指定できません。
- 空白を含むファイル名は `![画像](<./photos/photo (1).png>)` またはURLエンコードで記述できます。参照形式の画像・リンク、HTMLの画像・動画・音声・poster・source・trackも相対URLを解決します。クエリ・フラグメントは保持し、コードブロック・インラインコード内の例や通常の文章は変換しません。
- `div` による中央寄せ・flex配置、`b` タグ、spanのmarginやfont-styleは表示側で除去されます。段落・空行・`**強調**`・画像を使って構成します。
- 表内の `<br>` と、spanの許可された文字色・文字サイズは利用できます。raw HTMLの全要素・全スタイルに対応しているわけではありません。許可内容は [markdownSchema.ts](../src/features/MarkdownPreview/markdownSchema.ts) と [rehypeMarkdownStyles.ts](../src/features/MarkdownPreview/rehypeMarkdownStyles.ts) を参照してください。
- 見出し・手動指定ID・脚注へのリンクは `#名前` を使います。例: `<p id="custom-anchor">本文</p>` に `[本文へ](#custom-anchor)` または `記事URL#custom-anchor` で移動できます。`[^note]` の脚注は `#fn-note`、本文への戻り先は `#fnref-note`（再参照は `#fnref-note-2`）です。内部IDの保護用接頭辞は記述しません。直接アクセス・再読込・本文内クリックで、対象を含む折りたたみも開きます。

## 自動検出とURL

- 記事フォルダは自動検出されるため、Reactのimportや一覧配列へ追記しません。開発サーバーも変更を監視します。
- 表示順は `publishedDate` の降順、同日はID順です。全記事を公開し、ホームのお知らせには最新5件を使用します。公開フラグと下書き機能はありません。
- 作業中の記事はローカルで編集し、完成してからコミット・公開します。新規作成コマンドは仮のサムネイルも配置します。
- ニュースURLは `/news/<id>`。公開後はIDを維持し、タイトル・フォルダ名の変更でURLを変えません。
- 分野URLは `/community/<slug>`。slugはコード側の分野定義とフォルダ名を一致させます。分野のJSONは `domain`・`body`・`mp4` を持ち、名称・旧ID・slugを重複定義しません。新しい分野は定義とフォルダを一緒に追加します。
- ニュースのタグ参照・タグ表示・タグ絞り込みはありません。ブログのタグは引き続き各APIから取得します。
- AboutのJSONは `summary` と `body` を持ち、ページ名は共通設定を参照します。
- ニュースは `publishedDate: "YYYY-MM-DD"` の投稿日だけを管理し、「投稿日：YYYY/MM/DD」と表示します。作成日時・更新日時・著者IDは持ちません。ブログの著者・日時は各APIから取得します。

## 掲載作品

ホームとAboutの作品欄は、作品APIから最新の公開作品を最大20件取得します。作品情報・サムネイルを `content/` に保存する必要はありません。接続先は `VITE_API_BASE_URL` で設定します。

## 検査と素材

`scripts/local-content.mjs` は生成処理で共用する検証を担当します。IDは英数字と途中のハイフン・アンダースコアを許可し、既存のContentful IDを保持します。必須値、実在する投稿日（YYYY-MM-DD）、素材の存在と参照範囲、25 MiBの上限も検査します。サムネイルは記事の `assets/` 配下のPNG / JPEG / WebP / GIF / AVIFに限定し、外部URLは使いません。生成物の `src/generated/contentData.ts` を編集しません。
本文は遅延読込し、構文解析した相対参照をビルド時に配信用URLへ変換します。素材はサイズにかかわらずファイルとして出力し、Markdownのsanitize処理は維持します。新しい素材は用途の分かる名前で保存し、表示・再生を確認してください。`npm run build && npm run test:content:browser` でビルド成果物の全本文と画像・動画をPC・モバイル幅で検証できます。

命名は [命名規則](naming-conventions.md)、配信条件は [Cloudflare Pages](cloudflare-pages.md) を参照します。
