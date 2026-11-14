# 確定事項

2026-11-14 のユーザー回答を反映。サイト全体のUIを維持する。URLは分野ページをslug形式に変更し、お問い合わせを削除する。その他の維持対象は既存URLを引き継ぐ。

| 項目 | 決定 |
| --- | --- |
| UI / コード / CSS | サイト全体は現行公式サイトの UI。Markdown本文はToybox MarkdownPreviewの UI。コード構成はToybox frontendに統一し、CSSは各ページ・コンポーネントのCSS Modulesに分割 |
| 分野URL | `/community/game`・`/community/3dcg`・`/community/hack`・`/community/2dcg`・`/community/music`。旧IDのURLから転送せず、旧URLは404 |
| ブログ | Contentful＋Toybox から取得を継続。一覧・詳細を維持。本文表示は Toybox の MarkdownPreview。本文のローカル全量回収は対象外 |
| 素材フォルダ | 写真・動画等を記事 / ページ内の `assets/` に統一。`./assets/cover.jpg` 等で参照 |
| テーマ切替 | JP / EN表示をToyboxのライト / ダーク切替ボタンへ置換。PC・モバイルとも既存の言語表示位置。選択保存・OS初期値もToyboxと同じ |
| ローカル記事管理 | `content/about/`、`content/news/<date>-<slug>/` 等の単位で本文・写真・表示設定を同居。新規ニュースはフォルダ追加で自動反映 |
| ホーム / About の作品欄 | frontend 内の各作品フォルダで情報・画像を管理し、共通ファイルで表示順を指定。実行時の作品APIは不要 |
| 著者 | Contentfulの公開プロフィール36名すべてをAPIから取得し、旧 `/author/:id` と著者別Contentfulブログ一覧を維持。ローカルにプロフィール・画像を管理しない |
| お問い合わせ | フォーム・完了画面・Header / Footer の導線を新版から削除。旧 `/contact` / `/contact/thanks` は404。sitemap に含めない |
| 欠損画像 | `C3 Advent Calendar 2022開催中！` の404画像参照を運用本文から削除。回収原本は保持 |
| CORS | 後で整理する。Toyboxブログは公開APIへ直接接続し、Vite / Pages Functionsの同一originプロキシは追加しない |
| 公開先 | Cloudflare Pages |
| 本番ドメイン | `compositecomputer.club` を継続 |

## 著者36名の取得元

回収元は Contentful Delivery API の `user` 型で、保存先は `migration/snapshots/2026-11-14/entries/user/`。
回収原本は調査時の記録としてGit対象外に保持しているが、運用データとしては使わない。最新のプロフィール・アイコン・SNS等はContentful APIから取得する。

旧 `../web/pages/author/_id.vue` は次の2つを取得している。

- `sdkClient.getEntry(params.id)` で Contentful のプロフィール。
- `getEntries({ content_type: 'blog', 'fields.user.sys.id': params.id })` で、その人のContentfulブログ。

Toyboxブログの著者はブログAPIの `user` から取得し、旧 `../web/utils/toybox.js` が表示用データへ変換している。
Contentful の36名は Toybox の全ユーザー一覧ではなく、両者の同一人物を推測してIDを統合しない。

## 作品のファイル名とフォルダ名

サイトに選んで掲載する作品なので、ドメイン名を `featured-works` に統一する。

```text
content/featured-works/
  index.json                        # 掲載順のslug配列。ホームとAboutで共用
  example-game/
    index.json                      # 1作品のメタデータ
    assets/
      thumbnail.png                 # 同じ作品フォルダで画像も管理
```

- `<slug>` は小文字英数字の kebab-case。作品名を直接パスにせず、短く安定した識別名を付ける。
- 全体の `index.json` に `items` として slug を順番に並べる。順序変更のためにコードを変更しない。
- 各作品の `index.json` は `id`・`title`・`thumbnail` を必須とする。`id` は変更しない文字列で、旧作品との対応があれば旧IDを保持する。
- サムネイルは同じ作品フォルダ内の `./assets/thumbnail.<ext>` を参照する。配信用URLはビルド時に解決する。
- 現行作品欄は画像の背景表示と「作品を見る」の Toybox トップへのリンク。UI を維持し、作品詳細ページや各画像への新しいリンクは追加しない。
- 共通リンク先は `content/site/index.json` の `worksUrl` で管理する。
- 新しい本文用 Markdown は不要。今後説明文が必要になったときに、表示要件に応じて追加する。

## 未決の扱い

ユーザーに質問した6項目はすべて回答済み。実装時に確認する技術項目は残る。

- 現在の Cloudflare Pages プロジェクト、Git連携・公開ブランチ、Node 26のビルド環境と環境変数。
- ブログAPIの実契約・CORS、Toybox著者リンクの現在の行き先。
- 初期 HTML のページ別 OGP、SPA直リンクとHTTP404を成立させる実装方式。
- 初期の掲載作品の選定・順序。実装時は現行作品欄を比較元にして移行用一覧を作り、実物で確認する。

これらは採用方式が未回答という意味ではなく、既存構成・実データを調査して具体化する作業。
公開切替は、完成した成果物と実環境の確認結果が揃ってから行う。
