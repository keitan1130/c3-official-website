# 命名規則

Toybox の `FRONTEND_GUIDE.md`、`check-naming-conventions.js`、`check-kebab-case.js` を基に移行しました。
既存コードの例外を新規・変更コードへ広げません。機械検査スクリプト自体はまだ未導入です。

## TypeScript / React

| 対象 | 規則 | 例 |
| --- | --- | --- |
| コンポーネント・ページ・コンポーネント用ディレクトリ | PascalCase | `NewsCard`、`AboutPage` |
| 本体 / 同居スタイル | `index.tsx` / `index.module.css` | `features/NewsCard/index.tsx` |
| 型・interface・enum | PascalCase | `NewsEntry` |
| Props 型 | `ComponentNameProps`。インラインにしない | `NewsCardProps` |
| 通常の変数・関数・ファイル | camelCase | `formatDateTime.ts` |
| custom hook | `use` + PascalCase | `useNewsFilter` |
| hook の引数型 / 戻り値型 | `UseFeatureParams` / `UseFeatureReturn` | `UseNewsFilterParams` / `UseNewsFilterReturn` |
| Zustand store | `use` + PascalCase + `Store` | `useSiteMenuStore` |
| store 状態型 / action | 役割を表す PascalCase / 操作を表す camelCase | `SiteMenuStore` / `setOpenState` |
| イベントハンドラ | `handle` + PascalCase | `handleMenuClose` |
| callback props / render prop | `on` / `render` + PascalCase | `onClose` / `renderItem` |
| 独自 boolean 変数・state・Props | `is` / `has` / `can` で始める | `isOpen`、`hasThumbnail` |
| HTML 標準属性 | 標準のまま | `disabled`、`autoFocus` |
| モジュールスコープの不変値 | UPPER_SNAKE_CASE | `SITE_TITLE` |
| API 由来 field | 契約どおり。内部名への変換は境界で明示 | `created_at` |

hook は feature の `hook/`、store は `store/` に置きます。`hooks/` は使いません。
hook の引数は原則オブジェクトとし、引数の有無にかかわらず戻り値型を明示します。
`App.tsx`、`index.ts`、`vite-env.d.ts`、`*.stories.tsx` 等には検査側の例外があります。
API 契約型の boolean 命名例外は、移植元スクリプトの `@apiContract` 判定と照合します。独自 Props の違反回避には使いません。

## CSS Modules

- class、CSS custom property、`data-*`、`aria-*` は kebab-case。
- CSS Modules の参照は `styles["news-card"]` のブラケット記法。`styles.newsCard` は使いません。
- コンポーネントの CSS は同居する `index.module.css`、グローバル定義は `src/index.css` / `src/App.css` に限定します。
- 分割する範囲・各ファイルの責務・動的 inline style の扱いは [実装ガイドの CSS 分割規則](../FRONTEND_GUIDE.md#css-の分割) に従います。
- 色は共通トークンを参照します。命名チェッカーだけで配色や全スタイル規則を検査できるとはみなしません。

## コンテンツとスクリプト

- `content/` のページ・記事フォルダとメディア名は、小文字英数字の kebab-case。例: `news/2026-11-14-event-guide/assets/venue.jpg`。
- 旧 Contentful ID は JSON の `id` にそのまま保持します。運用フォルダは内容が分かるslugにし、原本のID付きファイル名や画像URLは変更しません。
- 本文は `body.md`、メタデータは `index.json`、画像・動画等の素材は同居する `assets/` に統一します。
- `migration/snapshots/` の原本は回収時の構造を保持します。これらは `src/` の命名チェッカーの対象外です。
- Python の関数・変数は snake_case。既存の `scripts/export-public-content.py` を含め、言語と配置に応じた規則を使います。
- Git branch / commit の規則は [作業ガイド](../WORKFLOW_GUIDE.md) に従います。

## 検査コマンド（雛形導入後）

```bash
npm run check:naming
npm run fix:naming
node check-kebab-case.js
```

自動修正は差分を確認し、残件を手動で判断します。rename が API 契約や他ファイルの参照を壊していないか確認します。
スクリプトが機械判定できる範囲とガイド上の全規則は一致しません。検査成功だけで命名・設計レビューを省略しません。
