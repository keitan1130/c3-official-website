# 現在の構成とデータの流れ

この文書は現在の `src/`・`content/`・`scripts/` の実装を説明します。旧NuxtサイトやToybox本体の設計とは分けて扱います。外部サービスの接続・本番配信の確認結果は [レビューと検証記録](review.md) を参照してください。

## 全体像

C3公式サイトはVite + React + TypeScriptのSPAです。独自のAPIサーバーや認証・投稿機能は持ちません。紹介・分野・お知らせをビルド時に取り込み、著者・ブログ・掲載作品をブラウザから外部APIへ取得します。React Routerが画面を切り替え、SWRが外部取得のキャッシュ・再取得・エラー状態を管理します。

```mermaid
flowchart TD
  Content[content の JSON・Markdown・素材] --> Prepare[prepare-content.mjs]
  Prepare --> Generated[src/generated/contentData.ts]
  Generated --> Local[contentRepository.ts]
  Local --> UI[React ページ・feature]
  Contentful[Contentful Delivery API] --> Authors[authorRepository.ts]
  Contentful --> Blogs[blogRepository.ts]
  Go[Go backend] --> Blogs
  Go --> Works[workRepository.ts]
  Authors --> SWR[SWR cache]
  Blogs --> SWR
  Works --> SWR
  SWR --> UI
  UI --> Markdown[BodyContent・MarkdownPreview]
  Build[Vite build] --> Dist[dist の JS・CSS・素材]
  Content --> Pages[prepare-pages.mjs]
  Dist --> Pages
  Pages --> Output[静的ルートHTML・OGP・sitemap・404・rewrite]
```

## ディレクトリの責務

| 場所 | 内容 |
| --- | --- |
| `content/site/index.json` | サイト名・説明・canonical origin・作品サイトURL・分野表示順・外部リンク |
| `content/about/` | C3紹介の設定・Markdown本文・素材 |
| `content/communities/<slug>/` | 分野ごとの設定・本文・MP4紹介動画。slugはgame / 3dcg / hack / 2dcg / music |
| `content/news/<folder>/` | お知らせの設定・本文・素材。フォルダ名と公開IDは別に扱う |
| `content/tags.json` | ローカルお知らせのタグ。外部ブログのタグは各APIが返すものを使う |
| `src/main.tsx` | テーマ初期化・React root・StrictMode・BrowserRouter |
| `src/App.tsx` | ルートとページのlazy import |
| `src/pages/` | URL・検索条件の受け取り、取得状態の分岐、featureの組み合わせ |
| `src/features/` | Header・記事カード・記事詳細・作品欄・Markdown表示などの機能 |
| `src/shared/ui/` | Button・Dialog・Paper・Toast・パンくず・メタ情報などの共通部品 |
| `src/shared/types/content.ts` | 内部のAuthor / Entry / BlogEntry / Community / FeaturedWork型 |
| `src/util/` | API境界・データ変換・テーマ・スクロール固定・日付表示・記事識別 |
| `src/assets/` | UIで共有するロゴ・アイコン・動画poster |
| `src/generated/` | コンテンツ生成物。Git管理外で手動編集しない |
| `scripts/` | コンテンツ生成・記事ひな形作成・配信HTML生成・各種検証 |
| `.storybook/` | UI確認・操作テスト・テーマ・a11yの設定 |
| `.github/workflows/ci.yaml` | PR / push時の依存導入と `npm run ci` |

CSSは各コンポーネントの `index.module.css` が所有し、全体の色・寸法は `src/index.css` の変数へ集約します。

## ルートと表示

| URL | ページ / 主な機能 | データ元 |
| --- | --- | --- |
| `/` | TopPage → HomeHero / HomeCommunity / HomeBlog / FeaturedWorks | ローカル + 外部ブログ・作品API |
| `/about` | AboutPage → Paper / BodyContent / CommunityLinks / FeaturedWorks | ローカル + 作品API |
| `/community/:slug` | CommunityPage → MP4 / Paper / BodyContent | ローカル |
| `/news` | NewsPage → EntryCard一覧 | ローカル公開お知らせ |
| `/news/:id` | NewsDetailPage → EntryDetail | ローカル公開お知らせ |
| `/blog` | BlogPage → BlogStatus / EntryCard一覧 | Contentful + Go経由の外部ブログ |
| `/blog/:id` | BlogDetailPage → BlogStatus / EntryDetail | `source`に応じたブログAPI |
| `/author/:id` | AuthorPage → AuthorProfile / EntryCard一覧 | Contentful著者・その著者のブログ |
| その他 | NotFoundPage | 404表示 |

