# 開発環境と CI

2026-11-14 に `/home/keitan/workspace/toybox/frontend` の実設定と親ディレクトリの開発ガイドを確認して移行した方針です。
**このプロジェクトにはまだ package・Node 設定・GitHub Actions・Husky を導入していません。以下の npm コマンドは雛形導入後に使用します。**

## 開発環境

| 項目 | Toybox で確認した設定 / 継承する方針 |
| --- | --- |
| Node.js | `.nvmrc` は `26`、package の engines は `26.x` |
| package manager | npm のみ。`.npmrc` は `engine-strict=true` |
| lockfile | `package-lock.json`。通常の環境構築は `npm ci` |
| アプリ | React / React DOM、TypeScript、Vite、React Router |
| 整形・静的検査 | Biome、独自 TS / React / CSS 命名チェッカー |
| スタイル | CSS Modules。色トークンをグローバル CSS に集約 |
| UI 検証 | Storybook、Vitest browser project、Playwright Chromium |
| commit 前処理 | Husky → lint-staged → 対象ファイルの Biome check --write |
| 生成補助 | Hygen と `_templates/generator/` の ui / feature / component |

npm の特定バージョンは移植元 package では固定されていません。Node に対応する npm を使い、別途固定するなら CI とローカルを揃えます。
依存バージョンの正本は移植する package / lockfile であり、この文書の記述だけで package を再作成しません。

## 雛形生成時に移植するファイル

| ファイル | 目的 / 調整 |
| --- | --- |
| `package.json` / `package-lock.json` | 同時にコピー。name と scripts を調整し、lockfile も一致させる |
| `.nvmrc` / `.npmrc` | Node と engines の統一 |
| `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json` | strict、未使用検査、bundler 解決、React JSX、`@/*` alias |
| `vite.config.ts` | React plugin、`@` → `src` alias、Storybook の Vitest project |
| `biome.json` | 2スペース、ダブルクォート、import 整理。CSS の lint 無効と整形の扱いも確認 |
| `check-naming-conventions.js` / `check-kebab-case.js` | 命名検査。前者は `typescript/unstable/ast` / `unstable/sync` を使うため TS の更新と一緒に動作確認 |
| `.husky/pre-commit` と package の `prepare` / `lint-staged` | hook 起動と対象拡張子 |
| `.github/workflows/ci.yaml` | 下記 CI 方針 |
| `.storybook/` / `vitest.shims.d.ts` | CSS・theme import 等の移植先参照を解決。Toyboxのテーマ管理を再利用し、公式サイト用のライト / ダーク配色を使う |
| `_templates/` | generator scripts を残す場合に一緒に移植 |

`package` だけ持ってきて、scripts の参照先や MarkdownPreview の依存部品を欠かさないようにします。
認証・画像編集・投稿等の不要依存の整理は、初回コピーと区別して必要性を確認します。
環境変数のサンプルは公式サイト向けに作成し、実トークンや本番固有値をコピーしません。`VITE_*` は配信コードに公開される前提です。

## ローカルコマンド（導入後）

作業ディレクトリは `c3-official-website/` です。

```bash
# nvm を利用している場合
nvm install
nvm use

npm ci
npm run dev               # 通常 http://localhost:5173
npm run check:naming
npm run fix:naming        # 実行後に差分と残件を確認
npm run lint
npm run format            # 実行後に差分を確認
npm run build             # tsc -b && vite build
npm run preview
npm run ci
npm run storybook         # 通常 http://localhost:6006
npm run build-storybook
npm run test:storybook
```

`npm run ci` は命名検査 → `src` と対象設定ファイルの Biome check → TypeScript / Vite build です。
Toybox では Biome の対象設定は `biome.json`、`package.json`、3つの tsconfig です。全ファイルが自動で対象になるわけではありません。
Storybook 操作テスト・content 参照チェック・原本のハッシュ検査はこのコマンドに含まれていません。

## GitHub Actions の CI 方針

移植元 `.github/workflows/ci.yaml` の実設定:

- `develop` / `main` 宛て pull request と、両ブランチへの push で実行。
- `permissions: contents: read`。
- runner は `ubuntu-latest`、timeout は15分。
- `actions/checkout@v7` → `actions/setup-node@v7`。
- Node は `.nvmrc` を参照。npm cache は `package-lock.json` を参照。
- `npm ci` → `npm run ci` を実行。
- Storybook の browser test とデプロイは含まれない。

このリポジトリでも同じ構成を基準にします。Actions のバージョンは上記の確認時点の値であり、導入時に利用可能性を確認します。
workflow はこの Git リポジトリの `.github/workflows/` に置きます。実際に親ディレクトリをリポジトリの root とする構成に変える場合は、`working-directory` と cache path をその構成に合わせます。
CI の導入と本番デプロイは別作業です。公開先は Cloudflare Pages に確定し、[配信方針](cloudflare-pages.md) に従います。実際の自動公開設定や本番 secrets はまだ移行していません。

## Husky / lint-staged

移植元の `prepare` は `husky`、pre-commit は `npx lint-staged` です。
対象は `./src/**/*.{js,jsx,ts,tsx,css,json,jsonc}` で、`npx biome check --write` を実行します。
Markdown、`content/`、画像、snapshot の完全性はこの hook の検査対象外です。
命名検査と build も hook には含まれないため、変更に応じて [作業ガイド](../WORKFLOW_GUIDE.md) の検証を実行します。

## Storybook のブラウザテスト

Toybox と同じくローカルで必要な範囲だけ実行し、GitHub Actions の通常 CI には加えません。
Chromium / 必要な OS ライブラリがない場合にだけ、次を実行します。

```bash
npx playwright install --with-deps chromium
npm run test:storybook -- src/features/MarkdownPreview/MarkdownPreview.stories.tsx
```

対象ファイルと scripts の導入後に使用します。共通設定や広く使う UI を変更した場合は全対象を実行します。
表示 story は共通 `!test`、主要な操作 story は `test` tag、a11y は `error` を移植元の基準とします。

## 移行元と調整点

- `/home/keitan/workspace/toybox/AGENTS.md` / `FRONTEND_GUIDE.md` / `API_GUIDE.md` / `WORKFLOW_GUIDE.md` を公式サイト向けに移行。
- 上記 frontend の package、Node、Biome、TS、Vite、workflow、hooks、Storybook、命名チェッカーを実物と照合。
- 親ガイドの「npm / Git は frontend で実行」を「このプロジェクト root で実行」に変更。
- Toybox の認証・投稿・作品 visibility 契約を必須規則から除外。ローカル content と旧 URL・UI の維持を追加。
- 移植元 README の Jest 記載は現行 `test:storybook` の Vitest 構成と異なるため、そのまま継承しない。
- 移植元ガイドの Markdown 機能説明には現行実装との差があるため、`MarkdownPreview` の実装を確認する方針に変更。
