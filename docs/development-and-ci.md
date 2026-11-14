# 開発環境とCI

## 環境と設定

Node.jsは `.nvmrc` とpackageのenginesに合わせた26系、package managerはnpmです。依存バージョンは `package.json` と `package-lock.json` を正とし、通常の導入は `npm ci` を使います。

- TypeScript: strict・未使用検査・bundler解決・React JSX、`@/` は `src/`。
- Vite: Reactとローカルコンテンツ監視。編集時にコンテンツ参照を再生成します。
- Biome: `src/` と対象設定ファイルの整形・静的検査。
- CSS Modules: ページ・コンポーネントごとに配置し、色トークンは `src/index.css`。
- Hygen: `_templates/generator/` を使ってUI・feature・componentを生成します。

## コマンド

```bash
npm ci
npm run dev
npm run new:news -- 2026-11-14-event-guide
npm run check:naming
npm run format
npm run ci
npm run test:pages
npm run preview:pages
npm run storybook
npm run test:storybook
npm run build-storybook
```

`npm run ci` はコンテンツ参照の生成・検査、コンテンツテスト、命名検査、Biome、TypeScript、ViteビルドとPages用成果物の生成を実行します。
`predev`・`prebuild`・`prestorybook`・`prebuild-storybook` でもコンテンツ参照を生成します。生成された `src/generated/` と `dist/` は手動編集しません。

## GitHub Actions

`.github/workflows/ci.yaml` は `develop`・`main` 向けのPRとpushで実行します。Nodeを `.nvmrc` から選び、`npm ci` と `npm run ci` を実行します。Storybookのブラウザ検査とデプロイは含みません。
GitHub上の実行確認とローカルでのCIコマンドの成功は区別します。

## Hooks

Huskyのpre-commitでlint-stagedを実行し、`src/**/*.{js,jsx,ts,tsx,css,json,jsonc}` にBiomeを適用します。Markdown・content・画像・命名・buildの検査はhookに含まれません。

## ブラウザ検査

StorybookはVitestとPlaywright Chromiumを使います。表示例は `!test`、操作検査は `test` tag、a11yは `error` に設定します。Chromiumがない場合は `npx playwright install chromium` で導入します。

開発サーバー起動中に `npm run test:browser`、`node scripts/home-smoke.mjs`、`node scripts/blog-smoke.mjs` でページを検査できます。後者2件は実ブログAPIの接続が必要です。CORS保留時の `TEST_ALLOW_TOYBOX_CORS=1` は部分失敗を許容するため、両取得元の接続成功を証明しません。

公開設定は [Cloudflare Pages](cloudflare-pages.md)、検証の選び方は [作業ガイド](WORKFLOW_GUIDE.md) を参照します。

作品欄は開発サーバー起動中に `node scripts/works-smoke.mjs` で検証します。作品APIはfixtureに置き換え、ホーム／Aboutの20件表示・取得パラメータ・読込中・0件・失敗と再試行を検査します。実API・CORSの確認とは区別します。`TEST_BASE_URL` で開発サーバーのURLを指定できます。