一覧の `?tag=` はタグ名でクライアント内絞り込みを行います。ブログ詳細の `?source=contentful` / `?source=toybox` は取得元を指定します。その他のsourceは404画面です。旧分野ID、`/contact`、`/contact/thanks` は現在のルートにはありません。

`AppLayout` はヘッダー・フッター・本文へのスキップリンク・Suspenseを提供します。ページのlazy import待ちでも共通レイアウトを維持します。ハッシュなしのページ遷移では先頭へ移動し、Markdownの見出しハッシュは本文読込後に復元します。

## ローカルコンテンツの生成

1. `prepare-content.mjs` が `content/` のフォルダを探索し、JSONを読み込みます。
2. ID / slug重複、公開お知らせの必須値・日時・著者ID形式・タグ参照、分野の表示順設定、参照ファイルの範囲・存在・25 MiB上限を検査します。著者IDがContentfulに実在するかはこの処理では確認しません。
3. `isPublished: true` のお知らせだけを公開データへ含め、作成日時の新しい順、同時刻はID順に並べます。下書きの本文・素材は生成モジュールへ取り込みません。
4. `./assets/...` はViteの `?url` importへ、本文は `?raw` の動的importへ変換します。共通接頭辞のある素材名は長い参照から置換し、URLの一部だけが置換されるのを防ぎます。
5. `src/generated/contentData.ts` を出力し、`contentRepository.ts` が検索関数と `CONTENT` を公開します。

本文は `BodyLoader = () => Promise<string>` です。`BodyContent` の `useBody` が読込中・失敗・再試行を管理し、古いリクエストやアンマウント後の結果を表示に反映しません。ブラウザで取得するブログ本文も、この関数型へ揃えます。

`predev` / `prebuild` / `prestorybook` / `prebuild-storybook` が起動前に生成します。Viteプラグインは開発中の `content/` 変更を監視し、再生成します。`ci`では型チェック等に先立って生成し、buildのprehookでも生成するため、生成処理は2回走ります。

## APIと変換

| 用途 | 接続先と主要条件 | 内部の入口 |
| --- | --- | --- |
| 著者1人 | Contentful `/spaces/{space}/environments/master/entries?content_type=user&sys.id={id}&include=1&limit=100` | `getAuthor` |
| 著者一覧 | 同上、`skip`で全ページ取得 | `getAuthors`（現在のページから直接は使用しない） |
| ブログ一覧 | Contentful entries、`content_type=blog&include=2&limit=100&order=-sys.createdAt`、skipで全件取得 | `getBlogs` |
| Contentfulブログ詳細 | 上記に `sys.id` を指定 | `getBlog` |
| 著者別ブログ | 上記に `fields.user.sys.id` を指定 | `getAuthorBlogs` |
| 外部ブログ一覧 | Go backend `GET /api/v1/blogs?disable_pagination=true` | `getBlogs` |
| 外部ブログ詳細 | Go backend `GET /api/v1/blogs/{id}` | `getBlog` |
| 掲載作品 | Go backend `GET /works?limit=20&page=1&sort=newest&visibility=public` | `getPublicWorks` |

Contentfulには公開用DeliveryトークンをAuthorization headerで渡します。Go側の公開GETは `credentials: "omit"` で取得します。Goのブログ転送にはbackend側の `LEGACY_TOYBOX_BASE_URL` が必要です。このリポジトリにはbackendや同一originプロキシを実装していません。

`blogRepository.ts` はContentfulの `sys` / `fields` / `includes` と、外部ブログの `body_text` / `created_at` / `updated_at` / `user` を `BlogEntry` へ変換します。外部ブログの公開日時が作成・更新日時より後なら公開日時を優先します。Contentfulの `//...` 形式の素材URLはHTTPSに補完します。

`workRepository.ts` は `works` 配列を確認し、必要な型・`visibility: public` を満たす項目だけを最大20件へ制限して `FeaturedWork` に変換します。ブログと作品は同じAPIベースURLを使いますが、レスポンス形式は共通ではありません。

外部ブログの著者はレスポンス内の情報を表示し、作品サイトの著者ページへリンクします。Contentful著者IDとして再検索しません。Contentful記事・ローカルお知らせの著者は `AuthorBadge` がContentfulから取得します。

## キャッシュ・識別・失敗時の動作

