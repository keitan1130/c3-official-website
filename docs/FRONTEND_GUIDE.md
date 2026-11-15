# フロントエンド実装ガイド

作業範囲は [AGENTS.md](../AGENTS.md)、検証は [WORKFLOW_GUIDE.md](WORKFLOW_GUIDE.md)、命名の正本は [命名規則](naming-conventions.md) です。
以下を実装規則とします。

## 技術と配置

- UI は現行公式サイトと同じに保ち、コードはページ・機能・汎用部品の責務で配置します。
- React / TypeScript strict / Vite / React Router、CSS Modules、Biome、Storybook を使用します。
- `main.tsx` は起動と Provider、`App.tsx` はルート定義、`features/AppLayout/` は Header・Outlet・Footer の共通配置を担当します。
- `src/pages/` はルート単位の構成と parameter の受け渡しに絞り、feature を組み合わせます。
- 機能固有の UI・API・hook・store は `src/features/<Feature>/` に置きます。
- 汎用 UI は `src/shared/ui/`、共有型は `src/shared/types/`、UI 非依存の共有関数は `src/util/`。局所型は利用箇所の近くに置きます。
- 本文・メタデータ・写真・動画は `content/` のページ・記事フォルダ内にまとめます。例: `content/about/`、`content/news/<date>-<slug>/`。画像・動画等の素材は各フォルダの `assets/` にまとめ、相対パスからビルド時に配信用URLへ解決します。詳細は [コンテンツ構成](content-structure.md) に従います。
- `src/assets/` は共通ロゴ・アイコン・動画読み込み用画像等、import して使う UI 素材、`dist/` は生成物です。生成物を手動編集しません。
- 新しい部品の前に shared UI と feature 内の既存部品を検索します。Hygenで既存テンプレートを利用できます。

ページ・機能・再利用部品に責務を分けます。
各コンポーネントは `ComponentName/index.tsx` と `ComponentName/index.module.css` を基本単位にします。
機能内の子コンポーネントも、独立した責務を持つ場合は子ディレクトリへ分けます。機能固有の `api/`・`hook/`・`store/` は必要になった時点で追加します。
構成例は [コンテンツ構成のディレクトリ図](content-structure.md) を参照します。

## CSS の分割

- `pages/<Page>/index.module.css` は、そのページ固有の外枠・セクション配置を担当します。
- `features/<Feature>/index.module.css` と子コンポーネントの同名ファイルは、それぞれの機能・部品の見た目とレスポンシブ表示を担当します。
- `shared/ui/<Component>/index.module.css` は汎用部品の見た目を担当します。ページ専用の配置を汎用部品へ混ぜません。
- `src/index.css` はreset・基本フォント・共通トークンに限定します。各画面・部品のCSSをこのファイルに集約しません。
- Header・Footer・記事カード・Markdown 本文等のスタイルをページから横断的に上書きせず、所有するコンポーネント側に置きます。Markdown の要素セレクタも MarkdownPreview のルート class 内に閉じます。
- 静的な見た目は TSX の `style` や `<style>` へ埋め込まず、CSS Modules に記述します。計測値・座標等の動的な値だけ必要に応じて inline style / CSS custom property で渡します。
- media query は対象部品の CSS に同居させます。旧サイトのブレークポイント・寸法・動作を維持し、分割により表示差や他ページへのスタイル漏れが起きていないか確認します。
- class は kebab-case、参照は `styles["news-card"]` に統一します。詳細は [命名規則](naming-conventions.md) に従います。

## UI と Markdown

- サイト全体の色・余白・フォント・画像比率・動作の比較元は現行公式サイトです。ブログ等のMarkdown本文は明示された方針に従い、MarkdownPreviewのUI を使います。
- 旧 SCSS の値を CSS custom property へ移す場合も、見た目を維持します。色リテラルは原則 `src/index.css` の `:root` に集約し、CSS Modules / TSX では用途を表す `var(--...)` を使います。
- 新しい色を追加する前に既存トークンを確認します。色名と適用先は公式サイトのデザインに合わせ、共通トークンを使います。
- Markdown の表示は `MarkdownPreview` に統一します。sanitize schema、見出し、コード、画像等の依存もあわせて確認します。
- Markdown実装には GFM・数式・raw HTML の解析と sanitize・メディア対応があります。ガイドの古い機能説明だけで判断せず、実装と実文書を照合します。
- 原文をそのまま raw HTML として注入しません。sanitize を緩めるときは必要な要素・属性と実際の回帰を確認します。
- 画像・動画の変換時は画質と表示を確認します。ロゴ・SVG は適切な形式を維持します。
- カード全体のリンクに別リンクを入れず、著者・記事・外部リンクの操作対象を独立させます。
- 一覧は画像・タイトル・概要の領域を揃え、概要の有無や画像読込によってカード寸法を変えません。詳細の概要は値がある場合だけ表示します。

## ライト / ダーク切替

