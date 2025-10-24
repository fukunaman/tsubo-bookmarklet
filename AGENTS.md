# Agent Notes

- ビルドコマンドは `pnpm run build:bookmarklet`。`tsubo-bookmarklet.js` を編集したら必ず実行し、`tsubo-bookmarklet.min.js` と `tsubo-bookmarklet.bookmarklet.txt` を更新する。
- Tampermonkey 用スクリプト `tsubo-bookmarklet.user.js` は `tsubo-bookmarklet.js` と同じロジックを内包している。対応サイトを追加した場合は両方を同期させる。
- サイトごとの DOM は頻繁に変わるため、必要に応じて `curl` などで静的 HTML を取得しつつ、class 名の揺れに備えてフォールバックロジックを入れる。
- 既存のバッジ挿入処理は `dataset.tbBadgeInjected` と `.tb` の存在チェックで多重追加を防いでいる。新しい挿入箇所でも同じガードを忘れない。
- `MutationObserver` により再描画に追随しているため、`main()` 内では副作用を最小にし、同じ要素へ二重にスタイルを適用しないよう注意する。
