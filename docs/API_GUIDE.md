# API・データ取得ガイド

作業範囲は [AGENTS.md](../AGENTS.md)、検証は [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) を参照します。

API一覧・型変換・SWR keyの詳細は [現在の構成](architecture.md) を参照します。

## データ境界

- 紹介・分野・お知らせはローカル `content/` を正とします。`scripts/prepare-content.mjs` が参照を検査し、`src/generated/contentData.ts` を生成します。表示側は `src/util/contentRepository.ts` を利用します。
- 著者プロフィールは `src/util/authorRepository.ts` からContentfulの公開 `user` を取得します。プロフィールをローカルへ固定せず、`/author/:id` と著者別ブログ一覧を維持します。
- ブログは `src/util/blogRepository.ts` でContentfulと外部ブログAPIを取得し、`source` とIDを組み合わせて区別します。本文は `MarkdownPreview` で表示します。
- 外部ブログの `user.id` をContentfulの著者IDとして検索しません。外部サービス側の著者ページへリンクします。
- ホームとAboutの掲載作品は `src/util/workRepository.ts` から `GET /works?limit=20&page=1&sort=newest&visibility=public` で最新の公開作品を最大20件取得します。認証情報は送らず、ブログと接続先を共有し、レスポンスの契約はAPIごとに扱います。

## 環境設定

| 変数 | 用途 |
| --- | --- |
| `VITE_CTF_SPACE_ID` | Contentfulの公開space |
| `VITE_CTF_CDA_ACCESS_TOKEN` | Contentful Delivery APIの公開可能な配信トークン |
| `VITE_API_BASE_URL` | GoバックエンドのベースURL（`/works`・`/api/v1`を付けない）。作品・ブログ共通 |

`VITE_*` は配信コードへ公開されます。管理用トークンや秘密情報は含めません。実値は `.env` または公開環境の設定で管理します。

## 通信とエラー処理

- Goバックエンドの `/works` と `/api/v1/blogs` へブラウザから接続します。ブログはGoバックエンド既存の転送機能を使い、Vite / Pages Functionsにはプロキシを追加しません。CORSの整理は保留中です。
- Contentfulはページングして取得します。著者別ブログは `fields.user.sys.id` で絞り込みます。
- 独立したブログ取得は並行実行し、一方の失敗は部分失敗として表示します。全失敗・正常な空結果・404・通信エラーを区別し、再試行を用意します。
- ブログ通信の失敗で紹介・ニュース・作品欄を表示不能にしません。
- SWR keyにはpath・query・source等、結果を変える値を含めます。
- APIのsnake_caseを内部型へ変換する処理はAPI境界へまとめます。公開GETに不要な認証情報やcookieを転送しません。
- 実API・CORSの確認と、fixtureやローカル検査の成功を区別して報告します。

作品APIはホームとAboutでSWRキャッシュを共有します。読込中・0件・失敗と再試行を表示し、失敗しても作品サイトへのリンクを維持します。作品の直接接続に必要なCORSは公開先で別途確認します。

ブログの転送にはGoバックエンド側の `LEGACY_TOYBOX_BASE_URL` 設定が必要です。未設定ならブログAPIは503を返します。この設定はfrontendの環境変数には含めません。

取得元を省略したブログ詳細はContentfulの不在・取得失敗時に外部ブログも検索します。一方の取得元が失敗し、他方が404の場合は取得失敗として表示します。関連記事・カルーセルの識別にもsourceとIDを組み合わせます。
