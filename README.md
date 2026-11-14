# C3 公式サイト

Vite + React + TypeScriptで構築したComposite Computer Clubの公式サイトです。
本文と素材はページ・記事ごとの `content/` で管理し、ブログ・著者プロフィール・最新20件の掲載作品は外部APIから取得します。
公開サイト: <https://compositecomputer.club/>

## 開発

Node.js 26とnpmを使用します。このディレクトリで実行してください。

```bash
npm ci
cp .env.sample .env.local
# .env.localにContentful配信設定とブログAPIの接続先を設定
npm run dev
```

`VITE_*` はブラウザに公開されます。管理用トークンを設定しないでください。

## ニュースの追加

```bash
npm run new:news -- 2026-11-14-event-guide
```

生成された `index.json`・`body.md`・`assets/` を編集します。サムネイルを指定して `isPublished` を `true` にすると、一覧と詳細へ自動反映されます。

## 検証とビルド

```bash
npm run ci
npm run test:pages
npm run preview:pages
npm run test:storybook
```

`preview:pages` は生成ファイルのルート・初期HTML・404を確認するローカル配信モデルです。Cloudflareでの検証とは別です。

## ガイド

- [作業範囲](AGENTS.md)
- [フロントエンド実装](docs/FRONTEND_GUIDE.md)
- [API・データ取得](docs/API_GUIDE.md)
- [作業・検証・Git](docs/WORKFLOW_GUIDE.md)
- [開発環境とCI](docs/development-and-ci.md)
- [命名規則](docs/naming-conventions.md)
- [記事・素材の管理](docs/content-structure.md)
- [Cloudflare Pages](docs/cloudflare-pages.md)
