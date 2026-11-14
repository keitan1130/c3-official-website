# リプレイス計画

調査日: 2026-11-14 / 対象: `../web` → `c3-official-website`

## 確定している方針

- Vite + React + TypeScript に置き換える。
- サイト全体の UI の基準は現行公式サイトと `../web`。Markdown本文はToybox MarkdownPreviewの UI。JP / EN位置はToyboxのライト / ダーク切替ボタンに置き換え、ダーク配色を追加する。
- プロジェクト構成・package・Markdown 表示実装の移植元は `/home/keitan/workspace/toybox/frontend`。
- コードは Toybox と同じ `pages/`・`features/`・`shared/`・`util/` の責務分割と、コンポーネントごとの `index.tsx` / `index.module.css` の配置にする。
- 素材はページ・記事ごとの `assets/` にまとめる。
- CSS はページ・機能・子コンポーネント・汎用部品ごとに分割し、グローバル CSS は reset・フォント・共通トークン等に限定する。詳細は [実装ガイド](../FRONTEND_GUIDE.md) に従う。
- ブログ以外の Markdown・写真・動画は frontend 内で管理し、紹介・お知らせを読むための Contentful 実行時アクセスをなくす。
- まず必要なページを決める。既存ページの削除や公開先の切替はこの調査では実施しない。
- 「ブログ以外を回収」は回収範囲の指定。ブログ画面を廃止する指示とは解釈しない。

公開先は **Cloudflare Pages**、本番ドメインは **compositecomputer.club**。回答に基づく [確定事項](decisions.md) と [Pages 配信方針](cloudflare-pages.md) に従う。
欠損した Discord 画像は運用本文から参照を削除する。回収原本は保持する。

## 現行のデータ境界

| 情報 | 旧コードの取得元 | リプレイス方針 |
| --- | --- | --- |
| ホーム紹介・C3について | Contentful `c3Introduction` | ローカル Markdown / メタデータ |
| 各分野 | Contentful `eachCommunity` | ローカル Markdown / 動画 |
| お知らせ | Contentful `news` / `tag` / `user` | ローカル Markdown / メタデータ |
| 著者プロフィール | Contentful `user` | 全36名のプロフィールと旧 URL、著者別Contentfulブログ一覧を維持 |
| ブログ | Contentful `blog` と Toybox `/blogs` | 取得を継続し、Toybox の MarkdownPreview で本文を表示。本文のローカル回収は対象外 |
| 作品欄 | Toybox `/works?limit=30` | `content/featured-works/<slug>/` に情報と画像をまとめた静的ファイル管理へ移行 |
| お問い合わせ | Vue 内のフォーム | 使用していないため、フォーム・完了画面・ナビの導線を新版から削除 |

`toybox-server/main.py` は Python/FastAPI の `/api/v1` とブログ API を提供する。
`toybox-back/internal/infrastructure/router/router.go` は Go の作品 API に加え、旧 `/api/v1/works` と `/api/v1/blogs` の互換プロキシを持つ。
公式サイトの文書をすべてこの2つが配信しているわけではない。紹介・分野・お知らせの主な配信元は Contentful。

本番配信バンドルで確認した Toybox の参照先は `https://kodomobeya.compositecomputer.club/api/v1`。
そのホストの背後で稼働中のプロセス・DB・プロキシ構成は未確認。Go の `/works` と旧 `/api/v1/works` を同じレスポンスとして扱わない。

根拠: `../web/plugins/contentful.js`、`../web/pages/index.vue`、`../web/pages/about/index.vue`、
`../web/pages/blog/_id.vue`、`../web/utils/toybox.js`、上記 backend のルーター。

## Toybox frontend から持ってくるもの

