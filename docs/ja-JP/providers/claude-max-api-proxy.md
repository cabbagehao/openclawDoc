---
summary: "Claude サブスクリプション認証情報を OpenAI 互換エンドポイントとして公開するコミュニティ プロキシ"
read_when:
  - OpenAI 互換ツールで Claude Max サブスクリプションを使用したい
  - Claude Code CLI をラップするローカル API サーバーが必要な場合
  - サブスクリプションベースと API キーベースの Anthropic アクセスを評価したい
title: "Claude Max API プロキシ"
x-i18n:
  source_hash: "f1e379025bd26798973e6eff790a4c88835a8d5e3032abcef300d45fdf81afb9"
---

# クロード・マックス API プロキシ

**claude-max-api-proxy** は、Claude Max/Pro サブスクリプションを OpenAI 互換 API エンドポイントとして公開するコミュニティ ツールです。これにより、OpenAI API 形式をサポートする任意のツールでサブスクリプションを使用できるようになります。

<Warning>
このパスは技術的な互換性のみを目的としています。 Anthropic が一部のサブスクリプションをブロックしました
過去にクロード コード以外で使用されていた。使用するかどうかは自分で決める必要があります
それに依存する前に、Anthropic の現在の条件を確認してください。
</Warning>

## これを使用する理由

| アプローチ                   | コスト                                                              | 最適な用途                   |
| ---------------------------- | ------------------------------------------------------------------- | ---------------------------- |
| 人類API                      | トークンごとの支払い (Opus の場合、入力 ~15 ドル/M、出力 75 ドル/M) | 本番アプリ、大容量           |
| クロード・マックスの定期購読 | $200/月一律                                                         | 個人使用、開発、無制限の使用 |

Claude Max サブスクリプションを持っていて、それを OpenAI 互換ツールで使用したい場合、このプロキシによって一部のワークフローのコストが削減される可能性があります。 API キーは、運用環境で使用するためのより明確なポリシー パスのままです。

## 仕組み

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

代理人:1. `http://localhost:3456/v1/chat/completions` で OpenAI 形式のリクエストを受け入れます 2. クロードコードの CLI コマンドに変換します。3. OpenAI 形式で応答を返します (ストリーミング対応)

## インストール

```bash
# Requires Node.js 20+ and Claude Code CLI
npm install -g claude-max-api-proxy

# Verify Claude CLI is authenticated
claude --version
```

## 使用法

### サーバーを起動します

```bash
claude-max-api
# Server runs at http://localhost:3456
```

### テストしてみよう

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

### OpenClaw を使用する

プロキシで OpenClaw をカスタム OpenAI 互換エンドポイントとして指定できます。

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

| モデルID          | マップ先             |
| ----------------- | -------------------- |
| `claude-opus-4`   | クロード作品4        |
| `claude-sonnet-4` | クロード・ソネット 4 |
| `claude-haiku-4`  | クロード俳句4        |

## macOS での自動起動

プロキシを自動的に実行する LaunchAgent を作成します。

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

## リンク

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **問題:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## 注意事項

- これは **コミュニティ ツール** であり、Anthropic または OpenClaw によって正式にサポートされていません
- Claude Code CLI が認証されたアクティブな Claude Max/Pro サブスクリプションが必要です
- プロキシはローカルで実行され、サードパーティのサーバーにデータを送信しません。
- ストリーミング応答が完全にサポートされています

## 関連項目- [Anthropic プロバイダー](/providers/anthropic) - Claude セットアップ トークンまたは API キーとのネイティブ OpenClaw 統合

- [OpenAI プロバイダー](/providers/openai) - OpenAI/Codex サブスクリプションの場合
