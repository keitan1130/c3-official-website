# 構成とAPI

Vite + React + TypeScriptのSPAです。認証・投稿機能や独自APIサーバーは持ちません。

## 配置

| 場所 | 責務 |
| --- | --- |
| `src/pages/` | ルートごとの画面構成 |
| `src/features/` | 機能ごとのUI・hook |
| `src/shared/` | 汎用UI・共有型 |
| `src/util/` | API取得・テーマ・メタデータ等の共有処理 |
| `src/config/` | サイト名・外部リンク・分野定義 |
| `src/assets/` | 共通UI素材 |
| `content/` | 紹介・分野・ニュースの設定・本文・専用素材 |
| `public/` | ロゴ元SVG、favicon等の固定パス素材 |
| `scripts/content/` | ローカル本文の検証・生成・記事作成 |
| `scripts/pages/` | 配信用HTML生成・ローカルプレビュー |
| `scripts/checks/` | TypeScript・CSSの命名検査 |
| `scripts/lib/` | Node側の環境設定 |
| `build/vite/` | コンテンツ監視・HTMLメタデータ・Pages出力プラグイン |
| `tests/` | VitestのNodeテスト、Playwrightの `e2e/`、fixture・Node用ヘルパー |
| `src/generated/`・`dist/` | Git管理外の生成物。手動編集しない |

`vite.config.ts` はアプリのプラグインとalias、`vitest.config.ts` はNode・Storybookのproject、`playwright.config.ts` はE2Eとサーバー起動を担当します。
Vite起動時にローカル本文を検証し、遅延importを持つ一覧を生成します。開発中は `content/` を監視します。
ビルド時は同じmode・公開originを使い、Viteの出力先へ各静的ページのHTML・OGP・sitemap・404を生成します。

## ルートとデータ

| URL | データ |
| --- | --- |
| `/` | ローカル紹介・分野・最新5件のニュース、ブログ、最新20作品 |
| `/about` | ローカル紹介・分野・最新20作品 |
| `/community/:slug` | 分野の本文・MP4。slugはコード定義とフォルダ名を一致させる |
| `/news`・`/news/:id` | ローカルニュース。全件公開、投稿日降順・同日はID順 |
| `/blog` | ContentfulとToyboxのブログ。`?tag=` でタグ名を絞り込む |
| `/blog/:id` | UUIDはToybox、それ以外はContentful |
| `/author/:id` | Contentfulの著者・著者別ブログ |

ブログIDは取得元間で重複しない前提です。URLはIDだけを持ち、取得失敗時に別サービスへ切り替えません。
記事一覧型は `EntrySummary`、本文loaderを持つ詳細型は `Entry`。取得境界で共通型へ変換します。

## 外部API

| 用途 | 接続先・条件 |
| --- | --- |
| Contentful著者 | `user`、`include=1`。100件ずつ全件取得 |
| Contentfulブログ一覧 | `blog`、`include=2`、作成日降順。100件ずつ全件取得し、本文は除外 |
| Contentful詳細・著者別一覧 | `sys.id` / `fields.user.sys.id` |
| Toyboxブログ | `VITE_API_BASE_URL` の `/api/v1/blogs?disable_pagination=true`、詳細は `/api/v1/blogs/:id` |
| 公開作品 | 同じbase URLの `/works?limit=20&page=1&sort=newest&visibility=public` |

Contentfulの設定は `.env.example` を参照します。共通APIのbase URLに `/works` や `/api/v1` を含めません。
Goの公開GETへcookieを送りません。Toyboxへの転送はbackend側の設定が必要で、Vite側にプロキシはありません。
SWRでブログ一覧・詳細・著者・作品を共有し、ローカル本文は外部APIに依存しません。
ブログ一覧は一方のAPIが失敗すれば成功分と部分失敗を表示します。画面のページングは設けません。
