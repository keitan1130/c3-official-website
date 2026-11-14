# 構成レビューと検証記録

対象は `c3-official-website/` の現在のローカルコンテンツ生成、ルーティング、API repository、記事・Markdown表示、配信用成果物です。構成の説明は [architecture.md](architecture.md) を参照してください。隣接リポジトリ・外部サービス・公開環境の変更は含みません。

## 修正した指摘

| 優先度 | 問題と再現条件 | 修正箇所・結果 |
| --- | --- | --- |
| P2 | メニュー／画像拡大がスクロール固定属性を設定しても、その属性を使うCSSがなく背景が固定されない | `src/index.css` に `data-scroll-locked` と `--page-scroll-top` に対応するbody固定を追加。閉じる際の既存の位置復元と組み合わせる |
| P2 | Contentfulと外部ブログが同じIDを返すと、カルーセルのReact keyが衝突し、関連記事から別取得元の記事まで除外される | `src/util/entryIdentity.ts` でsourceとIDの識別を共通化し、Carousel・EntryDetail・BlogPageへ適用 |
| P2 | source未指定のブログ詳細では、Contentful障害時に外部ブログを確認せずエラーになる | `src/util/blogRepository.ts` で外部ブログも確認。source明示時はその取得元を維持し、一方が障害・他方が404の場合は通信エラーとして扱う |
| P2 | 404から正常ページへSPA内遷移すると、404側のrobots noindexが残る。逆に、クライアント内で開いた404には指定されない | `PageMeta` に `isNoIndex` を追加し、NotFoundPageで有効化。正常ページでは解除する |
| P2 | `photo.png`と`photo.png.webp`のような素材名を本文に並べると、短い参照が先に置換され、長い参照のURLが壊れる | `scripts/prepare-content.mjs` で長い参照から変換。失敗するテストで再現後、生成された本文loaderを実行して確認 |
| P2 | お知らせの日時を文字列で並べるため、タイムゾーン表記が異なると新旧が逆転する | 同スクリプトで `Date.parse` による時刻比較へ変更。同時刻は既存のID順 |
| P2 | 新しい分野を追加してsite側の表示順へ追記し忘れても検査を通り、未設定の分野が先頭へ並ぶ | 同スクリプトで表示順と分野一覧の件数も照合。既存の重複・未知slug検査と合わせて過不足を検出 |
| P2 | 静的ページ数25件・お知らせ16件がテストへ固定され、公開記事の追加や下書きで誤検出する | `verify-pages.mjs` はcontentから期待ルート集合を作り、重複・不足・余分なルートを照合。`browser-smoke.mjs` も公開記事だけを件数・詳細確認の対象にする |

P2は通常の不具合修正として扱う項目です。対応箇所の改善を示すもので、全入力・全ブラウザ・全API契約を網羅した保証ではありません。

## 検証

| 確認 | 結果と範囲 |
| --- | --- |
| `npm run ci` | 成功。コンテンツ生成、回帰テスト、命名、Biome、TypeScript、Vite、Pages用成果物生成 |
| `npm run test:content` | 成功。下書きの非公開、画像参照切れ、共通接頭辞の素材名、タイムゾーン混在の並び、分野表示順の追記漏れ、公開コンテンツ数の変化をfixtureで確認 |
| `npm run test:pages` | 成功。現在の公開ルート集合、初期OGP・canonical、ローカルOGP画像、404 noindexを生成物で確認 |
| `TEST_BASE_URL=... npm run test:review` | 成功。APIはfixture。ブログの取得元衝突・詳細fallback・取得障害と404の区別、robots解除、カルーセルkey、メニューのスクロール固定・位置復元・Escape後focus復帰 |
| `TEST_BASE_URL=... node scripts/browser-smoke.mjs 4` | 成功。390px / 1440pxでAboutと全5分野、横はみ出し、動画metadata読込、旧分野IDの404、静的ページのContentful非依存を確認 |
| `TEST_BASE_URL=... node scripts/works-smoke.mjs` | 成功。APIはfixture。ホーム／Aboutの390px / 1440px、20件制限・取得query・認証情報の非送信・読込中・空・HTTP／schema失敗・再試行 |
| `npm run test:storybook` | 2ファイル・8テスト成功。既存のMarkdown操作・画像拡大・メニュー・テーマ等。更新後の依存関係で生成キャッシュなしでも成功 |
| `git diff --check` | 成功。新規文書の相対リンクも参照先の存在を確認 |

Storybookの初回実行では依存最適化による再読み込みが発生しました。別作業でStorybookが10.6.7へ更新された後、追加の `optimizeDeps.include` を使わない既存形式でキャッシュなしのテストを確認しています。バージョン更新とStorybook previewの修正は、このレビュー修正とは分けて扱います。

実行環境の制限により、ローカルのVite設定読込・ブラウザ起動・子プロセスを伴う検証は制限外で実行しました。テストのために本番API設定や接続先を変更していません。

## 残事項・今回の検証外

- Contentful・Go backend・外部ブログの実通信と、公開originのCORSはこのレビューでは検証していません。fixtureの成功を実API接続の証明には使いません。
- Cloudflare Pagesへのデプロイ、GitHub上のCI、カスタムドメイン・DNS・TLS・実機Safariは未確認です。
- ブログ詳細／著者の個別初期OGP・動的sitemap・未知IDのHTTP404は未実装です。SPAの画面404とHTTPステータスを分けて扱います。
- APIレスポンスの型定義はありますが、全フィールドを実行時に検査するschema validatorはありません。作品APIは配列と各公開作品の必要フィールド、Contentfulはコレクションの形とページング進捗などを検査しています。
- Markdown描画・シンタックスハイライト等を含む約1.3MBのJSチャンクにビルド警告があります。表示不具合の検出とは別に、必要なら初回表示・遅延読込を計測して分割を検討します。
- `ci`と`prebuild`のコンテンツ生成は重複しています。どちらからも生成物なしで開始できる現在の動作を維持しています。
