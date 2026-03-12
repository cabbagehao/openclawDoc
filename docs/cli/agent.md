---
summary: "`openclaw agent`のCLIリファレンス（Gateway経由で1つのエージェントターンを送信）"
read_when:
  - スクリプトから1つのエージェントターンを実行したい場合（オプションで返信を配信）
title: "agent"
seoTitle: "OpenClaw CLI: openclaw agent コマンドの使い方と主要オプション・実行例"
description: "Gateway経由でエージェントターンを実行します（埋め込みには--localを使用）。設定されたエージェントを直接ターゲットにするには、--agent を使用します。"
---
Gateway経由でエージェントターンを実行します（埋め込みには`--local`を使用）。
設定されたエージェントを直接ターゲットにするには、`--agent <id>`を使用します。

関連:

- エージェント送信ツール: [Agent send](/tools/agent-send)

## 例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```

## 注意事項

- このコマンドが`models.json`の再生成をトリガーする場合、SecretRefで管理されたプロバイダー認証情報は、解決されたシークレットプレーンテキストではなく、非シークレットマーカー（例: 環境変数名または`secretref-managed`）として永続化されます。
