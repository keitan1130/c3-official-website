# Cloudflare Pages 配信方針

2026-11-14 に公開先を Cloudflare Pages、本番ドメインを `compositecomputer.club` と確定。
実際の Pages プロジェクト設定・Git連携・DNSへの変更・デプロイはまだ実施していない。

## ビルドと成果物

- このプロジェクトの Git root を build root とし、Vite の成果物 `dist/` を公開する。
- build command は `npm run build`。命名・Biome・型・content の検査は公開前の品質確認として別途実行する。
- ローカル・GitHub Actions・Pages の Node を26系に揃え、Pages build 環境で利用可能か導入時に確認する。
- `migration/snapshots/` や不要な原本は成果物へ含めない。

React / Vite の build command と出力先は [Cloudflare Reactガイド](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/) に沿う。
Git連携と Direct Upload のどちらを既存プロジェクトが使っているか確認し、実際の構成に沿って公開手順を仕上げる。

## ルート・削除ページ・OGP

- `/about`、`/community/:slug`、`/news/:id`、`/blog/:id`、`/author/:id` を直接開いて再読込できることを確認する。
- Pages はトップレベルの `404.html` の有無で SPA fallback の扱いが変わる。単純に404ファイルを追加するだけでは React の深いURLと両立しない可能性がある。[Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- 分野は `game` / `3dcg` / `hack` / `2dcg` / `music` のslug URLだけを有効にする。旧IDのURLへの転送ルールは作らず、直接アクセスはHTTP404を返す構成として検証する。
- `/contact` / `/contact/thanks`、旧分野ID、不明な静的URLは生成した `404.html` でHTTP404にする。ブログ詳細と著者は `_redirects` の200 rewriteでSPAを表示するため、存在しない動的IDのHTTP404は未実装（画面は404になる）。
- `postbuild` で25件の静的ルートHTMLに初期OGP・canonicalを生成する。紹介・分野・お知らせと一覧が対象。ブログ詳細・著者の個別初期OGPは未実装。
- ブログの実API・CORSは `pages.dev` の確認環境と現行ドメインで別々に確認する。

## メディア

紹介・分野・お知らせ・掲載作品のメディアは `content/` 内の各ページ・記事フォルダに本文と同居させる。ビルド時に公開対象の参照を配信用URLへ解決し、`dist/` の成果物をPagesに配信する。
Pages の1ファイル上限は25 MiB。今回の回収メディアの最大ファイルは12,250,146 bytesで、この上限内である。新しい掲載素材も build時に確認する。[Pages Limits](https://developers.cloudflare.com/pages/platform/limits/)
原本を無条件に圧縮する必要はない。実機の再生・表示・読込を確認し、必要に応じて最適化する。

## 切替と復旧

- 初めに Pages の確認用URLで検証し、完成した成果物とソースの版を対応付ける。
- カスタムドメイン設定と既存DNSを確認し、現行 `compositecomputer.club` を継続する。[Custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- 切替前に旧配信設定と復旧対象の deployment を特定する。新版の本番確認に失敗した場合の戻し方を残す。
- 独自cache設定がある場合はPagesの配信との整合を確認する。不要な全域cache削除は行わない。
- 公開完了の基準は [実装ロードマップ](implementation-roadmap.md) の段階9〜10に従う。

## ブログ接続とCORS

ブログは `VITE_TOYBOX_API_BASE_URL` の公開APIへブラウザから直接接続する。ユーザー指定によりVite / Pages Functionsの同一originプロキシは導入しない。CORSは後で整理する。現在はローカルoriginでToyboxがCORS拒否となることを確認しており、両APIのブラウザ接続完了とは扱わない。Contentful側の取得と部分失敗時の表示は確認済み。

## 現在の成果物と残事項

- npm run buildのpostbuildで初期HTML・25件の静的sitemap・robots・OGP用画像・404.html・_redirectsを生成する。
- 動的なブログ詳細・著者のIDはローカルに固定していないため、現時点のsitemapには含めていない。公開前に動的ページの初期OGP・sitemap・HTTP404の方式を確定する。
- `npm run preview:pages` はローカルの静的ルートモデルで、Cloudflare上での動作確認の代わりにはしない。
- GitHub上のCI実行、既存Pagesプロジェクトへの接続、ドメイン切替は未実施。
