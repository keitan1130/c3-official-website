# C3 公式サイト開発ガイド

`../web` の公式サイトを Vite + React + TypeScript に置き換えるプロジェクトです。
現行 UI を基準とし、JP / EN位置にToyboxのライト / ダーク切替を追加します。ブログ以外の本文・メディアはfrontend内でページ・記事ごとの `assets/` とともに管理します。
コードのファイル構成は Toybox frontend と同じ `pages/`・`features/`・`shared/`・`util/` の責務分割に揃えます。
CSS は各ページ・コンポーネントに同居する `index.module.css` に分割します。詳細は `FRONTEND_GUIDE.md` を参照します。
ユーザーの指示を優先し、既存の許可を同じ範囲で重ねて求めません。

## 作業範囲

- 主な変更先はこの `c3-official-website/` です。npm と Git 操作もこのディレクトリで実行します。
- `../web` は UI・URL・表示仕様の比較元、`../toybox-back` と `../toybox-server` は API 契約の確認元です。明示的な依頼がなければ変更しません。
- `/home/keitan/workspace/toybox/frontend` は構成・package・Markdown 表示実装の移植元です。移植元自体は変更しません。
- 依頼に関係しないファイル、既存変更、公開 API・props・URL を理由なく変更しません。
- package manager は npm のみです。Yarn / pnpm / Bun は使用しません。
- 公開データの回収原本 `migration/snapshots/` は上書き編集しません。再取得は新しい出力先に保存し、運用用データへの変換と分けます。

## 権限と外部操作

- 調査・ローカル編集・検証は依頼された範囲で進めます。
- Figma / GitHub の読み取りは事前確認なしで行えます。作成・編集・削除・公開などの外部書き込みはユーザーが許可した範囲で行い、未許可なら実行前に確認します。
- `git commit` はユーザーが明示的に依頼した場合だけ実行します。push・merge・デプロイも許可範囲を確認します。
- backend の不足を frontend のハードコードや不正確なモックで隠しません。必要なら変更案・issue 案を作ります。

## ガイドの入口

関係するガイドだけを読みます。詳細規則は下記を正本とし、ここに重複させません。

| 作業 | 参照先 |
| --- | --- |
| React / TypeScript、配置、UI、Markdown、状態管理 | [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) |
| コード・CSS・コンテンツの命名 | [命名規則](docs/naming-conventions.md) |
| 開発環境、scripts、CI、hooks、設定移植 | [開発環境と CI](docs/development-and-ci.md) |
| API・データ取得元の調査 | [API_GUIDE.md](API_GUIDE.md) |
| 変更・検証・Git・issue・完了報告 | [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) |
| 移植するページと方針 | [リプレイス計画](docs/replacement-plan.md)、[ページ台帳](docs/page-inventory.md) |
| 決定事項・作品管理・公開環境 | [確定事項](docs/decisions.md)、[Cloudflare Pages](docs/cloudflare-pages.md) |
| 実装順序・段階の完了条件・公開切替 | [実装ロードマップ](docs/implementation-roadmap.md) |
| 本文と画像の追加・移行 | [コンテンツ構成](docs/content-structure.md)、[回収結果](docs/content-recovery.md) |

文書だけの変更では対象文書と `WORKFLOW_GUIDE.md` を参照します。

## 現状と判断基準

2026-11-14 に開発基盤を導入済み。進捗と確認範囲は `docs/implementation-results.md` を参照してください。
導入後のコマンドを実行済み・設定済みとして報告しません。
仕様は実コード・型・設定と照合し、ガイドと不一致があれば報告します。既存コードの逸脱を新規コードへ広げません。
UI の比較元は Toybox の画面ではなく、現行公式サイトと `../web` です。
