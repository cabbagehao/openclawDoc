---
summary: "OpenClaw で Anthropic Claude を API キーまたは setup-token で利用する"
read_when:
  - OpenClaw で Anthropic モデルを使いたいとき
  - API キーの代わりに setup-token を使いたいとき
title: "Anthropic"
x-i18n:
  source_hash: "2a94be0bbc40cf9b89991a3f7054f5297c8b0f832b8aceb0d561dc7521332885"
---

# Anthropic（Claude）

Anthropic は **Claude** モデル ファミリを提供しており、OpenClaw では API キーまたは **setup-token** を使って認証できます。

## Option A: Anthropic API キー

**向いている用途:** 標準的な API 利用と従量課金。
API キーは Anthropic Console で作成します。

### CLI セットアップ

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### 設定例

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Thinking の既定値（Claude 4.6）

* Anthropic Claude 4.6 系モデルでは、thinking level を明示しない場合、OpenClaw は既定で `adaptive` thinking を使います。
* 上書きするには、メッセージ単位の `/think:<level>`、またはモデル パラメータ `agents.defaults.models["anthropic/<model>"].params.thinking` を使用します。
* 関連ドキュメント:
  * [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  * [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Prompt caching（Anthropic API）

OpenClaw は Anthropic の prompt caching をサポートしています。これは **API 利用時のみ** 有効で、subscription 認証では cache 設定は反映されません。

### 設定

モデル設定では `cacheRetention` パラメータを使います。

| 値       | キャッシュ時間 | 説明                      |
| ------- | ------- | ----------------------- |
| `none`  | キャッシュなし | prompt caching を無効化     |
| `short` | 5 分     | API キー認証時の既定値           |
| `long`  | 1 時間    | 長めのキャッシュ（beta flag が必要） |

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

### 既定値

Anthropic API キー認証を使う場合、OpenClaw はすべての Anthropic モデルに `cacheRetention: "short"`（5 分キャッシュ）を自動適用します。必要であれば、設定で明示的に `cacheRetention` を指定して上書きできます。

### エージェントごとの `cacheRetention` 上書き

モデル単位の params を基準にしつつ、`agents.list[].params` で特定エージェントだけ上書きできます。

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

cache 関連パラメータのマージ順序:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params`（`id` が一致するもの。キー単位で上書き）

これにより、同じモデルを使いながら、一方のエージェントでは長めの cache を維持し、別のエージェントでは bursty で再利用性の低いトラフィック向けに caching を無効化できます。

### Bedrock 上の Claude に関する注意

* Bedrock 上の Anthropic Claude モデル（`amazon-bedrock/*anthropic.claude*`）でも、設定されていれば `cacheRetention` がそのまま渡されます。
* Anthropic 以外の Bedrock モデルでは、実行時に `cacheRetention: "none"` が強制されます。
* 明示的な値がない場合、Anthropic API キーの smart default は Claude-on-Bedrock モデル参照にも `cacheRetention: "short"` を適用します。

### 旧パラメータ

古い `cacheControlTtl` パラメータも、後方互換のため引き続きサポートされています。

* `"5m"` は `short` に対応
* `"1h"` は `long` に対応

新しい `cacheRetention` への移行を推奨します。

OpenClaw では Anthropic API request に `extended-cache-ttl-2025-04-11` beta flag を含めています。provider header を上書きする場合でも、この flag は維持してください。詳細は [/gateway/configuration](/gateway/configuration) を参照してください。

## 1M context window（Anthropic beta）

Anthropic の 1M context window は beta 制です。OpenClaw では、対応する Opus / Sonnet モデルごとに `params.context1m: true` を設定して有効化します。

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

OpenClaw はこれを Anthropic request の `anthropic-beta: context-1m-2025-08-07` にマッピングします。

この機能は、そのモデルで `params.context1m` を明示的に `true` にした場合にのみ有効になります。

要件: 使用している認証情報で Anthropic 側が long-context 利用を許可している必要があります。通常は API キー課金、または Extra Usage が有効な subscription アカウントが必要です。そうでない場合、Anthropic は次を返します。
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`

注: Anthropic は現在、OAuth / subscription token（`sk-ant-oat-*`）を使う場合、`context-1m-*` beta request を拒否します。OpenClaw は OAuth 認証時には自動的に context1m beta header を外し、必要な OAuth beta だけを残します。

## Option B: Claude setup-token

**向いている用途:** Claude subscription を使いたい場合。

### setup-token の取得方法

setup-token は Anthropic Console ではなく、**Claude Code CLI** で作成します。これは **どのマシンでも** 実行できます。

```bash
claude setup-token
```

生成したトークンは OpenClaw のウィザード（**Anthropic token (paste setup-token)**）へ貼り付けるか、ゲートウェイ ホスト上で次を実行します。

```bash
openclaw models auth setup-token --provider anthropic
```

別のマシンで生成した場合は、ゲートウェイ ホストで貼り付けます。

```bash
openclaw models auth paste-token --provider anthropic
```

### CLI セットアップ（setup-token）

```bash
# Paste a setup-token during onboarding
openclaw onboard --auth-choice setup-token
```

### 設定例（setup-token）

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 注意事項

* `claude setup-token` で setup-token を生成して貼り付けるか、ゲートウェイ ホストで `openclaw models auth setup-token` を実行してください。
* Claude subscription で `OAuth token refresh failed ...` と表示される場合は、setup-token で再認証してください。詳細は [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription) を参照してください。
* 認証の詳細と再利用ルールは [/concepts/oauth](/concepts/oauth) にあります。

## トラブルシューティング

**401 errors / token suddenly invalid**

* Claude subscription 認証は期限切れや revoke が起こりえます。`claude setup-token` を再実行し、**ゲートウェイ ホスト** に貼り付けてください。
* Claude CLI のログインが別マシン上にある場合は、ゲートウェイ ホストで `openclaw models auth paste-token --provider anthropic` を使ってください。

**No API key found for provider "anthropic"**

* 認証は **エージェント単位** です。新しいエージェントは main エージェントのキーを自動継承しません。
* 該当エージェントの onboarding をやり直すか、ゲートウェイ ホストで setup-token / API キーを追加し、`openclaw models status` で確認してください。

**No credentials found for profile `anthropic:default`**

* `openclaw models status` を実行して、どの auth profile が有効か確認してください。
* onboarding をやり直すか、その profile 用の setup-token / API キーを登録してください。

**No available auth profile (all in cooldown/unavailable)**

* `openclaw models status --json` で `auth.unusableProfiles` を確認してください。
* 別の Anthropic profile を追加するか、cooldown が終わるまで待ってください。

詳しくは [/gateway/troubleshooting](/gateway/troubleshooting) と [/help/faq](/help/faq) を参照してください。
