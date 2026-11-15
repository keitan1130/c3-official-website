# C3 公式サイト

Vite + React + TypeScriptで構築したComposite Computer Clubの公式サイトです。
本文と素材はページ・記事ごとの `content/` で管理し、ブログ・著者プロフィール・最新20件の掲載作品は外部APIから取得します。

公開サイト: <https://compositecomputer.club/>

## 開発

Node.js 26とnpmを使用します。このディレクトリで実行してください。

```bash
npm ci
cp .env.example .env
```

```bash
# .envに公開URL（VITE_SITE_URL）、Contentful配信設定、共通APIの接続先（VITE_API_BASE_URL）を設定
npm run dev
```

`VITE_*` はブラウザに公開されます。管理用トークンを設定しないでください。

## ニュースの追加

```bash
npm run new:news -- 2026-11-14-event-guide
```

生成された `index.json`・`body.md`・`assets/` を編集します。仮のサムネイル `assets/cover.png` も配置されるため、必要な画像へ差し替えてください。`content/news/` の全記事が一覧・詳細・ホームの重要なお知らせへ自動反映されます。公開・重要フラグや下書き機能はありません。完成した内容を `npm run ci` で確認してから公開します。

記事ID・日時・画像の条件とMarkdownの書き方は [記事・素材の管理](docs/content-structure.md) を参照してください。

## 検証とビルド

```bash
npm run ci
npm run test:pages
npm run preview:pages
npm run test:storybook
```

`preview:pages` は生成ファイルのルート・初期HTML・404を確認するローカル配信モデルです。Cloudflareでの検証とは別です。

サイト名・外部リンク・固定ページ名は `src/config/site.ts`、分野の名称・表示順は `src/config/communities.ts` で管理します。公開originは `.env` またはビルド環境の `VITE_SITE_URL` から取得し、HTML生成と画面遷移後のメタ情報は `src/util/pageMetadata.ts` で生成します。ルートとリンク先は利用箇所に直接記述し、Header・Footerの外部リンクの表示順は各コンポーネントで管理します。

## ガイド

- [現在の構成・API・データフロー](docs/architecture.md)
- [レビューと検証記録](docs/review.md)
- [作業範囲](AGENTS.md)
- [フロントエンド実装](docs/FRONTEND_GUIDE.md)
- [API・データ取得](docs/API_GUIDE.md)
- [作業・検証・Git](docs/WORKFLOW_GUIDE.md)
- [開発環境とCI](docs/development-and-ci.md)
- [命名規則](docs/naming-conventions.md)
- [記事・素材の管理](docs/content-structure.md)
- [Cloudflare Pages](docs/cloudflare-pages.md)
