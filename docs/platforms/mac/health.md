---
summary: "macOS アプリがゲートウェイ / Baileys の健全性状態をどのように表示するか"
read_when:
  - Mac アプリの健全性インジケーターのデバッグ
title: "ヘルスチェック"
x-i18n:
  source_hash: "0560e96501ddf53a499f8960cfcf11c2622fcb9056bfd1bcc57876e955cab03d"
---
メニューバー アプリから、リンク済みチャネルの健全性を確認する方法を説明します。

## メニューバー

- ステータス ドットが Baileys の健全性を反映します。
  - 緑: リンク済みで、ソケットが直近で開かれています。
  - オレンジ: 接続中または再試行中です。
  - 赤: ログアウト済み、またはプローブに失敗しています。
- 2 行目には `"linked · auth 12m"` のような状態、または失敗理由が表示されます。
- `Run Health Check` メニュー項目で、その場でプローブを実行できます。

## 設定画面

- **General** タブには Health カードが追加され、リンク済み認証の経過時間、session-store のパスと件数、最終チェック時刻、直近のエラーまたはステータス コード、`Run Health Check` / `Reveal Logs` ボタンが表示されます。
- UI はキャッシュ済みスナップショットを使用するため、即座に表示され、オフライン時も穏当にフォールバックします。
- **Channels** タブでは、WhatsApp / Telegram 向けにチャネル状態と操作を表示します。ログイン QR、ログアウト、プローブ、直近の切断やエラーを確認できます。

## プローブの仕組み

- アプリは `ShellExecutor` 経由で `openclaw health --json` をおよそ 60 秒ごと、またはオンデマンドで実行します。このプローブは認証情報を読み込みますが、メッセージは送信せず、状態だけを報告します。
- 画面のちらつきを避けるため、最後に正常だったスナップショットと最後のエラーは別々にキャッシュされます。それぞれの時刻も表示されます。

## 判断に迷う場合

- [Gateway health](/gateway/health) の CLI フローも引き続き使用できます。`openclaw status`、`openclaw status --deep`、`openclaw health --json` を実行し、あわせて `/tmp/openclaw/openclaw-*.log` を確認して `web-heartbeat` や `web-reconnect` を追跡してください。
