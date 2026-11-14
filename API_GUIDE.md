# API・データ取得ガイド

Toybox の「契約を調べてから接続する」方針を公式サイト用に移行しました。
作業範囲は [AGENTS.md](AGENTS.md)、検証・issue は [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md) を参照します。
以下の `src/` 内の境界は雛形生成後の予定です。

## データ境界

- 紹介・分野・お知らせはローカル `content/` を正とし、`src/util/contentRepository.ts` に読込・型変換・参照解決をまとめます。
- 公開済み原本は `migration/snapshots/`。公開 frontend へ原本全体を配信せず、採用した文書・メディアだけを運用先へ移します。
- ブログは Contentful＋Toybox の取得を継続し、本文を Toybox の MarkdownPreview で表示します。掲載作品はローカルファイル管理へ移行し、実行時の `/works` 取得をなくします。
- 紹介・分野・お知らせ・掲載作品の表示には Contentful 設定を必須にしません。ブログ取得には公開用の Contentful 配信設定が必要です。管理用 token は frontend に含めません。

## 既存 API の調査順

1. `../web/pages/` と `../web/utils/toybox.js` で、旧公式サイトが使う path・query・表示項目を確認。
2. `../toybox-back/docs/swagger.json` と `../toybox-back/internal/infrastructure/router/router.go` で Go の公開契約・実ルートを確認。
3. Go の `internal/interface/controller/`、`schema/`、対応テスト、必要なら usecase / entity を確認。
4. 互換プロキシなら `internal/infrastructure/external/proxy/` と legacy proxy controller を確認。
5. Python 側は `../toybox-server/main.py`、`routers/`、`blogs/routers/`、`schemas/` と実処理を確認。

このプロジェクトの root からの検索例:

```bash
rg -n 'works|blogs' ../web/pages ../web/utils
rg -n 'works|blogs' ../toybox-back/docs/swagger.json ../toybox-back/internal/infrastructure/router/router.go
rg -n 'works|blogs|prefix' ../toybox-server/main.py ../toybox-server/routers ../toybox-server/blogs/routers
```

Go の `/works` と旧 `/api/v1/works` のレスポンスを同一視しません。ブログは Contentful / Toybox の source を区別し、同一 ID による衝突を避けます。
本番の接続先の背後でどの backend が動くかは、ローカルのコードだけでは確定できません。

## frontend の通信実装

- origin は環境設定を扱う共通 utility に集約し、feature に本番 URL を直書きしません。
- GET と status 付きエラー処理等、必要な範囲で Toybox の共通 request 実装を再利用します。認証 Provider・refresh 処理を一括で持ち込みません。
- API の snake_case は契約どおり受け、内部の camelCase 型へ変換するなら API 境界で明示します。
- response のない成功で `response.json()` を呼ばず、HTTP失敗・不正なデータ・正常な空結果を区別します。
- 独立したブログ通信は順序依存がなければ並行化し、取得失敗を静的紹介や掲載作品まで伝播させません。
- JSON / FormData の契約、query、ページング、status、CORS を実 API と照合します。FormData の Content-Type を手動指定しません。
- 認証や cookie が必要と判明した場合だけ、その契約・CORS・credentials・cache の分離を設計します。公開 GET に不要な token / cookie を転送しません。
- 管理用API token や秘密情報をログ、Storybook、fixture、`VITE_*` に保存しません。ブログ取得用の公開可能なDelivery設定とは区別します。公開用環境変数は秘密を保持できません。

## 著者と掲載作品

Contentful の公開 `user` 全36名は回収済みで、プロフィールはContentfulから都度取得して旧 `/author/:id` を維持します。
著者別ブログ一覧は Contentful の `fields.user.sys.id` で取得します。
Toyboxブログ内の `user.id` を Contentful の `user` ID として検索しません。source を保持し、既存の Toybox 著者リンクの扱いを実装時に照合します。
掲載作品の初期選定に旧APIを一度参照する場合でも、公開アプリの作品欄はローカルデータを読みます。手動管理用の構成は [コンテンツ構成](docs/content-structure.md) に従います。

## お問い合わせ

使用していないため、フォーム・`/contact/thanks`・関連導線を新版から削除します。
送信API・メールサービスは導入せず、旧URLへの直接アクセスは404として扱います。

契約と実装の不一致、CORS 不足、未設定の接続先は明示して報告し、不正確なモックで解決済みにしません。
