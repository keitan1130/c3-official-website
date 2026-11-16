# 開発規約と検証

コマンドは [README](../README.md)、作業権限は [AGENTS.md](../AGENTS.md) を参照します。

## 実装と命名

- ページはfeatureを組み合わせ、汎用部品は `shared/ui` に置きます。追加前に既存部品を探します。
- コンポーネントはPascalCaseのフォルダに `index.tsx` と `index.module.css` を同居させます。
- 通常の変数・関数・TSファイルはcamelCase、型はPascalCase、モジュール定数はUPPER_SNAKE_CASE。
- Props型は `ComponentNameProps`。callback propは `onXxx`、処理関数は `handleXxx`、booleanは `is`・`has`・`can` で始めます。HTML標準属性・API契約名は保持します。
- custom hookはfeatureの `hook/` に置き、`useXxx` と命名します。引数は原則オブジェクト、戻り値型を明示します。
- CSS class・custom property・data/aria属性はkebab-case。参照は `styles["class-name"]`。
- CSSは所有する部品に閉じ、共通トークン・resetだけを `src/index.css` に置きます。静的な見た目はCSS Modulesで定義します。
- `strict` と未使用検査を維持し、`any`・不要な型アサーションを避けます。安定IDをkeyに使います。
- `MarkdownPreview` のsanitizeを維持し、許可要素を増やす場合は安全性と表示を検証します。
- テーマは `src/util/theme.ts`、サイト設定は `src/config/` を参照します。
- 正常な空データ・404・通信失敗を区別し、再検証失敗時も取得済みデータを保持します。
- 非同期結果を画面遷移後に反映せず、再試行時に無関係なcacheを削除しません。
- button・link・alt等を適切に使い、menu/dialogのキーボード操作・Escape・focus復帰を維持します。

`npm run check` はコード・設定・スクリプト・テストをBiomeで確認し、命名も検査します。
命名の自動修正が必要な場合は `node scripts/checks/naming.js --fix`、UI雛形は `npx hygen generator ui`（`feature`・`component` も可）を使います。

## 検証

- コード変更後は `npm run ci`。文書だけなら参照先・実装との一致・空白エラーを確認します。
- ローカル本文・素材の変更は `npm run build && npm run test:e2e` で全本文のPC・モバイル表示を確認します。
- UI変更は既存Storybookの代表例・操作を確認し、必要な回帰だけを追加します。操作テストには `test` tagを使います。
- ルート変更は直接アクセス・再読込・404・戻る/進む・アンカー、テーマ変更は両テーマと保存・再読込を確認します。
- 通常テストは `tests/*.test.ts`、fixture・ヘルパー・E2Eも `tsconfig.test.json` の型検査対象です。
- E2Eは `npm run test:e2e` で実行します。開発・previewサーバーは自動起動・終了し、API fixtureと全本文を検査します。事前に `npm run build` が必要です。
- Nodeのimport hookによる生成モジュール検証は、Vitestから独立したNodeプロセスで行います。
- ブラウザテストにはPlaywright Chromiumが必要です。未導入時は `npx playwright install chromium`。
- `git diff --check` と未追跡ファイルを確認し、ローカル・fixture・実API・公開環境を区別して報告します。

実APIの確認は既定でスキップします。実API用Viteを別途起動し、次のように明示指定します。

```bash
TEST_LIVE_API=1 TEST_BASE_URL=http://127.0.0.1:5173 npm run test:e2e -- --project live
```

Playwrightの失敗時は `test-results/` にスクリーンショット・traceを保存します。

## Git

commitは明示依頼時だけ行い、目的ごとに分けます。メッセージは `fix: 本文の画像参照を修正` のように日本語で具体的にします。
branchは英語の `接頭辞/#issue番号-kebab-case`。issueがなければ番号を作りません。
変更内容・検証・未確認事項を簡潔に報告します。
