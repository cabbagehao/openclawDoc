---
summary: "`openclaw onboard` の CLI リファレンス (対話形式のオンボーディングウィザード)"
read_when:
  - ゲートウェイ、ワークスペース、認証、チャネル、およびスキルのガイド付きセットアップを行いたい場合
title: "onboard"
x-i18n:
  source_hash: "496651939f5f21f9b3921f38396ad1c59b450a51eb06f13d41f66dbb38053d57"
---
対話形式のオンボーディングウィザード（ローカルまたはリモートゲートウェイのセットアップ）を実行します。

## 関連ドキュメント

- オンボーディングハブ: [オンボーディングウィザード (CLI)](/start/wizard)
- オンボーディングの概要: [オンボーディングの概要](/start/onboarding-overview)
- CLI オンボーディングリファレンス: [CLI オンボーディング詳細](/start/wizard-cli-reference)
- CLI 自動化: [CLI 自動化](/start/wizard-cli-automation)
- macOS 版オンボーディング: [オンボーディング (macOS アプリ)](/start/onboarding)

## 実行例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

信頼されたネットワーク内のプライベートな `ws://` ターゲットに対して平文で接続する場合は、実行環境で `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` を設定してください。

非対話形式でのカスタムプロバイダー設定:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` は非対話モードでは任意です。省略された場合、`CUSTOM_API_KEY` 環境変数がチェックされます。

プロバイダーキーを平文ではなく参照（ref）として保存する:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を指定すると、平文のキー値ではなく、環境変数を参照する SecretRef が書き込まれます。認証プロファイルに対応したプロバイダーでは `keyRef` エントリが、カスタムプロバイダーでは `models.providers.<id>.apiKey` が環境変数参照（例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`）として保存されます。

非対話形式の `ref` モードにおけるルール:

- プロバイダーの環境変数（例: `OPENAI_API_KEY`）を事前に設定しておいてください。
- その環境変数が設定されていない状態で、インラインのキー指定フラグ（例: `--openai-api-key`）を渡さないでください。
- 必要な環境変数が存在しない状態でインラインフラグが渡された場合、オンボーディングは即座にエラーとなります。

非対話モードにおけるゲートウェイのトークン指定:

- `--gateway-auth token --gateway-token <token>` は平文のトークンを保存します。
- `--gateway-auth token --gateway-token-ref-env <name>` は `gateway.auth.token` を環境変数参照として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は同時には指定できません。
- `--gateway-token-ref-env` を使用する場合、指定した環境変数が空でない必要があります。
- `--install-daemon` と併用し、トークン認証が必要な場合、SecretRef で管理されたトークンは妥当性の検証は行われますが、サービス環境設定には解決された平文のトークンではなく参照形式のまま保持されます。
- トークン認証が必要かつ SecretRef が解決できない状態で `--install-daemon` を実行すると、インストールはブロックされます。
- `gateway.auth.token` と `gateway.auth.password` の両方が構成され、かつ `gateway.auth.mode` が未設定の場合、モードが明示的に設定されるまでデーモンのインストールはブロックされます。

実行例:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

対話形式のオンボーディングにおける参照モードの動作:

- プロンプトが表示されたら **Use secret reference** を選択します。
- 次に以下からソースを選択します:
  - Environment variable (環境変数)
  - 構成済みのシークレットプロバイダー (`file` または `exec`)
- ref を保存する前に、オンボーディングプログラムが簡易的な検証を行います。
  - 検証に失敗した場合はエラーが表示され、再試行できます。

非対話形式での Z.AI エンドポイントの選択:

注: `--auth-choice zai-api-key` は、指定されたキーに最適な Z.AI エンドポイント（通常は `zai/glm-5` などの一般 API）を自動検出するようになりました。GLM コーディングプラン専用のエンドポイントを使用したい場合は、`zai-coding-global` または `zai-coding-cn` を選択してください。

```bash
# プロンプトなしでのエンドポイント選択例
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"
```

非対話形式での Mistral の例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

フローに関する補足事項:

- `quickstart`: 最小限のプロンプトで進め、ゲートウェイトークンを自動生成します。
- `manual`: ポート、バインド、認証などをすべて個別に設定します（`advanced` の別名）。
- ローカル環境の DM スコープ設定: [CLI オンボーディング詳細](/start/wizard-cli-reference#outputs-and-internals) を参照してください。
- 最速でチャットを始めるには: `openclaw dashboard` を実行します（コントロール UI を使用。チャネル設定は不要です）。
- カスタムプロバイダー: OpenAI または Anthropic 互換のエンドポイントであれば、一覧にないプロバイダーでも接続可能です。自動検出には `Unknown` を選択してください。

## オンボーディング後によく使われるコマンド

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` フラグを指定しても、自動的に非対話モードにはなりません。スクリプト等で使用する場合は必ず `--non-interactive` を指定してください。
</Note>
