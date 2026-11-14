# 作業・検証・Git ガイド

Toybox の作業ガイドを公式サイト向けに移行しました。作業範囲と権限は [AGENTS.md](AGENTS.md) に従います。
npm / Git コマンドは `c3-official-website/` で実行します。

## 着手と変更

- 関連ガイド、既存変更、コードと設定を確認し、依頼された範囲を絞ります。
- `../web` の見た目・ルートと、Toybox 移植元の構成・実装を区別します。
- 文書の予定と実装済みの状態を混同しません。現在は package・React 雛形・CI が未導入です。
- package の変更は lockfile と一致させます。整形・自動 rename 後は無関係な差分と API 契約への影響を確認します。
- 回収原本を直接編集して運用データにしません。再取得は新しい snapshot、変換結果は `content/` のページ・記事別フォルダに本文・メタデータ・画像・動画をまとめます。

## 変更に応じた検証

| 変更 | 確認 |
| --- | --- |
| Markdown 文書のみ | リンク、コマンド、参照先、記載と現状の一致、空白エラー。frontend lint / build は必須ではない |
| TS / React / CSS | 雛形導入後は `npm run ci`。または `check:naming`・`lint`・`build`。同じ検証を重複実行しない |
| shared UI / Storybook | 既存 story を使い、必要な表示・操作を確認。自動テストは具体的な回帰を検出する最小限 |
| 広く使う UI / Storybook 共通設定 | 必要に応じて全 Storybook テストと build |
| ページ / ルーティング | 直接 URL、再読込、旧 ID、アンカー、末尾スラッシュ、404、戻る・進む |
| 外部取得 | loading、空、404、通信失敗、同じ route の再試行。失敗してもローカル本文が開けること |
| メニュー / dialog | click、Tab、Enter / Space、必要な矢印キー、Escape、外側 click、focus 復帰 |
| Markdown / content | sanitize、本文・メディア表示、ID重複・参照。新規フォルダの追加だけで一覧へ反映され、下書きの本文・画像が配信されないこと |
| UI 移植 / テーマ | ライトは同じ環境で現行サイトと比較。ダークは配色・操作を検証し、切替・選択保存・再読込・モバイル配置も確認 |
| 回収スクリプト / snapshot | API total と取得件数、blog 除外、ファイルのサイズ・SHA-256、manifest のエラー、URL 対応 |

命名・build・Storybook のコマンドと CI 範囲は [開発環境と CI](docs/development-and-ci.md) を参照します。
未導入の content 検査を、存在する npm script として記載・実行しません。
Python の構文確認で発生する `__pycache__` は生成物として扱います。

- まず変更に関係する検証に絞り、新しい変更・失敗・未解決の懸念がある場合だけ範囲を広げます。
- Storybook の browser test はローカルで実行し、通常 CI には追加しません。
- 回収元の404等は欠損として残し、検査成功に見せるため原文や記録を削除しません。
- 実 API、メール送信、動画再生、本番 OGP / DNS / TLS は静的検査や fixture 成功と分けて扱います。
- 全変更を `git diff --check` で確認します。未追跡ファイルはこのコマンドだけでは検査されないため、内容・リンク・空白を別途確認します。

## Git / issue

- GitHub への書き込みが許可された場合に、issue の assign・project status 変更・close 等を行います。未許可なら案を提示します。
- branch は英語で `接頭辞/#issue番号-kebab-caseの内容`。issue がない作業で番号を作りません。
- 接頭辞は `fix`、`feat`、`update`、`refactor`、`docs`、`test`、`chore` 等、変更内容に合わせます。
- commit message は日本語で具体的にし、例: `docs: 公式サイトの開発ガイドを移行`。
- commit は目的ごとの単位とし、依頼に含まれない既存変更を混ぜません。明示的な依頼がある場合だけ実行します。
- 必要なら commit の分割案と message の例を提示します。push / merge / 公開は許可された範囲に限ります。

## Backend issue

API 契約を確認したうえで、背景・現在の問題・変更してほしい内容を簡潔にまとめます。
実装方式は backend 担当者に委ね、接続に不可欠でない詳細設計や網羅的なテストケースを追加しません。
既存 issue を読み取りで確認し、重複を避けます。作成は外部書き込みの許可がある場合だけ行います。

## 完了報告

変更内容・主なファイル、実施した検証と結果、未実施と理由、残課題を簡潔に示します。
静的検証・fixture・ブラウザ・実サービス・本番確認を分け、未確認を成功扱いしません。
Storybook のケースを変更した場合は、追加・統合・削除した対象と検出する回帰を説明します。
変更がある場合は commit message の例を添えます。実際に commit していなければ明示します。
