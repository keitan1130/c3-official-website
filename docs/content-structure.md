# Markdown・メディアの構成

## 回収原本と日常の更新を分ける

現在の `migration/snapshots/` は取得元のID・フィールド・URLを残すための原本で、普段の更新では編集しない。
日常の編集先は `content/`。**ページ・記事ごとに本文、写真、動画、表示設定を同じフォルダにまとめる。**
以前の案のように記事本文と写真を `content/` と `public/media/` に分けず、対象記事のフォルダだけで更新できる構成にする。
以下を基本構成としてローカル読込・記事検出・変換を実装済み。細部と進捗は [段階別結果](implementation-results.md) を参照する。
`src/` は Toybox frontend と同じ責務分割とし、CSS は各ページ・コンポーネントの `index.module.css` に分割する。

```text
c3-official-website/
  content/
    site/
      index.json                    # サイト名・ナビ・共通リンク・分野の表示順
      assets/
        logo.webp
    home/
      index.json                    # ホーム固有の見出し・表示設定
    about/
      index.json                    # title・概要・使用する要素と順序
      body.md                       # C3紹介本文
      assets/
        club-photo.jpg
    communities/
      game/                         # 他: 3dcg、hack、2dcg、music
        index.json                  # id・slug・name・domain・動画と本文の参照
        body.md
        assets/
          poster.webp
          hero.webm
          hero.mp4
    news/
      2026-11-14-event-guide/        # 実際の公開日＋内容が分かるslug
        index.json                  # id・title・digest・日時・著者・タグ・公開状態
        body.md
        assets/
          cover.jpg
          venue.jpg
    featured-works/
      index.json                    # ホーム / About 共通の掲載順
      example-game/
        index.json                  # 安定ID・title・サムネイルの相対参照
        assets/
          thumbnail.png
    tags.json
  src/
    App.tsx                         # ルート定義
    App.css                         # アプリ全体に必要な最小限の定義
    main.tsx                        # 起動・Provider
    index.css                       # reset・基本フォント・共通トークン
    pages/                          # ルートごとの構成とページ固有の配置
      TopPage/
        index.tsx
        index.module.css
      AboutPage/
        index.tsx
        index.module.css
      NewsPage/                     # 他ページも同じ配置規則
        index.tsx
        index.module.css
    features/
      AppLayout/                    # Header・Outlet・Footer の配置
        index.tsx
        index.module.css
      Header/
        index.tsx
        index.module.css
      Footer/
        index.tsx
        index.module.css
      NewsIndex/
        index.tsx
        index.module.css
        NewsCard/                   # 機能内の子部品も同じ配置規則
          index.tsx
          index.module.css
      MarkdownPreview/              # Toybox から依存部品と一緒に移植
        index.tsx
        index.module.css
        CodeBlock/
          index.tsx
          index.module.css
    shared/
      ui/                           # 汎用部品。各部品に TSX と CSS を同居
        Button/
          index.tsx
          index.module.css
      hook/                         # 複数機能で共有する hook が必要な場合
      types/content.ts
    util/
      contentRepository.ts          # ローカル読込と参照解決
      blogRepository.ts             # Contentful / Toybox ブログ取得のAPI境界
    assets/                         # UI部品からimportする装飾素材
  scripts/
    export-public-content.py
  migration/
    snapshots/<date>/
      manifest.json
      entries/<content-type>/<id>.json
      markdown/<content-type>/<id>/<field>.<locale>.md
      asset-metadata/<id>.json
      assets/
```

## ファイル名とURL

- フォルダ名は短く内容が分かる小文字英数字の kebab-case。ニュースは `YYYY-MM-DD-内容`、分野は `game` / `3dcg` / `hack` / `2dcg` / `music` に統一する。
- 本文は `body.md`、表示設定・メタデータは `index.json`、写真・動画・音声等の素材はすべて同居する `assets/` に置く。写真名も `venue.jpg` のように用途が分かる名前にする。
- お知らせはフォルダ名と公開URLを分離し、JSONの旧 `id` で既存URLを維持する。全36名の著者はContentfulから取得したIDで旧URLを維持し、ローカルにプロフィールJSONを置かない。
- 新しいニュースの `id` は日付付きslugを初期値にし、公開後は変更しない。後でフォルダ名やタイトルを直しても `id` を維持する。
- 分野の公開URLは `/community/<slug>`。旧 Contentful ID は照合用として保持するがルーティングには使わず、旧IDのURLから転送しない。
- 著者プロフィールはローカルフォルダを作らずContentfulから取得する。人物の同一性は表示名ではなくContentfulのIDで扱う。

