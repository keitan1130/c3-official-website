# C3 公式サイト

Vite + React + TypeScriptで構築したComposite Computer Clubの公式サイトです。
紹介・ニュースは `content/`、ブログ・著者・掲載作品は外部APIから取得します。

## 開発

Node.js 26とnpmを使い、このディレクトリで実行します。

```bash
npm ci
cp .env.example .env
npm run dev
```

`.env` に公開URL・Contentful配信設定・API接続先を設定してください。
`VITE_*` はブラウザへ公開されるため、管理用トークンは設定しません。

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバー。コンテンツ変更も反映 |
| `npm run ci` | 静的検査・回帰テスト・型検査を含むビルドを一括実行 |
| `npm run check` / `npm run format` | Biome・命名検査 / Biomeの整形・自動修正 |
| `npm test` | VitestのNode用projectでコンテンツ・Pages・ビルドを検証 |
| `npm run build` | `dist/` にアプリ・静的HTML・OGP・sitemapを生成し、型検査 |
| `npm run preview` | ビルド済みの静的ルート・404をローカル確認 |
| `npm run test:e2e` | Playwrightで本文・メディア・ページ・API fixtureを検証 |
| `npm run storybook` | UIの開発 |
| `npm run build-storybook` / `npm run test:storybook` | Storybookの生成 / 操作テスト |
| `npm run new:news -- YYYY-MM-DD-topic` | ニュースを作成 |

ビルドの環境を分ける場合は `npm run build -- --mode staging` を使います。
コンテンツ生成はViteの起動時、配信用HTML生成はViteの書き出し後に実行されます。
CIは `npm run ci` を実行し、通常テスト・テストを含む型検査・ビルドを確認します。
`tests/` はTypeScriptで管理します。通常テストはVitestの `node`、UI操作は `storybook` project、E2EはPlaywright Testで実行します。
ブラウザ検証はローカルで `npm run build && npm run test:e2e` と `npm run test:storybook` を実行します。

## ガイド

- [構成とAPI](docs/architecture.md)
- [開発規約と検証](docs/FRONTEND_GUIDE.md)
- [記事・素材の管理](docs/content-structure.md)
- [Cloudflare Pages](docs/cloudflare-pages.md)
- [エージェントの作業範囲](AGENTS.md)