| データ | SWR key / 状態 |
| --- | --- |
| ブログ一覧 | `"blogs"`。ホームとブログ一覧で共有 |
| ブログ詳細 | `["blog", id, source または "auto"]` |
| 著者 | `["author", id]`。著者バッジと著者ページで共有 |
| 著者別ブログ | `["author-blogs", id]`。著者取得成功後に取得 |
| 公開作品 | `["public-works", API_BASE_URL, WORKS_LIMIT]`。ホームとAboutで共有 |

ブログの識別は `source + id` を用います。リストのReact key、関連記事の除外、カルーセルのドットに同じ規則を適用します。URLにもsourceを含めます。

一覧はContentfulと外部ブログを並行取得します。一方だけ失敗すると成功側を表示し、部分失敗と再試行を出します。両方失敗するとエラー、成功した空配列は正常な0件です。取得失敗を404として扱いません。

詳細はsource指定時にはその取得元だけを使用します。省略時はContentfulを先に調べ、見つからない場合やContentful取得失敗時に外部ブログを調べます。外部ブログも404で、Contentful側が取得失敗していた場合は通信エラーを返します。両方の取得元で不在を確認できた場合に404画面となります。

自動エラー再試行は抑え、各画面に再試行操作があります。SWRの通常のキャッシュ共有・再検証は維持します。紹介・お知らせの本文は外部ブログの通信障害に依存しません。

## Markdown・島レイアウト・テーマ

C3紹介、分野、記事詳細は共通の `Paper` を使い、`--paper-color`、角丸、影、内側余白を揃えます。外枠は `--content-read-width: 1300px` を上限とし、左右余白は通常32px、599px以下で16pxです。Paperの内側は通常40px、スマホ16px。記事詳細はこの外枠内に本文と300pxのサイドバーを配置し、1000px以下で縦並びにします。

`MarkdownPreview` はGFM・数式・改行・raw HTMLを解析し、sanitize後にKaTeXや見出しリンクなどを組み立てます。script / iframe / SVG等を除外し、URLのprotocol制限・ID衝突対策を維持します。許可した色・文字サイズ・画像幅だけを装飾として扱います。画像拡大は共通Dialog、コードコピーはToastを使用します。

コード・引用・表見出し等は `--background-color` を使い、Paperの背景と区別します。`details`と表本体には背景を固定しません。画像拡大／メニューは `lockPageScroll` と対応CSSで背景を固定し、閉じたときにスクロール位置を戻します。

テーマは `data-theme` を介してCSS変数を切り替えます。起動時はlocalStorageの保存値を優先し、未保存ならOS設定、取得不可ならライトです。変更は保存・他タブへ同期します。`prefers-reduced-motion` による表示分岐は現在ありません。

## ビルド後の配信

`npm run build` はコンテンツ生成 → TypeScript → Vite → `prepare-pages.mjs` の順です。postbuildはローカル設定から静的ルートごとのHTMLにtitle・description・OGP・canonicalを埋め込み、OGP画像・sitemap・robots・404・`_redirects` を生成します。静的ルート数は公開お知らせ・分野の件数に応じて変わります。

`PageMeta` はブラウザ内遷移後のtitle・OGP・canonicalを更新し、404には `noindex`、通常ページへの復帰時には解除します。クライアントの更新だけで、ブログ詳細・著者の初期HTMLに個別OGPが付くわけではありません。

Cloudflare向けrewriteは `/blog/*` と `/author/*` のSPA表示用です。未知の動的IDを画面で404にしてもHTTPステータスは200です。動的詳細の初期OGP・sitemap・HTTP404は残課題です。`preview:pages` は静的配信のローカルモデルで、本番環境を再現するものではありません。

## 環境変数と検証の入口

- `VITE_CTF_SPACE_ID`：Contentful space。
- `VITE_CTF_CDA_ACCESS_TOKEN`：公開可能なDeliveryトークン。
- `VITE_API_BASE_URL`：Go backendのベースURL。`/works`・`/api/v1`を含めません。
- `SITE_URL`：postbuildのcanonical originを上書きするビルド用設定。省略時は `content/site/index.json`。

`VITE_*` はブラウザ配信に含まれます。実値や管理用・Previewトークンは文書・テンプレートに保存しません。Vite環境変数を変更したときは開発サーバーの再起動、公開用には再ビルドが必要です。

日常の検証は [開発環境とCI](development-and-ci.md)、content編集は [コンテンツ構成](content-structure.md)、公開前の確認は [Cloudflare Pages](cloudflare-pages.md) を参照してください。
