# API・データ取得ガイド

作業範囲は [AGENTS.md](../AGENTS.md)、検証は [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) を参照します。

API一覧・型変換・SWR keyの詳細は [現在の構成](architecture.md) を参照します。

## データ境界

- 紹介・分野・お知らせはローカル `content/` を正とします。`scripts/local-content.mjs` の共通読込・検証を使い、`prepare-content.mjs` が `src/generated/contentData.ts` を生成します。配信用HTMLも同じ検証結果を使います。表示側は `src/util/contentRepository.ts` を利用します。
- 著者プロフィールは `src/util/authorRepository.ts` からContentfulの公開 `user` を取得します。プロフィールをローカルへ固定せず、`/author/:id` と著者別ブログ一覧を維持します。著者バッジ・著者ページは `useAuthors` の同じ著者一覧キャッシュを使い、Contentfulブログに含まれる著者プロフィールは通信せずに表示します。
- Contentful通信は `src/util/contentfulClient.ts` に集約し、ブログは `src/util/blogRepository.ts` でContentfulと外部ブログAPIを取得し、IDのみで識別します。UUIDはToybox、それ以外はContentfulへ取得します。本文は `MarkdownPreview` で表示します。
- Contentfulブログの著者バッジは、ブログ取得結果の `includes.Entry`・`includes.Asset` を再利用します。ローカルお知らせや著者情報が含まれないブログだけ、共通の著者一覧を100件ずつ取得し、ページ間で共有します。バッジごとの `sys.id` 付き取得や、フォーカス復帰時などの自動再取得は行いません。著者プロフィールも同じ著者一覧キャッシュからIDで選び、失敗時の再試行で一覧を更新します。
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
- Contentful一覧はselectで本文を除外し、APIのlimit / skipを使って100件ずつ取得して全件を集めます。画面にページングや「もっと見る」は設けません。著者別ブログは `fields.user.sys.id` で絞り込み、本文を除いた全件を取得します。Toybox一覧は既存の `disable_pagination=true` による全件取得を維持します。既存APIは本文も必ず返すため、本文の転送削減にはAPI側の対応が必要です。
- 独立したブログ取得は並行実行し、一方の失敗は部分失敗として表示します。全失敗・正常な空結果・404・通信エラーを区別し、再試行を用意します。
- ブログ通信の失敗で紹介・ニュース・作品欄を表示不能にしません。
- SWR keyには記事ID・著者IDなど、結果を変える値を含めます。
- APIのsnake_caseを内部型へ変換する処理はAPI境界へまとめます。公開GETに不要な認証情報やcookieを転送しません。
- 実API・CORSの確認と、fixtureやローカル検査の成功を区別して報告します。

作品APIはホームとAboutでSWRキャッシュを共有します。読込中・0件・失敗と再試行を表示し、失敗しても作品サイトへのリンクを維持します。作品の直接接続に必要なCORSは公開先で別途確認します。

ブログの転送にはGoバックエンド側の `LEGACY_TOYBOX_BASE_URL` 設定が必要です。未設定ならブログAPIは503を返します。この設定はfrontendの環境変数には含めません。

ブログ詳細は `/blog/:id` に統一します。ID形式に対応したサービスのみ取得し、404と通信エラーを区別します。最近の記事・カルーセルもIDだけで識別します。ブログ一覧は全件を取得し、ブログのタグは取得済みの全記事を絞り込みます。ニュースにはタグ参照・絞り込みを設けません。

一覧型の `EntrySummary` / `BlogSummary` は本文を持たず、詳細型の `Entry` / `BlogEntry` だけが本文を持ちます。著者参照・タグは取得境界で表示用形式へ揃えます。
