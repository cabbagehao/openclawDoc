---
summary: "チャネルごとの障害シグネチャと修正を使用した迅速なチャネル レベルのトラブルシューティング"
read_when:
  - チャネルトランスポートは接続されていると表示されますが、応答が失敗します
  - プロバイダーの詳細なドキュメントを作成する前に、チャネル固有のチェックが必要です
title: "チャンネルのトラブルシューティング"
x-i18n:
  source_hash: "c210b2aefa1d76d42ffed61e7fec02a1f8f6c521ba83e5080a98eb2ce8245696"
---

# チャネルのトラブルシューティング

チャネルは接続したが動作が間違っている場合にこのページを使用します。

## コマンドラダー

最初にこれらを順番に実行します。

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

健全なベースライン:

- `Runtime: running`
- `RPC probe: ok`
- チャネルプローブは接続/準備完了を示します

## WhatsApp

### WhatsApp の失敗の兆候

| 症状                                      | 最速チェック                                          | 修正                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| 接続はできましたが、DM の返信がありません | `openclaw pairing list whatsapp`                      | 送信者を承認するか、DM ポリシー/許可リストを切り替えます。                |
| グループメッセージは無視される            | `requireMention` + 構成内のパターンを確認してください | ボットにメンションするか、そのグループのメンション ポリシーを緩和します。 |
| ランダムな切断/再ログイン ループ          | `openclaw channels status --probe` + ログ             | 再ログインし、資格情報ディレクトリが正常であることを確認します。          |

完全なトラブルシューティング: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

## Telegram

### テレグラム失敗の署名|症状 |最速チェック |修正 |

| --------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `/start` ですが、使用可能な応答フローがありません | `openclaw pairing list telegram` |ペアリングを承認するか、DM ポリシーを変更します。 |
|ボットはオンラインだがグループは沈黙 |メンション要件とボットのプライバシー モードを確認する |グループの可視性またはボットへのメンションのプライバシー モードを無効にします。 |
|ネットワークエラーによる送信失敗 | Telegram API 呼び出しの失敗についてログを検査する | DNS/IPv6/プロキシ ルーティングを `api.telegram.org` に修正します。 |
|アップグレードすると許可リストによりブロックされる | `openclaw security audit` と構成許可リスト | `openclaw doctor --fix` を実行するか、`@username` を数値の送信者 ID に置き換えます。 |

完全なトラブルシューティング: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)

## 不和

### Discord の失敗の署名|症状 |最速チェック |修正 |

| ------------------------------- | ----------------------------------- | -------------------------------------------------------- |
|ボットはオンラインですがギルドからの応答はありません | `openclaw channels status --probe` |ギルド/チャネルを許可し、メッセージの内容の意図を確認します。 |
|グループメッセージは無視される |ゲート ドロップについての言及がないかログを確認してください。ボットに言及するか、ギルド/チャンネル `requireMention: false` を設定してください。 |
| DMの返信がありません | `openclaw pairing list discord` | DM ペアリングを承認するか、DM ポリシーを調整します。 |

完全なトラブルシューティング: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)

## スラック

### Slack の失敗のサイン|症状 |最速チェック |修正 |

| -------------------------------------- | -------------------------------------- | -------------------------------------------------- |
|ソケット モードで接続されましたが応答がありません | `openclaw channels status --probe` |アプリトークン + ボットトークンと必要なスコープを確認します。 |
| DMはブロックされました | `openclaw pairing list slack` |ペアリングを承認するか、DM ポリシーを緩和します。 |
|チャンネルメッセージは無視されました | `groupPolicy` とチャネル許可リストを確認してください。チャネルまたはスイッチ ポリシーを `open` に許可します。 |

完全なトラブルシューティング: [/channels/slack#troubleshooting](/channels/slack#troubleshooting)

## iMessage と BlueBubbles

### iMessage と BlueBubbles の失敗の署名|症状 |最速チェック |修正 |

| -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
|インバウンドイベントはありません | Webhook/サーバーの到達可能性とアプリの権限を確認する | Webhook URL または BlueBubbles サーバーの状態を修正します。 |
| macOS では送信できるが受信できない |メッセージの自動化に対する macOS のプライバシー許可を確認する | TCC 権限を再付与し、チャネル プロセスを再起動します。 |
| DM送信者がブロックされました | `openclaw pairing list imessage` または `openclaw pairing list bluebubbles` |ペアリングを承認するか、許可リストを更新します。 |

完全なトラブルシューティング:

- [/channels/imessage#troubleshooting-macos-privacy-and-security-tcc](/channels/imessage#troubleshooting-macos-privacy-and-security-tcc)
- [/channels/bluebubbles#troubleshooting](/channels/bluebubbles#troubleshooting)

## 信号

### Signal障害の署名|症状 |最速チェック |修正 |

| ------------------------------- | ------------------------------------------ | -------------------------------------------------------- |
|デーモンは到達可能だがボットはサイレント | `openclaw channels status --probe` | `signal-cli` デーモンの URL/アカウントと受信モードを確認します。 |
| DMはブロックされました | `openclaw pairing list signal` |送信者を承認するか、DM ポリシーを調整します。 |
|グループ返信はトリガーされません |グループの許可リストとメンション パターンを確認する |送信者/グループを追加するか、ゲートを緩めます。 |

完全なトラブルシューティング: [/channels/signal#troubleshooting](/channels/signal#troubleshooting)

## マトリックス

### マトリックス失敗の兆候|症状 |最速チェック |修正 |

| ----------------------------------- | -------------------------------------------- | ----------------------------------------------- |
|ログインしていますが、ルームメッセージを無視します。 `openclaw channels status --probe` | `groupPolicy` と部屋の許可リストを確認してください。 |
| DM は処理されません | `openclaw pairing list matrix` |送信者を承認するか、DM ポリシーを調整します。 |
|暗号化された部屋は失敗します |暗号化モジュールと暗号化設定を確認する |暗号化サポートを有効にし、ルームに再参加/同期します。 |

完全なトラブルシューティング: [/channels/matrix#troubleshooting](/channels/matrix#troubleshooting)
