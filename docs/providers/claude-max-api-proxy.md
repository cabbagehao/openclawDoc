---
summary: "Claude subscription の認証情報を OpenAI 互換 endpoint として公開するコミュニティ製 proxy"
read_when:
  - OpenAI 互換ツールで Claude Max subscription を使いたいとき
  - Claude Code CLI をラップするローカル API サーバーが必要なとき
  - subscription ベースと API キー ベースの Anthropic 利用を比較したいとき
title: "Claude Max API Proxy"
seoTitle: "OpenClawのClaude Max API ProxyでClaudeをOpenAI互換化する設定ガイド"
description: "Claude Max / Pro の契約を OpenAI 互換 API として使うためのガイドです。ローカル proxy の役割、起動方法、OpenClaw 側の接続設定を確認できます。"
x-i18n:
  source_hash: "f1e379025bd26798973e6eff790a4c88835a8d5e3032abcef300d45fdf81afb9"
---
**claude-max-api-proxy** は、Claude Max / Pro subscription を OpenAI 互換 API endpoint として公開するコミュニティ製ツールです。これにより、OpenAI API 形式をサポートする任意のツールから Claude subscription を利用できます。

<Warning>
この経路は、あくまで技術的な互換レイヤーです。Anthropic は過去に、Claude Code 以外での subscription 利用を一部制限したことがあります。利用するかどうかは各自で判断し、依存する前に Anthropic の最新利用規約を確認してください。
</Warning>

## なぜ使うのか

| Approach                | Cost                                                | Best For                                   |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | トークン従量課金（Opus では入力 約 $15/M、出力 約 $75/M） | 本番アプリ、高トラフィック                 |
| Claude Max subscription | 月額 $200 固定                                      | 個人利用、開発、実質的に多めの利用         |

Claude Max subscription を OpenAI 互換ツールから使いたい場合、この proxy によってワークフローによってはコストを抑えられることがあります。ただし、本番用途では API キーの方が依然として方針上明確です。

## 仕組み

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

この proxy は次を行います。

1. `http://localhost:3456/v1/chat/completions` で OpenAI 形式の request を受け取る
2. それを Claude Code CLI の command に変換する
3. OpenAI 形式の response を返す（streaming 対応）

## インストール

```bash
# Requires Node.js 20+ and Claude Code CLI
npm install -g claude-max-api-proxy

# Verify Claude CLI is authenticated
claude --version
```

## 使い方

### サーバーを起動する

```bash
claude-max-api
# Server runs at http://localhost:3456
```

### 動作確認

```bash
# Health check
curl http://localhost:3456/health

# List models
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### OpenClaw で使う

この proxy を、OpenClaw のカスタム OpenAI 互換 endpoint として指定できます。

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

## 利用可能なモデル

| Model ID          | Maps To         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## macOS で自動起動する

proxy を自動起動する LaunchAgent を作成します。

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## Links

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## 注意事項

- これは **コミュニティ製ツール** であり、Anthropic も OpenClaw も公式にはサポートしていません。
- Claude Code CLI で認証済みの、有効な Claude Max / Pro subscription が必要です。
- proxy はローカルで動作し、データを第三者サーバーへ送信しません。
- streaming response は完全にサポートされています。

## 関連項目

- [Anthropic provider](/providers/anthropic) - setup-token または API キーを使う OpenClaw 標準統合
- [OpenAI provider](/providers/openai) - OpenAI / Codex subscription を使う場合