## 読込と自動反映

- `contentRepository.ts` で `content/news/*/index.json` 等をビルド時に検出する。ニュースを登録するための配列やimportを人が追加する必要はない。
- 各記事の本文・メディアは同じ記事フォルダを基準に解決する。本文とJSONから `./assets/cover.jpg` のような相対パスで参照する。
- メディアはビルド時に配信用URLへ変換する。編集者が `dist/assets/` のハッシュ付きファイル名を調べたり、`public/` へ写真を二重コピーしたりする必要はない。
- Markdown内の画像、許可したHTMLの画像・動画・poster、JSONのサムネイル・アイコンを同じ規則で解決し、既存のsanitize処理を維持する。通常の外部リンクは書き換えない。
- `isPublished: false` のニュースは公開一覧・詳細・sitemapの対象外にする。`true` の記事は `createdAt` の降順、同日時は `id` 順で安定して並べる。
- 本文・全画像の一括読み込みで初期表示を重くしない。必要な本文の読込と画像の遅延表示を分けて設計する。
- `id` / slug の重複、必須値、日時、著者IDの形式・タグ参照、本文・画像・動画の不存在をビルド前に検出する。ファイルを追加しただけで静かに欠落する状態にしない。
- 紹介・分野・お知らせ・掲載作品の表示にContentful設定は不要。ブログ取得には別途公開用の配信設定が必要。

## 表示する要素とコードの役割

`index.json` は見出し、概要、写真・動画、リンク、対応する既存セクションの表示順等を管理する。
Aboutの本文・写真は `content/about/`、ホーム固有の設定は `content/home/`、共通の掲載作品は `content/featured-works/` を両ページで使う。
同じ作品データをAboutとホームの両方へコピーしない。

HTML構造・操作・レイアウトは `src/pages/` と `src/features/`、CSSは対応するCSS Modulesが担当する。
既存の要素の本文・写真・リンクを変えるためにTSXを編集する必要はない。新しい種類のUIや動作を追加する場合はコンポーネント側を拡張する。
初期移行ではセクション順と表示設定を現行UIに合わせ、ファイル管理への移行を理由にデザインを変えない。

## 新しいニュースの追加例

以下は公開する実記事ではなく、実装済みの新規記事作成コマンドと編集例。

```bash
npm run new:news -- 2026-11-14-event-guide
npm run dev
```

コマンドは下書きのindex.json・body.md・assets/を作る。画像を配置してthumbnailを指定し、公開状態を変える。

1. `content/news/2026-11-14-event-guide/` を作る。
2. `index.json` と `body.md` を置き、写真を同じフォルダの `assets/` に入れる。
3. 本文とメタデータを編集し、プレビューでPC / モバイルを確認する。
4. `isPublished` を `true` にして、参照検査とbuild後にPagesへ公開する。ニュース一覧は自動で反映する。

`index.json` の例:

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

`body.md` の例:

```markdown
# イベントのご案内

開催日と会場をお知らせします。

![会場の様子](./assets/venue.jpg)
```

ニュース用のテンプレートには、この2ファイルと画像の置き場所・更新手順を含める。
上の構成でコードを変更せず1件追加できることを、実装段階2・5の受け入れ確認に含める。

## 移行と運用

- 原本の本文・日時・重要フラグ・著者・タグ参照を保持し、既存記事は公開済みとして変換する。日付をタイトルやフォルダ名から推測しない。
- 回収URLを記事内の相対パスへ変換し、参照対応を記録する。欠損したDiscord画像の参照は運用本文から削除し、原本は変更しない。
- `wordsOfDirector` 等のRichTextは原本を残し、採用する場合に明示的に変換する。
- 初期移行では画像・動画を再圧縮しない。最大ファイルサイズ等のPages配信条件を検査する。
- `public/` はfavicon・robots等、配置先の決まった配信ファイルに使う。記事の写真は所有する記事フォルダに置く。
- 回収原本や下書きの本文・メディアを無条件に配信しない。公開対象から参照するものを成果物に含め、下書きの内容がbuild結果へ混入しないことも確認する。
- 著者プロフィールはContentful、ブログ本文はContentful＋Toybox取得を継続し、このローカル記事管理とは区別する。お問い合わせ機能は実装しない。

作品の表示順・項目は [確定事項](decisions.md#作品のファイル名とフォルダ名)、命名と配置は [命名規則](naming-conventions.md) に従う。
