# Tsubo Bookmarklet

suumo / ふれんず / アットホーム（athome）の物件一覧・詳細ページに坪単価を表示するブックマークレットを管理するリポジトリです。

## セットアップ

```bash
git clone <repo>
cd <repo>
pnpm install
```

## ビルド

```bash
pnpm run build:bookmarklet
```

ビルドすると `tsubo-bookmarklet.js` を基に `tsubo-bookmarklet.min.js` が生成されます。ブックマークレットとして利用したい場合は以下を実行して 1 行コードを出力してください。

```bash
cat tsubo-bookmarklet.bookmarklet.txt
```

## ブラウザでの利用手順

1. 生成した `tsubo-bookmarklet.bookmarklet.txt` を開き、全文をコピー。
2. ブラウザのブックマークの URL 欄に貼り付ける。
3. 対応サイトの物件一覧または詳細ページを開いてブックマークを実行すると坪単価が表示されます。

## 対応ページ

- ふれんず: 物件一覧 (PC/スマホ)、詳細ページ
- suumo: 中古マンション一覧 (PC/スマホ)、詳細ページ (PC/スマホ)
- アットホーム: 中古マンション一覧 (PC)、詳細ページ (PC/スマホ)

## 開発メモ

- コアロジック: `tsubo-bookmarklet.js`
- ミニファイ: `terser`
- ブックマークレット文字列生成: `scripts/make-bookmarklet.js`
