---
summary: "スクリプトによるオンボーディングと OpenClaw CLI のエージェントセットアップ"
read_when:
  - スクリプトや CI でオンボーディングを自動化する場合
  - 特定のプロバイダー向けの非対話型の例が必要な場合
title: "CLI 自動化"
sidebarTitle: "CLI 自動化"
---

# CLI 自動化 (CLI Automation)

`openclaw onboard` を自動化するには `--non-interactive` を使用します。

<Note>
`--json` は非対話モードを意味しません。スクリプトでは `--non-interactive` (および `--workspace`) を使用してください。
</Note>

## 基本的な非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

機械可読な概要を取得するには `--json` を追加します。

平文の値の代わりに環境変数ベースの参照（ref）を認証プロファイルに保存するには、`--secret-input-mode ref` を使用します。
環境変数参照と設定済みプロバイダー参照 (`file` または `exec`) 間の対話的な選択は、オンボーディングウィザードのフローで利用可能です。

非対話型の `ref` モードでは、プロバイダーの環境変数がプロセス環境で設定されている必要があります。
対応する環境変数が存在しない状態でインラインキーフラグを渡すと、即座にエラーになります。

例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## プロバイダー固有の例

<AccordionGroup>
  <Accordion title="Gemini の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Z.AI の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Vercel AI Gateway の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Cloudflare AI Gateway の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Moonshot の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Mistral の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Synthetic の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="OpenCode Zen の例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="カスタムプロバイダーの例">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` はオプションです。省略した場合、オンボーディングは `CUSTOM_API_KEY` をチェックします。

    Ref モードのバリアント:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    このモードでは、オンボーディングは `apiKey` を `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }` として保存します。

  </Accordion>
</AccordionGroup>

## 別のエージェントを追加する

`openclaw agents add <name>` を使用して、独自のワークスペース、セッション、および認証プロファイルを持つ別のエージェントを作成します。`--workspace` を付けずに実行すると、ウィザードが起動します。

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

設定される内容:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意事項:

- デフォルトのワークスペースは `~/.openclaw/workspace-<agentId>` に従います。
- 受信メッセージをルーティングするための `bindings` を追加します（ウィザードでこれを行うことができます）。
- 非対話型フラグ: `--model`, `--agent-dir`, `--bind`, `--non-interactive`。

## 関連ドキュメント

- オンボーディングハブ: [オンボーディングウィザード (CLI)](/start/wizard)
- 完全なリファレンス: [CLI オンボーディングリファレンス](/start/wizard-cli-reference)
- コマンドリファレンス: [`openclaw onboard`](/cli/onboard)
