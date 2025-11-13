# Tsubo Bookmarklet

suumo / ふれんず / アットホーム（athome）/ 積水ハウス不動産（SUMUサイト）/ 三井のリハウスの物件一覧・詳細ページに坪単価を表示するブックマークレットを管理するリポジトリです。

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


## Tampermonkey での自動実行

Athome / ふれんず / SUUMO / 積水ハウス不動産（SUMUサイト）/ 三井のリハウスで自動実行したい場合は、以下のスクリプトを Tampermonkey に読み込ませます：

- **軽量版**: `tampermonkey-tsubo.user.js` - Athome/ふれんず/積水ハウス/三井のリハウス専用
- **フル版**: `tsubo-bookmarklet.user.js` - 全サイト対応 (SUUMO含む)

### 使用手順

1. Tampermonkey の「新規スクリプトを追加」を開く
2. 選択したスクリプトファイルの内容を貼り付け、保存
3. 対象サイトにアクセスすると、自動的に坪単価バッジが挿入されます
   - Angular などにより DOM が後から描画されるページにも追随できるよう、スクリプト内で MutationObserver による再実行を行っています。
   - 手動ブックマークレットと同じロジック (`tsubo-bookmarklet.min.js` をラップ) を使用しています。

## 対応ページ

- ふれんず: 物件一覧 (PC/スマホ)、詳細ページ
- suumo: 中古マンション一覧 (PC/スマホ)、詳細ページ (PC/スマホ)
- アットホーム: 中古マンション一覧 (PC)、詳細ページ (PC/スマホ)
- 積水ハウス不動産（SUMUサイト）: マンション一覧 (PC)、詳細ページ (PC)
- 三井のリハウス: 中古マンション詳細ページ (PC/スマホ)

## 坪単価バッジの表示スタイル

- **標準バッジ** (オレンジ): ふれんず、suumo、アットホーム
- **青色バッジ**: 積水ハウス不動産
- **緑色バッジ** (大きめ): 三井のリハウス専用

## 技術的な特徴

- **価格・面積の自動検出**: 各サイトの DOM 構造に応じて価格と面積情報を自動抽出
- **坪単価計算**: 1㎡ = 0.3025坪 として正確に計算
- **レスポンシブ対応**: PC・スマートフォン両方に対応
- **動的コンテンツ対応**: MutationObserver により後から読み込まれるコンテンツにも対応
- **重複防止**: 同じ要素に複数のバッジが表示されることを防止

## 開発メモ

- コアロジック: `tsubo-bookmarklet.js`
- ミニファイ: `terser`
- ブックマークレット文字列生成: `scripts/make-bookmarklet.js`
