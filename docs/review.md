# 構成レビューと検証記録

対象は `c3-official-website/` の現在のローカルコンテンツ生成、ルーティング、API repository、記事・Markdown表示、配信用成果物です。構成の説明は [architecture.md](architecture.md) を参照してください。隣接リポジトリ・外部サービス・公開環境の変更は含みません。

## 現在の仕様

- ニュースは `publishedDate` に日付（YYYY-MM-DD）だけを保持し、作成日時・更新日時・著者IDを持たない。全記事を公開し、ホームのお知らせには最新5件を表示する。下書きプレビューは設けない。
- ニュースの読込・検証は `local-content.mjs` に集約。サイト設定・固定ページ名・外部リンクは `src/config/site.ts`、分野定義は `src/config/communities.ts` に集約し、ニュースのタグ参照は廃止。本文・画像・動画は明示した変換関数で生成する。
- ローカル素材は記事・ページのフォルダ内で相対参照する。`assets/` は標準配置であり必須条件ではない。Markdown・HTMLのURL部分を構文解析して変換し、コード・数式・その他の書式を保持する。素材は `?url&no-inline` でファイル出力し、sanitizeは維持する。
- ブログ一覧は全件取得と既存のSWR共有を維持する。Contentful一覧は本文を取得しない。Toyboxは既存の本文を含む全件取得を維持し、表示用概要だけを200文字に制限する。追加読込UIは設けない。
- 一覧型と詳細型を分離し、表示部品で取得元ごとのタグ・著者変換を行わない。Contentful通信は共通client、著者ページと著者バッジは同じ著者一覧キャッシュを使う。

## 検証

| 確認 | 結果と範囲 |
| --- | --- |
| `npm run ci` | 成功。コンテンツ生成、回帰テスト、命名、Biome、TypeScript、Vite、Pages用成果物生成 |
| `npm run test:content` | 5件成功。全ニュースの自動検出、必須値・ID・投稿日、素材の存在と参照範囲、共通接頭辞、投稿日・ID順、分野定義、Pages生成を確認。任意の素材配置、括弧・空白・クエリ・HTML属性・参照形式、コード例・表・複数行リンク・数式の保持とシンボリックリンクによる範囲外参照拒否をfixtureで確認 |
| `npm run test:content:browser` | 成功。本番ビルドの全22本文を390px / 1440pxで表示し、本文画像150回・分野動画metadata10回の実読込、横溢れ・実行時エラーなしを確認。4 KiB未満の2DCG画像を含む。作品APIはfixture |
| `npm run test:pages` | 成功。現在の公開ルート集合、初期OGP・canonical、ローカルOGP画像、404 noindexを生成物で確認 |
| `TEST_BASE_URL=... npm run test:review` | 成功。APIはfixture。IDのみのURL・UUIDによる取得先判定・ブログと著者別一覧の全件表示・Contentful本文の除外・取得障害と404の区別、robots解除、カルーセルkey、メニューのスクロール固定・位置復元・Escape後focus復帰 |
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
