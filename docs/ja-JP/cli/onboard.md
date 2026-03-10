---
summary: "「openclaw オンボード」の CLI リファレンス (対話型オンボーディング ウィザード)"
read_when:
  - ゲートウェイ、ワークスペース、認証、チャネル、スキルのガイド付きセットアップが必要な場合
title: "機内で"
x-i18n:
  source_hash: "496651939f5f21f9b3921f38396ad1c59b450a51eb06f13d41f66dbb38053d57"
---

# `openclaw onboard`

インタラクティブなオンボーディング ウィザード (ローカルまたはリモートのゲートウェイ セットアップ)。

## 関連ガイド

- CLI オンボーディング ハブ: [オンボーディング ウィザード (CLI)](/start/wizard)
- オンボーディングの概要: [オンボーディングの概要](/start/onboarding-overview)
- CLI オンボーディング リファレンス: [CLI オンボーディング リファレンス](/start/wizard-cli-reference)
- CLI 自動化: [CLI 自動化](/start/wizard-cli-automation)
- macOS オンボーディング: [オンボーディング (macOS アプリ)](/start/onboarding)

## 例

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

プレーンテキストのプライベート ネットワーク `ws://` ターゲット (信頼されたネットワークのみ) の場合、設定します
オンボーディング プロセス環境の `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`。

非対話型カスタムプロバイダー:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` は、非対話モードではオプションです。省略した場合、オンボーディングでは `CUSTOM_API_KEY` がチェックされます。

プロバイダーキーをプレーンテキストではなく参照として保存します。

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

`--secret-input-mode ref` を使用すると、オンボーディングはプレーンテキストのキー値の代わりに env-backed refs を書き込みます。
認証プロファイルをサポートするプロバイダーの場合、これにより `keyRef` エントリが書き込まれます。カスタムプロバイダーの場合、これは環境参照として `models.providers.<id>.apiKey` を書き込みます (例: `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`)。

非対話型 `ref` モード コントラクト:- オンボーディング プロセス環境でプロバイダーの環境変数を設定します (`OPENAI_API_KEY` など)。

- その環境変数も設定されていない限り、インライン キー フラグ (`--openai-api-key` など) を渡さないでください。
- 必要な環境変数なしでインライン キー フラグが渡された場合、オンボーディングはガイダンスに従ってすぐに失敗します。

非対話モードのゲートウェイ トークン オプション:

- `--gateway-auth token --gateway-token <token>` は平文トークンを保管します。
- `--gateway-auth token --gateway-token-ref-env <name>` は、`gateway.auth.token` を環境 SecretRef として保存します。
- `--gateway-token` と `--gateway-token-ref-env` は相互に排他的です。
- `--gateway-token-ref-env` では、オンボーディング プロセス環境に空ではない環境変数が必要です。
- `--install-daemon` では、トークン認証にトークンが必要な場合、SecretRef 管理のゲートウェイ トークンは検証されますが、スーパーバイザー サービス環境のメタデータに解決されたプレーンテキストとして保持されません。
- `--install-daemon` では、トークン モードにトークンが必要で、構成されたトークン SecretRef が未解決の場合、オンボードは修復ガイダンスで失敗して終了します。
- `--install-daemon` では、`gateway.auth.token` と `gateway.auth.password` の両方が構成され、`gateway.auth.mode` が設定されていない場合、モードが明示的に設定されるまでオンボード ブロックがインストールされます。

例:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

参照モードによるインタラクティブなオンボーディング動作:- プロンプトが表示されたら、**シークレット参照を使用** を選択します。

- 次に、次のいずれかを選択します。
  - 環境変数
  - 設定されたシークレットプロバイダー (`file` または `exec`)
- オンボーディングでは、ref を保存する前に高速プリフライト検証が実行されます。
  - 検証が失敗した場合、オンボーディングでエラーが表示され、再試行できます。

非対話型 Z.AI エンドポイントの選択肢:

注: `--auth-choice zai-api-key` は、キーに最適な Z.AI エンドポイントを自動検出するようになりました (`zai/glm-5` を使用した一般的な API を優先します)。
特に GLM コーディング プラン エンドポイントが必要な場合は、`zai-coding-global` または `zai-coding-cn` を選択します。

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

非インタラクティブなミストラルの例:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

フローメモ:

- `quickstart`: 最小限のプロンプトで、ゲートウェイ トークンを自動生成します。
- `manual`: ポート/バインド/認証の完全なプロンプト (`advanced` のエイリアス)。
- ローカル オンボーディング DM スコープの動作: [CLI オンボーディング リファレンス](/start/wizard-cli-reference#outputs-and-internals)。
- 最速の最初のチャット: `openclaw dashboard` (コントロール UI、チャネル設定なし)。
- カスタム プロバイダー: OpenAI または Anthropic 互換エンドポイントに接続します。
  リストされていないホスト型プロバイダーも含みます。自動検出するには「不明」を使用します。

## 一般的なフォローアップ コマンド

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` は、非対話型モードを意味するものではありません。スクリプトには `--non-interactive` を使用します。
</Note>