- 画面幅に関係なくHeader上部にライト / ダーク切替ボタンを配置します。モバイルでもメニューを開かずに操作できるようにします。
- テーマ状態は `util/theme.ts` に集約します。`Button`、月 / 太陽アイコン、現在の状態に応じた切替先のラベルを再利用します。
- ライト時は月アイコンと「ダークモードに切り替え」、ダーク時は太陽アイコンと「ライトモードに切り替え」。TabとEnter / Spaceでも操作できるようにします。
- 保存済みの `theme` を優先し、未保存ならOS設定、取得できなければライトを初期値とします。選択をlocalStorageに保存し、保存できなくても現在の画面では切り替えられるようにします。
- `main.tsx` のReact描画前に初期化し、`data-theme` / `data-color-mode` と共有通知でHeader・本文・Markdown・dialog等の状態を揃えます。PC用とモバイル用で独立したテーマ状態を持ちません。
- ライトは現行公式サイトの配色を維持します。ダーク用トークンは `src/index.css` の `:root[data-theme="dark"]` に集約し、各CSS Modulesは共通トークンを参照します。レイアウトは両テーマで維持します。
- 共通テーマ管理と公式サイトの配色を使います。背景・文字・カード・リンク・境界・hover・focus・Markdownを確認し、写真・動画・ロゴ自体は自動反転しません。
- Storybookでも同じテーマ管理を使います。切替・再読込・保存不可・モバイル配置を確認し、ライトは旧サイトと比較、ダークは追加仕様として表示とコントラストを確認します。

## データと状態管理

- 静的コンテンツは `scripts/local-content.mjs` で共通の読込・検証を行い、`prepare-content.mjs` で参照を解決・生成して、`contentRepository.ts` を通じて表示します。配信用HTMLの生成も同じ読込・検証処理を使います。ニュースは全件を公開し、ホームのお知らせには最新5件を表示します。
- ブログは Contentfulと外部ブログ の API 境界を分け、失敗してもローカル本文の表示を止めません。作品欄はGoの公開作品APIから最新20件を取得し、ホームとAboutで共有します。
- SWRは外部取得のcacheに使います。局所状態はReactのstateで管理し、静的Markdownのために状態管理ライブラリを追加しません。
- SWR の Suspense を採用する場合は loading / error boundary / 再試行を一式で設計します。ルートで有効化済みと仮定しません。
- サイト・ページ名・外部URLは `src/config/site.ts`、分野定義は `src/config/communities.ts` を参照します。記事本文や素材だけを `content/` に配置し、ニュースにタグ設定を追加しません。
- SWR key にはresponseを変える記事ID・著者IDなどを含めます。ブログはIDが重複しない前提で、詳細URLを `/blog/:id`、詳細キーを `["blog", id]` に統一します。UUIDはToybox、それ以外はContentfulから取得し、別サービスへのフォールバックは行いません。
- ブログ・著者別ブログは全件取得を維持し、画面のページングは追加しません。Contentful一覧は本文を除外し、Toybox一覧は本文を含む既存レスポンスを使用します。
- 再試行時に無関係な cache を全消去しません。正常な空配列と通信失敗、404 と通信エラーを区別します。
- 非同期完了後の更新では unmount・画面遷移後に古い結果を反映しないよう AbortController 等で保護します。
- Toast 等の通知が必要なら共有 Provider に集約します。認証 Provider・ProtectedRoute は公式サイトに必要と決まるまで持ち込みません。

## TypeScript / React と操作性

- `strict`、未使用コードの検査を維持し、`any` や不要な型アサーションを避けます。
- Props・データ・store の型を明示します。API 契約の field は境界で保持し、内部型への変換を明示します。
- feature をまたぐ import は原則 `@/`、同居 CSS や近接ファイルは相対 import。形式は Biome に従います。
- list key・比較・選択には安定 ID を使い、index や表示名を識別子にしません。分野の公開URLはslugを使い、ID形式のURLへの転送は作りません。
- button、input、link に適切な HTML 要素、accessible name、disabled 状態、画像の alt を設定します。
- menu / dialog はキーボード、Escape、外側クリック、focus 復帰を確認します。再利用できる部品があれば重複実装しません。
- 直接 URL・再読込・アンカーを確認します。React Router の fallback だけでは配信サーバーの SPA fallback や HTTP 404 は保証されません。

## Storybook

- 追加・変更前に既存 story と `play` を確認し、変更に必要な最小限のケースに絞ります。無関係な基盤整理へ広げません。
- shared UI の変更では story の追加・更新を検討し、variant・disabled・空・長文・エラーの代表例を確認します。
- 表示例には原則 `play` を追加しません。コピー・メニュー・dialog 等、回帰を検出する必要がある主要操作だけ `tags: ["test"]` を付け、共通の `!test` 方針を維持します。
- 自動テストは結果と必要なアクセシビリティを検査します。実装内部の DOM / class や不要な時間固定値に依存させません。
- sanitizer・リンク安全性等の重要な検証を、テストを通すために無効化しません。
- UI 同等性は同じブラウザ・幅・フォントで現行サイトと別途比較します。Storybook の成功だけでは本番ページの同等性を証明できません。
