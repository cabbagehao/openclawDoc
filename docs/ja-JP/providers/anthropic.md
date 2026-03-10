---
summary: "API キーまたは OpenClaw のセットアップ トークンを介して Anthropic Claude を使用する"
read_when:
  - OpenClaw で人体モデルを使用したい
  - API キーの代わりにセットアップ トークンが必要な場合
title: "人間的"
x-i18n:
  source_hash: "2a94be0bbc40cf9b89991a3f7054f5297c8b0f832b8aceb0d561dc7521332885"
---

# 人類（クロード）

Anthropic は **Claude** モデル ファミリを構築し、API 経由でのアクセスを提供します。
OpenClaw では、API キーまたは **セットアップ トークン** を使用して認証できます。

## オプション A: Anthropic API キー

**最適な用途:** 標準 API アクセスと使用量ベースの課金。
Anthropic コンソールで API キーを作成します。

### CLI セットアップ

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### 構成スニペット

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 思考のデフォルト (Claude 4.6)

- Anthropic Claude 4.6 モデルは、明示的思考レベルが設定されていない場合、OpenClaw での `adaptive` 思考をデフォルトとします。
- メッセージごと (`/think:<level>`) またはモデル パラメーターでオーバーライドできます。
  `agents.defaults.models["anthropic/<model>"].params.thinking`。
