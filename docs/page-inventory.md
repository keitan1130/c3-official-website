# ページ台帳

「維持」は現行 UI を移植する対象。「要判断」は削除確定ではない。
ブログ以外のローカル管理を実現する。分野ページは `/community/<slug>` に変更し、旧IDのURLからの転送は作らない。その他の維持対象URLは既存どおりとする。

## 維持するページ

| URL | 旧ファイル | 内容 / 新しい取得元 |
| --- | --- | --- |
| `/` | `web/pages/index.vue` | ホーム。紹介・分野・お知らせはローカル化。作品は静的管理、ブログは既存取得を継続 |
| `/about` | `web/pages/about/index.vue` | C3 紹介本文、ロゴ、分野リンクを維持。作品欄は静的ファイル管理 |
| `/community/game` | `web/pages/community/_id.vue` | GAME / Markdown・動画をローカル化 |
| `/community/3dcg` | 同上 | 3DCG / 同上 |
| `/community/hack` | 同上 | HACK / 同上 |
| `/community/2dcg` | 同上 | 2DCG / 同上 |
| `/community/music` | 同上 | MUSIC / 同上 |
| `/news` | `web/pages/news/index.vue` | 一覧。公開済み全16件、タグ、カード、日付・並びを維持 |
| `/news/:id` | `web/pages/news/_id.vue` | お知らせ本文、著者、タグ、サムネイル、関連表示をローカル化 |
| 不明な URL | `web/layouts/error.vue` | 404 画面。配信側のステータス設計は別途必要 |

分野のslugは `game` / `3dcg` / `hack` / `2dcg` / `music` に固定する。旧 `/community/<Contentful ID>` はルートを登録せず404として扱う。ナビ・ホーム・Aboutのリンク、canonical、sitemapは新URLを使用する。

## 維持するブログ・著者ページと作品欄（2026-11-14確定）

| 対象 | 方針 |
| --- | --- |
| `/blog` / `/blog/:id` | Contentful＋Toybox から引き続き取得。本文は Toybox の MarkdownPreview で表示。本文のローカル回収は対象外 |
| `/author/:id` | Contentfulから36名全員のプロフィールを取得し、旧URLを維持。著者別のContentfulブログ一覧も取得 |
| ホーム / About の作品欄 | `content/featured-works/` で掲載作品と表示順を管理し、各作品フォルダの `assets/` に画像を置く。実行時の `/works` 取得をなくす |
| JP / ENの位置 | 言語表示を削除し、Toyboxのライト / ダーク切替ボタンへ置換。PC・モバイルそれぞれの旧表示位置を使用。翻訳ページは新設しない |

著者36名は Contentful の `user` エントリで、Toybox のユーザー一覧ではない。
旧 `web/pages/author/_id.vue` はプロフィールを `getEntry(params.id)`、ブログを `content_type: blog` と `fields.user.sys.id` で取得している。
Toyboxブログの著者はブログAPI内の `user` 情報であり、Contentful著者と別のID体系として扱う。詳しくは [確定事項](decisions.md)。

## 今回は不要 / 対象外

| 対象 | 理由 |
| --- | --- |
| `/contact` / `/contact/thanks` と問い合わせ導線 | 使用していないため新版には実装しない。既存URLへの直接アクセスは404、ナビ・フッター・sitemapから除去 |
| ログイン・Discord callback・投稿・編集・設定など Toybox 固有ページ | 公式サイトの旧 `web/pages` に存在せず、package・Markdown の再利用のために持ち込む必要はない |
| CMS 管理画面 / ブラウザ上の Markdown 編集画面 | frontend リポジトリのファイル編集とレビューで運用する方針 |
| ブログ本文のローカル移行 | 今回の明示的な回収対象外 |
| 新しい役員紹介 / コミュニティ概要専用ページ | `executiveMember` / `aboutCommunity` は回収するが、現行ページコードでの利用を確認できていない。データがあるだけで新設しない |
| `/tmp` | sitemap の除外設定はあるが、対応するページファイルは見つからない |

`user` / `tag` にはブログ専用の情報が含まれる可能性がある。回収段階では公開メタデータを保全し、運用用データへの変換時に参照元を調べて採用する。
削除対象と確定するまでは、既存のリンク・著者 URL を壊さない。
