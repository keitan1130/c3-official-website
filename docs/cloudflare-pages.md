# Cloudflare Pages

build rootはこのプロジェクト、コマンドは `npm run build`、出力先は `dist/`、Nodeは26系です。
環境変数は `.env.example` を参照し、`VITE_SITE_URL` にパス等を含まない公開originを設定します。
変更した環境変数は再ビルドが必要です。公開前の一括検査は `npm run ci` です。

ビルドは紹介・分野・ニュース・一覧の初期HTML、OGP画像、canonical、sitemap、robots、404を生成します。
ブログ詳細と著者は `_redirects` でSPAへrewriteします。個別の初期OGP・動的sitemap・未知IDのHTTP404は未実装です。
旧分野ID・削除ページ・未知の静的URLは404を想定しています。

`npm run preview` はローカルの配信モデルです。Cloudflareのエミュレーターではなく、公開環境で直接URL・再読込・HTTP状態を別途確認します。
API・画像配信先のCORS、実機の動画再生、DNS・TLS・デプロイもローカル検証の対象外です。

ロゴを変更したときは `node scripts/generateIcons.ts` を実行し、生成したPNG・ICO・manifestも更新します。
