# API・データ取得ガイド

作業範囲は [AGENTS.md](AGENTS.md)、検証は [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) を参照します。

## データ境界

- 紹介・分野・お知らせ・掲載作品はローカル `content/` を正とします。`scripts/prepare-content.mjs` が参照を検査し、`src/generated/contentData.ts` を生成します。表示側は `src/util/contentRepository.ts` を利用します。
- 著者プロフィールは `src/util/authorRepository.ts` からContentfulの公開 `user` を取得します。プロフィールをローカルへ固定せず、`/author/:id` と著者別ブログ一覧を維持します。
- ブログは `src/util/blogRepository.ts` でContentfulと外部ブログAPIを取得し、`source` とIDを組み合わせて区別します。本文は `MarkdownPreview` で表示します。
- 外部ブログの `user.id` をContentfulの著者IDとして検索しません。外部サービス側の著者ページへリンクします。
- 掲載作品はローカルファイルから読み、実行時に作品APIを呼びません。

## 環境設定

| 変数 | 用途 |
| --- | --- |
| `VITE_CTF_SPACE_ID` | Contentfulの公開space |
| `VITE_CTF_CDA_ACCESS_TOKEN` | Contentful Delivery APIの公開可能な配信トークン |
| `VITE_TOYBOX_API_BASE_URL` | 外部ブログAPIのベースURL |

`VITE_*` は配信コードへ公開されます。管理用トークンや秘密情報は含めません。実値は `.env.local` または公開環境の設定で管理します。

## 通信とエラー処理

- 公開APIへブラウザから直接接続します。同一originプロキシは追加しません。CORSの整理は保留中です。
- Contentfulはページングして取得します。著者別ブログは `fields.user.sys.id` で絞り込みます。
- 独立したブログ取得は並行実行し、一方の失敗は部分失敗として表示します。全失敗・正常な空結果・404・通信エラーを区別し、再試行を用意します。
- ブログ通信の失敗でローカルの紹介・ニュース・作品欄を表示不能にしません。
- SWR keyにはpath・query・source等、結果を変える値を含めます。
- APIのsnake_caseを内部型へ変換する処理はAPI境界へまとめます。公開GETに不要な認証情報やcookieを転送しません。
- 実API・CORSの確認と、fixtureやローカル検査の成功を区別して報告します。
