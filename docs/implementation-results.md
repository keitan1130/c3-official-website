# 段階別の実装結果

## 0. 比較基準と対象の確認

- 既存の確定事項・ページ台帳を実装基準に設定。
- 公開中のホーム・About・3DCG・お知らせ一覧を390 / 768 / 1440pxで撮影（計12枚）。`migration/ui-baseline/` にローカル保存し、Git対象外。
- 公開ページが本文を描画することをブラウザで確認。旧お知らせ一覧のtitleが「ブログ - 一覧」になる既存不整合も確認し、新版はお知らせへ修正する。
- Pagesの既存プロジェクト・Git連携・DNS設定は未接続。配信設計・ローカル実装は進め、本番切替の確認とは分ける。
- 検証は段階の結果報告直前にまとめて実施。コミットは段階より細かい単位とする。

## 1. 開発基盤

- Toyboxのpackage / lockfile、Node 26、Vite / React / TypeScript、aliasを移植。
- Biome、TS / CSS命名検査、Husky、Hygen、Storybook、GitHub Actionsを移植。
- クリーンnpm ciに成功（sandboxのesbuild起動制限を通常権限で回避）。
- npm run ci、npm run build-storybookが成功。GitHub上のCI実行は未確認。
- この段階のAppは起動確認用で、公式サイトUIは段階3以降に実装する。

## 2. ローカルcontentとMarkdown

- 紹介・5分野・お知らせ16件・著者36名・タグ46件を読みやすい運用フォルダへ変換。旧IDは保持し、分野のリンクはslugへ変更。
- 404のDiscord画像参照を運用本文から削除。原本は変更せず保持。
- 現行の掲載作品30件を一度取得し、各作品のassetsへ保存。作品APIを実行時に呼ぶ必要はない。
- ニュースの自動検出・公開日時順・下書き除外・素材と著者参照の検査を実装。npm run new:news -- YYYY-MM-DD-readable-slug で下書きを作成できる。
- ToyboxのMarkdownPreview、schema・数式・画像dialog・コピー操作・Toast等の依存を移植。
- 掲載作品のPNG1件がPagesの25 MiB上限を超えたため、配信用をlossless WebPへ変換（28,881,338 → 15,093,246 bytes）。RGBAの復号画素が一致することを確認。
- 検証: npm run ci、contentの新規記事自動検出・下書き非混入・欠損参照テスト、Markdown Storybookブラウザテスト7件が成功。
- 公式ページでの表示は段階3以降で実装。
