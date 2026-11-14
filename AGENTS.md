# C3 公式サイト開発ガイド

Vite + React + TypeScriptの公式サイトです。本文・素材は `content/`、コードは `src/` に配置します。CSSは各ページ・コンポーネントに同居する `index.module.css` に分割します。
ユーザーの指示を優先し、既存の許可を同じ範囲で重ねて求めません。

## 作業範囲と権限

- npmとGit操作はこのプロジェクトのルートで実行します。package managerはnpmのみです。
- 依頼に関係しないファイル・既存変更・公開API・props・URLを理由なく変更しません。隣接プロジェクトは明示的な依頼がなければ変更しません。
- 調査・ローカル編集・検証は依頼された範囲で進めます。外部サービスへの書き込み・公開は許可された範囲で行います。
- commitは明示的な依頼がある場合だけ実行します。push・merge・デプロイも許可範囲を確認します。
- backendの不足をハードコードや不正確なモックで隠しません。

## ガイドの入口

| 作業 | 参照先 |
| --- | --- |
| 現在の構成・API・データフロー | [構成説明](docs/architecture.md) |
| React・TypeScript・CSS・Markdown・テーマ | [FRONTEND_GUIDE.md](docs/FRONTEND_GUIDE.md) |
| 命名 | [命名規則](docs/naming-conventions.md) |
| 環境・scripts・CI・hooks | [開発環境とCI](docs/development-and-ci.md) |
| API・データ取得 | [API_GUIDE.md](docs/API_GUIDE.md) |
| 検証・Git・報告 | [WORKFLOW_GUIDE.md](docs/WORKFLOW_GUIDE.md) |
| 記事・写真・動画の管理 | [コンテンツ構成](docs/content-structure.md) |
| 公開設定と制約 | [Cloudflare Pages](docs/cloudflare-pages.md) |

仕様は実コード・型・設定と照合します。ローカルの検証成功と実サービス・公開環境の確認は区別して報告します。
