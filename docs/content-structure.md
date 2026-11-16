# 記事・素材の管理

本文・設定・専用素材は同じページ・記事フォルダで管理します。

```text
content/
  about/{index.json,body.md,assets/}
  communities/<slug>/{index.json,body.md,assets/}
  news/YYYY-MM-DD-topic/{index.json,body.md,assets/}
```

ロゴ元画像は `public/C3Logo.svg`、その他の共通UI素材は `src/assets/` です。
サイト名・外部リンクは `src/config/site.ts`、分野名・表示順は `src/config/communities.ts` で管理します。

## ニュースの追加

```bash
npm run new:news -- 2026-11-16-event-guide
npm run dev
```

生成された `index.json`・`body.md` を編集し、仮の `assets/cover.png` を差し替えます。

```json
{
  "id": "2026-11-16-event-guide",
  "title": "イベントのご案内",
  "digest": "開催日と会場をご案内します。",
  "publishedDate": "2026-11-16",
  "body": "./body.md",
  "thumbnail": "./assets/cover.png"
}
```

全記事が自動公開対象です。下書き・重要フラグ・タグ・著者・更新日時は持ちません。
URLは `/news/<id>`。公開後はIDを維持し、投稿日降順・同日はID順で表示します。ホームは最新5件です。
サムネイルは記事の `assets/` 内のPNG・JPEG・WebP・GIF・AVIFを使います。
新しいフォルダ・素材名は小文字英数字のkebab-caseにし、既存のContentful IDは保持します。

## 本文と素材

- 画像は `![画像の説明](./assets/photo.jpg)`、幅指定は `<img src="./assets/photo.jpg" alt="説明" width="200" />`。
- GFMの表・タスクリスト・脚注、数式、折りたたみ等に対応します。通常の改行も表示に反映します。
- HTMLは許可した要素・属性だけを表示します。`div` 配置・`b`・任意CSSは使えません。spanの文字色・文字サイズは限定対応です。詳細は `src/features/MarkdownPreview/markdownSchema.ts` と `rehypeMarkdownStyles.ts` を参照します。
- 本文の相対素材URLはMarkdownファイル基準、JSONのパスはJSON基準です。素材は同じ記事・ページの `assets/` 内に置き、本文を別フォルダに置いた場合は `../assets/` も使えます。
- 参照形式・HTMLの画像/動画/音声・poster/source/trackにも対応します。クエリ・フラグメントを保持し、コード・数式・通常の文章内は変換しません。
- 素材リンクは `assets/` を指す場合だけ変換します。それ以外はページURLとして保持され、相対リンクの行き先は現在のURLと末尾スラッシュの有無に依存します。
- 参照定義は使用される最初の定義だけを検査します。画像の代替テキスト内だけのリンク・画像・HTMLは読み込まれないため、素材検査の対象外です。
- 空白を含むURLは `![説明](<./assets/photo (1).png>)` またはURLエンコードで記述できます。ファイル名の `#`・`?` は `%23`・`%3F` とします。
- アンカーは `#見出し名`・手動ID・脚注の `#fn-note` を指定します。内部の保護用接頭辞は不要です。リンク先を含む折りたたみは自動で開きます。

生成時にID・必須値・実在する日付・素材の存在・25 MiB上限を検査します。
素材が `assets/` の外を指す場合は、シンボリックリンク経由でもエラーになります。
`#`・`?` を含む元パスは、生成用のハッシュ名コピーを経由してViteへ取り込みます。不要なコピーは再生成時に削除します。
`src/generated/` を編集・コミットしません。本文は遅延読込、素材はサイズにかかわらずファイル配信です。

分野はコード定義のslugとフォルダ名を一致させ、JSONに `domain`・`body`・`mp4` を持ちます。
AboutのJSONは `summary`・`body` を持ちます。掲載作品はAPI取得のため、ローカルへ保存しません。
公開前に `npm run ci`、表示は `npm run test:e2e` で確認します。
