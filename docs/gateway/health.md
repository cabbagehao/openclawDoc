---
summary: "チャネル接続のヘルスチェック（健全性確認）手順"
description: "openclaw status と health コマンドを使って、チャネル接続の状態確認、詳細診断、失敗時の対応パターンを追えるガイドです。"
read_when:
  - 各チャネル（WhatsApp など）の健全性を診断する場合
title: "OpenClaw チャネル接続ヘルスチェックと障害診断・復旧ガイド"
x-i18n:
  source_hash: "74f242e98244c135e1322682ed6b67d70f3b404aca783b1bb5de96a27c2c1b01"
---
各チャネルの接続状態を推測に頼らず確実に確認するための、短いガイドです。

## クイックチェック

- `openclaw status`: ローカル環境のサマリーを表示します。ゲートウェイへの到達可能性、動作モード、アップデートの有無、リンクされたチャネル認証の経過時間、セッション一覧と最近のアクティビティが含まれます。
- `openclaw status --all`: 完全なローカル診断を実行します。読み取り専用で色分けされており、デバッグ用にコピー＆ペーストするのに適しています。
- `openclaw status --deep`: 稼働中のゲートウェイに対しても問い合わせ（プローブ）を行い、対応しているチャネルのライブステータスを確認します。
- `openclaw health --json`: 稼働中のゲートウェイから完全なヘルスのスナップショットを取得します（WebSocket 経由での確認。個別のチャネルソケットを直接操作することはありません）。
- チャット内での `/status`: WhatsApp や WebChat などで独立したメッセージとして `/status` を送信すると、エージェントを実行することなく、その場のステータスを返信させることができます。
- ログの確認: `/tmp/openclaw/openclaw-*.log` を tail し、`web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound` といったキーワードでフィルタリングしてください。

## 詳細な診断

- ディスク上の認証情報: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` の更新日時（mtime）が最近のものであるか確認してください。
- セッションストア: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`（パスは構成で変更可能です）。セッション数や最近の通信相手は `status` コマンドで確認できます。
- 再リンク（再ログイン）フロー: ログにステータスコード 409〜515 や `loggedOut` が表示される場合は、`openclaw channels logout` を実行した後に `openclaw channels login --verbose` でリンクし直してください。（注: QR ログインフローでは、ペアリング後のステータス 515 の際に一度だけ自動的に再起動します）。

## 失敗時の対応パターン

- **「Logged out」またはステータス 409〜515**: `openclaw channels logout` の後に `openclaw channels login` を行い、再度リンクしてください。
- **ゲートウェイに接続できない**: `openclaw gateway --port 18789` を実行して起動してください（ポートが塞がっている場合は `--force` を検討してください）。
- **メッセージが届かない**: リンクされたスマートフォンがオンラインであること、および送信者が `channels.whatsapp.allowFrom` で許可されていることを確認してください。グループチャットの場合は、許可リスト設定（`channels.whatsapp.groups`）やメンションパターン設定（`agents.list[].groupChat.mentionPatterns`）が一致しているか確認してください。

## 専用の `health` コマンド

`openclaw health --json` は、稼働中のゲートウェイに現在のヘルス状況を問い合わせます（CLI からチャネルのソケットを直接開くことはありません）。リンクされた認証情報の経過時間、チャネルごとのプローブ結果、セッションストアのサマリー、およびプローブに要した時間が報告されます。ゲートウェイに到達できない場合や、プローブが失敗・タイムアウトした場合は、0 以外の終了コードで終了します。デフォルトのタイムアウト（10 秒）を変更するには `--timeout <ms>` を使用してください。
