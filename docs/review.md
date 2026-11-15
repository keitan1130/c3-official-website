# 構成レビューと検証記録

対象は `c3-official-website/` の現在のローカルコンテンツ生成、ルーティング、API repository、記事・Markdown表示、配信用成果物です。構成の説明は [architecture.md](architecture.md) を参照してください。隣接リポジトリ・外部サービス・公開環境の変更は含みません。

## 現在の仕様

- ニュースは `publishedDate` に日付（YYYY-MM-DD）だけを保持し、作成日時・更新日時・著者IDを持たない。全記事を公開し、ホームのお知らせには最新5件を表示する。下書きプレビューは設けない。
- ニュースの読込・検証は `local-content.mjs` に集約。サイト設定・固定ページ名・外部リンクは `src/config/site.ts`、分野定義は `src/config/communities.ts` に集約し、ニュースのタグ参照は廃止。本文・画像・動画は明示した変換関数で生成する。
- ローカル素材は例外なく記事・ページの `assets/` 配下に配置し、相対参照する。本文の素材参照・サムネイル・分野動画とも範囲外への参照を生成時に拒否する。リンクはassets参照だけを素材として扱い、他の相対・絶対ページURLを保持する。Markdown・HTMLのURL部分を構文解析して変換し、コード・数式・その他の書式を保持する。素材は `?url&no-inline` でファイル出力し、sanitizeは維持する。
- ブログ一覧は全件取得と既存のSWR共有を維持する。Contentful一覧は本文を取得しない。Toyboxは既存の本文を含む全件取得を維持し、表示用概要だけを200文字に制限する。追加読込UIは設けない。
- 一覧型と詳細型を分離し、表示部品で取得元ごとのタグ・著者変換を行わない。Contentful通信は共通client、著者ページと著者バッジは同じ著者一覧キャッシュを使う。

- Markdownの公開アンカーは見出し・手動ID・脚注とも `#名前` を使用する。内部IDはプレビューごとに一意な接頭辞で保護し、ARIA参照も対応付ける。脚注IDの保護はsanitizeで一度だけ行い、同じページに複数の本文を表示しても衝突させない。

## 検証

| 確認 | 結果と範囲 |
| --- | --- |
| `npm run ci` | 成功。コンテンツ生成、回帰テスト、命名、Biome、TypeScript、Vite、Pages用成果物生成 |
| `npm run test:content` | 6件成功。全ニュースの自動検出、必須値・ID・投稿日、素材の存在と参照範囲、共通接頭辞、投稿日・ID順、分野定義、Pages生成を確認。assets配下への配置の強制、括弧・空白・クエリ・HTML属性・参照形式・相対ページリンクの保持と画像用途の区別、コード例・表・複数行リンク・数式の保持と素材ファイル・assetsディレクトリのシンボリックリンクによる範囲外参照拒否をfixtureで確認 |
| `npm run test:content:browser` | 成功。本番ビルドの全22本文を390px / 1440pxで表示し、本文画像150回・分野動画metadata10回の実読込、横溢れ・実行時エラーなしを確認。4 KiB未満の2DCG画像を含む。作品APIはfixture |
| `npm run test:pages` | 成功。現在の公開ルート集合、初期OGP・canonical、ローカルOGP画像、404 noindexを生成物で確認 |
| 相対ページリンクのブラウザ確認 | 一時記事でMarkdownの兄弟記事・親階層About・絶対パスの一覧、参照形式、HTMLリンクの計5種類が期待するURLへ遷移。assetsリンクはHTTP 200を確認。一時記事は削除済み |
| `TEST_BASE_URL=... npm run test:review` | 成功。APIはfixture。IDのみのURL・UUIDによる取得先判定・ブログと著者別一覧の全件表示・Contentful本文の除外・取得障害と404の区別、robots解除、カルーセルkey、メニューのスクロール固定・位置復元・Escape後focus復帰 |
| `TEST_BASE_URL=... node scripts/browser-smoke.mjs 4` | 成功。390px / 1440pxでAboutと全5分野、横はみ出し、動画metadata読込、旧分野IDの404、静的ページのContentful非依存を確認 |
| `TEST_BASE_URL=... node scripts/works-smoke.mjs` | 成功。APIはfixture。ホーム／Aboutの390px / 1440px、20件制限・取得query・認証情報の非送信・読込中・空・HTTP／schema失敗・再試行 |
| `npm run test:storybook -- src/features/MarkdownPreview/MarkdownPreview.stories.tsx` | 8件成功。手動IDの直接アンカー・同一アンカーの再クリック・入れ子details・脚注参照と戻り先・ARIA参照・旧形式URL・複数プレビューのID一意性・メタデータ偽装防止を確認。既存のコードコピー・数式・画像拡大・sanitize等も維持 |
| `git diff --check` | 成功。新規文書の相対リンクも参照先の存在を確認 |

Storybookの初回実行では依存最適化による再読み込みが発生しました。別作業でStorybookが10.6.7へ更新された後、追加の `optimizeDeps.include` を使わない既存形式でキャッシュなしのテストを確認しています。バージョン更新とStorybook previewの修正は、このレビュー修正とは分けて扱います。

実行環境の制限により、ローカルのVite設定読込・ブラウザ起動・子プロセスを伴う検証は制限外で実行しました。テストのために本番API設定や接続先を変更していません。

## 残事項・今回の検証外

- `markdown-assets.mjs` は未使用の素材参照定義や、同じ識別子の2件目以降の定義も検証する。`[unused]: ./assets/missing.png` が本文から使われていなくても生成エラーとなる。CommonMarkで実際に採用・参照される定義だけを処理する必要がある。
- ファイル名に `#` がある素材を `%23` で参照すると、存在検査は通るがViteのimport生成で生の `#` が使われ、ビルドに失敗する。分離したVite fixtureで再現。現在の命名規則に沿うファイル名では発生しないが、importのパスとクエリを区別して扱う必要がある。
- `<a download>` はsanitize schemaに許可属性がなく、ブラウザ上で属性が除去される。HTMLによるダウンロード指定は現在利用できない。必要な属性を個別に許可し、値と動作を検証する方針が必要。
- Contentful・Go backend・外部ブログの実通信と、公開originのCORSはこのレビューでは検証していません。fixtureの成功を実API接続の証明には使いません。
- Cloudflare Pagesへのデプロイ、GitHub上のCI、カスタムドメイン・DNS・TLS・実機Safariは未確認です。
- ブログ詳細／著者の個別初期OGP・動的sitemap・未知IDのHTTP404は未実装です。SPAの画面404とHTTPステータスを分けて扱います。
- APIレスポンスの型定義はありますが、全フィールドを実行時に検査するschema validatorはありません。作品APIは配列と各公開作品の必要フィールド、Contentfulはコレクションの形とページング進捗などを検査しています。
- Markdown描画・シンタックスハイライト等を含む約1.3MBのJSチャンクにビルド警告があります。表示不具合の検出とは別に、必要なら初回表示・遅延読込を計測して分割を検討します。
- `ci`と`prebuild`のコンテンツ生成は重複しています。どちらからも生成物なしで開始できる現在の動作を維持しています。