- 関連する人類ドキュメント:
  - [適応的思考](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [拡張思考](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## プロンプト キャッシュ (Anthropic API)

OpenClaw は、Anthropic のプロンプト キャッシュ機能をサポートしています。これは **API のみ**です。サブスクリプション認証ではキャッシュ設定が考慮されません。

### 構成

モデル構成で `cacheRetention` パラメーターを使用します。

| 値      | キャッシュ期間 | 説明                                 |
| ------- | -------------- | ------------------------------------ |
| `none`  | キャッシュなし | プロンプト キャッシュを無効にする    |
| `short` | 5分            | API キー認証のデフォルト             |
| `long`  | 1時間          | 拡張キャッシュ (ベータ フラグが必要) |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### デフォルトAnthropic API キー認証を使用する場合、OpenClaw はすべての Anthropic モデルに `cacheRetention: "short"` (5 分間のキャッシュ) を自動的に適用します。構成内で `cacheRetention` を明示的に設定することで、これをオーバーライドできます

### エージェントごとのcacheRetentionオーバーライド

モデルレベルのパラメータをベースラインとして使用し、`agents.list[].params` を介して特定のエージェントをオーバーライドします。

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // baseline for most agents
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // override for this agent only
    ],
  },
}
```

キャッシュ関連のパラメータのマージ順序を設定します。

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (`id` と一致、キーによってオーバーライド)

これにより、1 つのエージェントが長期キャッシュを保持し、同じモデル上の別のエージェントがキャッシュを無効にして、バースト性/再利用性の低いトラフィックでの書き込みコストを回避できます。

### 岩盤クロードのメモ

- Bedrock 上の Anthropic Claude モデル (`amazon-bedrock/*anthropic.claude*`) は、構成時に `cacheRetention` パススルーを受け入れます。
- 非人為的岩盤モデルは実行時に `cacheRetention: "none"` に強制されます。
- 明示的な値が設定されていない場合、Anthropic API キーのスマート デフォルトは、Claude-on-Bedrock モデル参照の `cacheRetention: "short"` もシードします。

### 従来のパラメータ

古い `cacheControlTtl` パラメータは、下位互換性のために引き続きサポートされています。

- `"5m"` は `short` にマップされます
- `"1h"` は `long` にマップされます

新しい `cacheRetention` パラメーターに移行することをお勧めします。OpenClaw には、Anthropic API の `extended-cache-ttl-2025-04-11` ベータ フラグが含まれています
リクエスト。プロバイダー ヘッダーをオーバーライドする場合は保持してください ([/gateway/configuration](/gateway/configuration) を参照)。

## 1M コンテキスト ウィンドウ (Anthropic ベータ版)

Anthropic の 1M コンテキスト ウィンドウはベータゲートされています。 OpenClaw ではモデルごとに有効にします
サポートされている Opus/Sonnet モデルの場合は `params.context1m: true` です。

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

OpenClaw はこれを Anthropic の `anthropic-beta: context-1m-2025-08-07` にマッピングします
リクエスト。

これは、`params.context1m` が明示的に `true` に設定されている場合にのみアクティブになります。
そのモデル。

要件: Anthropic は、その資格情報でロングコンテキストの使用を許可する必要があります
(通常は API キーの請求、または追加使用量のあるサブスクリプション アカウント
有効になります）。それ以外の場合、Anthropic は次を返します。
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

注: Anthropic は現在、`context-1m-*` ベータ版リクエストを使用する場合に拒否します。
OAuth/サブスクリプション トークン (`sk-ant-oat-*`)。 OpenClaw は自動的にスキップします
context1m は OAuth 認証用のベータ ヘッダーであり、必要な OAuth ベータを保持します。

## オプション B: クロード セットアップ トークン

**次の場合に最適:** Claude サブスクリプションを使用します。

### セットアップトークンを入手する場所

セットアップ トークンは、Anthropic Console ではなく **Claude Code CLI** によって作成されます。これは**任意のマシン**で実行できます。

```bash
claude setup-token
```

トークンを OpenClaw (ウィザード: **Anthropic トークン (セットアップ トークンの貼り付け)**) に貼り付けるか、ゲートウェイ ホスト上で実行します。

```bash
openclaw models auth setup-token --provider anthropic
```

別のマシンでトークンを生成した場合は、それを貼り付けます。```bash
openclaw models auth paste-token --provider anthropic

````

### CLI セットアップ (セットアップ トークン)

```bash
# Paste a setup-token during onboarding
openclaw onboard --auth-choice setup-token
````

### 構成スニペット (セットアップ トークン)

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 注意事項

- `claude setup-token` を使用してセットアップ トークンを生成して貼り付けるか、ゲートウェイ ホストで `openclaw models auth setup-token` を実行します。
- クロード サブスクリプションで「OAuth トークンの更新に失敗しました…」と表示された場合は、セットアップ トークンを使用して再認証します。 [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription) を参照してください。
- 認証の詳細と再利用ルールは [/concepts/oauth](/concepts/oauth) にあります。

## トラブルシューティング

**401 エラー / トークンが突然無効になります**

- クロードのサブスクリプション認証は期限切れになるか、取り消される可能性があります。 `claude setup-token` を再実行します
  それを **ゲートウェイ ホスト**に貼り付けます。
- Claude CLI ログインが別のマシンに存在する場合は、次を使用します。
  ゲートウェイ ホスト上の `openclaw models auth paste-token --provider anthropic`。

**プロバイダ「anthropic」の API キーが見つかりません**

- 認証は**エージェントごと**です。新しいエージェントはメイン エージェントのキーを継承しません。
- そのエージェントのオンボーディングを再実行するか、セットアップ トークン/API キーを
  ゲートウェイ ホストを確認し、`openclaw models status` で確認します。

**プロファイル `anthropic:default`** の資格情報が見つかりません

- `openclaw models status` を実行して、どの認証プロファイルがアクティブであるかを確認します。
- オンボーディングを再実行するか、そのプロファイルのセットアップ トークン/API キーを貼り付けます。

**利用可能な認証プロファイルがありません (すべてクールダウン中/利用不可)**

- `auth.unusableProfiles` については `openclaw models status --json` を確認してください。
- 別の Anthropic プロファイルを追加するか、クールダウンを待ちます。詳細: [/gateway/troubleshooting](/gateway/troubleshooting) および [/help/faq](/help/faq)。
