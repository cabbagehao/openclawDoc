---
summary: "チャネルごとの障害パターンと修正方法をまとめた迅速なトラブルシューティングガイド"
read_when:
  - チャネルの接続は確立されているが、応答が返ってこない場合
  - 各プロバイダーの詳細ドキュメントを確認する前に、チャネル固有のチェックを行いたい場合
title: "チャネルのトラブルシューティング"
x-i18n:
  source_hash: "c210b2aefa1d76d42ffed61e7fec02a1f8f6c521ba83e5080a98eb2ce8245696"
---
チャネル自体は接続されているが、期待通りの動作をしない場合は、このページを確認してください。

## 診断コマンド

まず、以下のコマンドを順番に実行してください:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

正常な状態の目安:

- `Runtime: running`
- `RPC probe: ok`
- チャネルプローブの結果が `connected` または `ready` になっている

## WhatsApp

### WhatsApp の障害パターン

| 症状 | 確認事項 | 解決策 |
| :--- | :--- | :--- |
| 接続中だが DM の返信がない | `openclaw pairing list whatsapp` | 送信者を承認するか、DM ポリシー/許可リストを変更します。 |
| グループメッセージが無視される | `requireMention` および構成内のメンションパターンを確認 | ボットにメンションするか、そのグループのメンション制限を緩和します。 |
| 切断と再ログインを繰り返す | `openclaw channels status --probe` + ログ | 再ログインを行い、認証情報ディレクトリが正常であることを確認します。 |

詳細なトラブルシューティング: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

## Telegram

### Telegram の障害パターン

| 症状 | 確認事項 | 解決策 |
| :--- | :--- | :--- |
| `/start` しても返信フローが動かない | `openclaw pairing list telegram` | ペアリングを承認するか、DM ポリシーを変更します。 |
| ボットは起動中だがグループで無反応 | メンション要件とボットのプライバシーモードを確認 | グループの可視性を確保するためにプライバシーモードを無効にするか、ボットにメンションします。 |
| ネットワークエラーで送信に失敗する | ログで Telegram API 呼び出しの失敗を確認 | `api.telegram.org` への DNS/IPv6/プロキシのルーティングを修正します。 |
| アップグレード後に許可リストでブロックされる | `openclaw security audit` と構成の許可リスト | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換えます。 |

詳細なトラブルシューティング: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## Discord

### Discord の障害パターン

| 症状 | 確認事項 | 解決策 |
| :--- | :--- | :--- |
| ボットは起動中だがサーバーで無反応 | `openclaw channels status --probe` | サーバー/チャネルを許可リストに追加し、「Message Content Intent」が有効であることを確認します。 |
| グループメッセージが無視される | ログでメンションによる破棄を確認 | ボットにメンションするか、サーバー/チャネル設定で `requireMention: false` にします。 |
| DM の返信がない | `openclaw pairing list discord` | DM のペアリングを承認するか、DM ポリシーを調整します。 |

詳細なトラブルシューティング: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## Slack

### Slack の障害パターン

| 症状 | 確認事項 | 解決策 |
| :--- | :--- | :--- |
| Socket Mode で接続中だが無反応 | `openclaw channels status --probe` | App Token, Bot Token および必要なスコープを確認します。 |
| DM がブロックされる | `openclaw pairing list slack` | ペアリングを承認するか、DM ポリシーを緩和します。 |
| チャネルメッセージが無視される | `groupPolicy` とチャネルの許可リストを確認 | チャネルを許可リストに追加するか、ポリシーを `open` に変更します。 |

詳細なトラブルシューティング: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage および BlueBubbles

### iMessage / BlueBubbles の障害パターン

| 症状 | 確認事項 | 解決策 |
| :--- | :--- | :--- |
| インバウンドイベントが届かない | Webhook/サーバーの到達可能性とアプリの権限を確認 | Webhook URL または BlueBubbles サーバーの状態を修正します。 |
| macOS で送信はできるが受信できない | macOS の「メッセージ」自動化に関するプライバシー権限 | TCC 権限を再付与し、チャネルプロセスを再起動します。 |
| DM 送信者がブロックされる | `openclaw pairing list imessage` (または `bluebubbles`) | ペアリングを承認するか、許可リストを更新します。 |

詳細なトラブルシューティング:
- [/channels/imessage#troubleshooting-macos-privacy-and-security-tcc](/channels/imessage#troubleshooting-macos-privacy-and-security-tcc)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## Signal

### Signal の障害パターン

| 症状 | 確認事項 | 解決策 |
| :--- | :--- | :--- |
| デーモンは到達可能だがボットが無反応 | `openclaw channels status --probe` | `signal-cli` デーモンの URL/アカウントおよび受信モードを確認します。 |
| DM がブロックされる | `openclaw pairing list signal` | 送信者を承認するか、DM ポリシーを調整します。 |
| グループでの返信がトリガーされない | グループの許可リストとメンションパターンを確認 | 送信者/グループを追加するか、制限を緩めます。 |

詳細なトラブルシューティング: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## Matrix

### Matrix の障害パターン

| 症状 | 確認事項 | 解決策 |
| :--- | :--- | :--- |
| ログイン中だがルームメッセージを無視する | `openclaw channels status --probe` | `groupPolicy` とルームの許可リストを確認します。 |
| DM が処理されない | `openclaw pairing list matrix` | 送信者を承認するか、DM ポリシーを調整します。 |
| 暗号化されたルームで失敗する | 暗号化モジュールと暗号化設定を確認 | 暗号化サポートを有効にし、ルームに再参加または同期します。 |

詳細なトラブルシューティング: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
