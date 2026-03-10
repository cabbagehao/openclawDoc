---
summary: "チャネル接続のヘルスチェック手順"
read_when:
  - WhatsApp チャネルの健全性を診断する
title: "ヘルスチェック"
x-i18n:
  source_hash: "74f242e98244c135e1322682ed6b67d70f3b404aca783b1bb5de96a27c2c1b01"
---

# ヘルスチェック (CLI)

推測せずにチャネルの接続を確認するための短いガイド。

## クイックチェック

- `openclaw status` — ローカル サマリー: ゲートウェイの到達可能性/モード、更新ヒント、リンクされたチャネル認証期間、セッション + 最近のアクティビティ。
- `openclaw status --all` — 完全なローカル診断 (読み取り専用、カラー、デバッグ用に貼り付けても安全)。
- `openclaw status --deep` — 実行中のゲートウェイもプローブします (サポートされている場合はチャネルごとのプローブ)。
- `openclaw health --json` — 実行中のゲートウェイに完全なヘルス スナップショットを要求します (WS のみ。直接のベイリー ソケットはありません)。
- `/status` を WhatsApp/WebChat のスタンドアロン メッセージとして送信すると、エージェントを呼び出さずにステータス応答を取得できます。
- ログ: 末尾 `/tmp/openclaw/openclaw-*.log` と `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound` のフィルター。

## 詳細な診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (mtime は最新である必要があります)。
- セッション ストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (パスは構成でオーバーライドできます)。受信者の数と最近の受信者は、`status` 経由で表示されます。
- 再リンク フロー: ステータス コード 409 ～ 515 または `loggedOut` がログに表示される場合、`openclaw channels logout && openclaw channels login --verbose`。 (注: QR ログイン フローは、ペアリング後にステータス 515 で 1 回自動再起動されます。)

## 何かが失敗したとき- `logged out` またはステータス 409 ～ 515 → `openclaw channels logout`、次に `openclaw channels login` と再リンクします

- ゲートウェイに到達できない → 開始します: `openclaw gateway --port 18789` (ポートが使用中の場合は `--force` を使用します)。
- 受信メッセージがない → リンクされた電話がオンラインであり、送信者が許可されていることを確認します (`channels.whatsapp.allowFrom`)。グループ チャットの場合は、許可リストとメンション ルールが一致していることを確認してください (`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`)。

## 専用の「ヘルス」コマンド

`openclaw health --json` は、実行中のゲートウェイにヘルス スナップショットを要求します (CLI からの直接チャネル ソケットはありません)。リンクされた認証/認証期間 (利用可能な場合)、チャネルごとのプローブの概要、セッション ストアの概要、およびプローブ期間をレポートします。ゲートウェイに到達できない場合、またはプローブが失敗またはタイムアウトした場合、ゼロ以外で終了します。 `--timeout <ms>` を使用して、10 秒のデフォルトをオーバーライドします。
