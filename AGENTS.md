# C3 公式サイト開発ガイド

Vite + React + TypeScriptの公式サイトです。本文・素材は `content/`、コードは `src/` に配置します。CSSは各ページ・コンポーネントに同居する `index.module.css` に分割します。
ユーザーの指示を優先し、既存の許可を同じ範囲で重ねて求めません。

## 作業範囲

- npm・Git操作はこのプロジェクトのルートで実行し、package managerはnpmのみとします。
- 依頼と無関係なファイル・既存変更・公開API・props・URLや隣接プロジェクトを理由なく変更しません。
- 調査・ローカル編集・検証は依頼範囲で進め、外部サービスへの書き込み・公開は許可範囲で行います。
- commit・push・merge・デプロイは明示的な依頼がある場合だけ行います。
- 変更完了時は、AIが実際の差分に基づく日本語のコミットメッセージ案を最終回答に出力します。
- backendの不足をハードコードや不正確なモックで隠しません。

## 参照先

- コマンド・環境: [README.md](README.md)
- 構成・API: [docs/architecture.md](docs/architecture.md)
- 命名・実装・検証: [docs/FRONTEND_GUIDE.md](docs/FRONTEND_GUIDE.md)
- 本文・素材: [docs/content-structure.md](docs/content-structure.md)
- 公開設定: [docs/cloudflare-pages.md](docs/cloudflare-pages.md)

仕様は実コード・型・設定と照合します。ローカル検証と実サービス・公開環境の確認を区別して報告します。
