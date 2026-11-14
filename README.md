# C3 official website replacement

`../web`（Nuxt/Vue）を Vite + React + TypeScript にリプレイスするプロジェクトです。
現行公式サイトのUIを基準に、JP / EN位置にToyboxのライト / ダーク切替を追加します。ブログ以外の公式コンテンツはfrontend内で管理し、素材は各ページ・記事の `assets/` にまとめます。
コードのファイル構成は Toybox frontend に揃え、CSS はページ・コンポーネントごとの CSS Modules に分割します。

実装を開始しました。[段階別の実装結果](docs/implementation-results.md) に実施内容・検証範囲を記録します。

## 開発ガイド

Toybox のガイドと実設定を確認し、公式サイト向けに移行しています。
package・開発設定・CI定義は導入済みです。npmコマンドはこのディレクトリで実行します。

- [AGENTS.md（作業範囲とガイドの入口）](AGENTS.md)
- [フロントエンド実装ガイド](FRONTEND_GUIDE.md)
- [API・データ取得ガイド](API_GUIDE.md)
- [作業・検証・Git ガイド](WORKFLOW_GUIDE.md)
- [開発環境と CI](docs/development-and-ci.md)
- [命名規則](docs/naming-conventions.md)

## リプレイス資料

- [回答済みの確定事項・作品の管理規則](docs/decisions.md)
- [Cloudflare Pages の配信方針](docs/cloudflare-pages.md)

- [リプレイス方針](docs/replacement-plan.md)
- [実装順序・段階ごとの完了条件・公開切替](docs/implementation-roadmap.md)
- [ページの維持・対象外・要判断](docs/page-inventory.md)
- [ページ・記事ごとの本文・画像管理とニュース追加手順](docs/content-structure.md)
- [回収結果・完全性と未確認事項](docs/content-recovery.md)
- [取得データの明細](migration/snapshots/2026-11-14/manifest.json)

公開サイト: <https://compositecomputer.club/>

## 再取得

Python 3 の標準ライブラリだけを使います。ネットワーク接続が必要です。

```bash
python3 scripts/export-public-content.py --output migration/snapshots/YYYY-MM-DD
```

`migration/snapshots/` は大量の回収原本を含むためGit管理対象外です。ファイルはローカルに保持し、別環境で必要な場合は再取得します。運用用の `content/` とその `assets/` はGit管理します。

既存の出力ディレクトリには上書きしません。同日再取得は日付の後ろに連番を付けてください。
公開 HTML が参照する JavaScript から配信設定を読み、Contentful Delivery API の公開データを取得します。
トークンや JavaScript バンドルは保存せず、ブログ本文も取得しません。
失敗は `manifest.json` の `errors` に記録し、終了コードを 1 にします。
取得中に停止した場合や manifest がない場合は未完了です。別の出力先で再実行してください。