| 対象 | 扱い |
| --- | --- |
| `package.json` / `package-lock.json` | 同時にコピーし、プロジェクト名と公式サイトに必要な scripts を調整。依存の削除は別変更として記録 |
| Node / npm 設定 | `.nvmrc` / `.npmrc` を確認して採用。現在の package は Node `26.x` 指定 |
| Vite / TypeScript / Biome | alias `@/`、strict TS、CSS Modules、命名規約を継承 |
| `src/features/MarkdownPreview/` | 表示実装の移植元。sanitize schema、GFM、数式、見出しリンク、画像・動画・音声などをまとめて扱う |
| Markdown の依存部品 | `shared/ui/Button` / `Dialog` / `LoadingImage`、`util/theme` / `copyTextToClipboard` 等を参照から洗い出す |
| Storybook / naming check | scripts と実ファイルの整合を取って継承する。設定だけコピーして参照切れにしない |
| Toybox 固有の画面 | 認証・投稿・編集・ユーザー設定・作品詳細などは公式サイトのページとしてコピーしない |

Markdown 表示に使う package と実装を継承することと、Toybox の記事データを回収することは別作業。
Toybox README / DesignDoc には作品共有サービス固有の記述があるため、公式サイト用ドキュメントへそのまま転用しない。
旧 Markdown は `markdown-it`、新側は Toybox の `react-markdown` 系になるため、HTML、改行、コードブロック、画像サイズ、リンクの表示互換性を実文書で確認する。

## UI 同等性の基準

- ヘッダー、スクロール時の出入り、メニュー展開・背景マスク、ロゴ、フッター、外部リンク。JP / ENはテーマ切替に置換する。
- ホームの大見出し、ニュース切替、カルーセル、紹介、5分野、作品、ブログの並びと余白。
- About / 分野 / お知らせ / 著者のレイアウト、パンくず、本文、カード、サイドバー。
- `variables.scss` の色・フォント・サイズと、450 / 600 / 1000px の境界を確認する。
- 分野の紹介は静止画だけではなく、`image` / `smallimg` を使う動画。自動再生・ループ・poster・表示比率も維持。
- 分野URLは `/community/<slug>` に変更する。旧IDのURLから転送しない。タグ検索、末尾スラッシュの扱い、アンカー、直リンクと再読込を確認する。

同じ OS・ブラウザ・フォント・幅で公開サイトのスクリーンショットを保存し、新版のライト表示と比較する。ダーク表示は追加仕様として検証する。
推奨比較幅は 390 / 768 / 1440px と各境界の前後。カルーセル・動画の時刻は揃えるか領域を分けて確認する。
現時点でスクリーンショット比較は実施しておらず、「全く同じ UI」の達成は未確認。

## 作業順序

詳細な実装順序・各段階の完了条件・公開切替・復旧は [実装ロードマップ](implementation-roadmap.md) を正本とする。

1. 回答済みのページ採否と旧UI比較基準を整理する。
2. Toybox と同じ開発基盤を用意する。
3. ローカル content・メディア・MarkdownPreview を整備する。
4. 共通レイアウト、About・5分野、お知らせ・著者の順に実装する。
5. Contentful＋Toyboxのブログを接続し、静的作品欄を含むホームを完成させる。お問い合わせは削除する。
6. 全体検証と公開候補の配信確認を行う。
7. 最新データとの差分を反映し、公開切替・本番確認・運用引継ぎを行う。

回答済み事項と技術確認の期限は [ロードマップ](implementation-roadmap.md#回答済み事項と実装時の確認期限) に従い、依存しない実装は先に進める。

## 完了条件

- 分野ページは決定したslugの新URL、その他の採用ページは既存URLで開ける。外部 API が停止してもローカル管理の本文・メディアが表示できる。
- Toybox と同じ責務でコードが配置され、各ページ・部品の CSS が対応する CSS Modules に分割されている。
- ページ・記事ごとのフォルダで本文・写真・表示要素を管理できる。ニュースは記事フォルダを追加するだけで公開一覧へ反映し、手動import・一覧配列・Reactコードの変更が不要。下書き本文・画像は公開成果物に含まれない。
- 取得原本と運用データの対応、移行対象の欠落、未回収の外部メディアが確認できる。
- UI比較結果を残す。旧分野IDのURLと削除するお問い合わせは転送せず404。内部リンク・canonical・sitemapから旧URLを除く。
- Vite SPA の深い URL への fallback、404 の HTTP ステータス、初期 HTML の OGP、sitemap / robots を設計する。
- ビルド成功・fixture 成功と、実際のブログ API / Pagesでの配信 / 本番公開の確認を分けて記録する。
