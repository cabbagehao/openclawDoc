---
summary: "OpenClaw で Amazon Bedrock (Converse API) モデルを使用する"
read_when:
  - OpenClaw で Amazon Bedrock モデルを使用したい
  - モデル呼び出しには AWS 認証情報/リージョン設定が必要です
title: "アマゾンの岩盤"
x-i18n:
  source_hash: "73b0472f571ee6eb9c1b0d851ce94208914f2fa24eacc3b92a571aeb162dbca8"
---

# アマゾンの岩盤

OpenClaw は、pi‑ai の **Bedrock Converse** を介して **Amazon Bedrock** モデルを使用できます
ストリーミングプロバイダー。 Bedrock 認証では **AWS SDK のデフォルトの認証情報チェーン** を使用します。
APIキーではありません。

## pi‑ai がサポートするもの

- プロバイダー: `amazon-bedrock`
- API: `bedrock-converse-stream`
- 認証: AWS 認証情報 (環境変数、共有設定、またはインスタンス ロール)
- リージョン: `AWS_REGION` または `AWS_DEFAULT_REGION` (デフォルト: `us-east-1`)

## 自動モデル検出

AWS 認証情報が検出された場合、OpenClaw は自動的に Bedrock を検出できます
**ストリーミング** と **テキスト出力** をサポートするモデル。ディスカバリーの用途
`bedrock:ListFoundationModels` がキャッシュされます (デフォルト: 1 時間)。

構成オプションは `models.bedrockDiscovery` の下にあります。

```json5
{
  models: {
    bedrockDiscovery: {
      enabled: true,
      region: "us-east-1",
      providerFilter: ["anthropic", "amazon"],
      refreshInterval: 3600,
      defaultContextWindow: 32000,
      defaultMaxTokens: 4096,
    },
  },
}
```

注:

- AWS 認証情報が存在する場合、`enabled` はデフォルトで `true` になります。
- `region` のデフォルトは `AWS_REGION` または `AWS_DEFAULT_REGION`、その後 `us-east-1` になります。
- `providerFilter` は、Bedrock プロバイダー名 (`anthropic` など) と一致します。
- `refreshInterval` は秒です。キャッシュを無効にするには、`0` に設定します。
- `defaultContextWindow` (デフォルト: `32000`) および `defaultMaxTokens` (デフォルト: `4096`)
  検出されたモデルに使用されます (モデルの制限がわかっている場合はオーバーライドします)。

## オンボーディング

1. AWS 認証情報が **ゲートウェイ ホスト** で利用可能であることを確認します。

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Optional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Optional (Bedrock API key/bearer token):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Bedrock プロバイダーとモデルを構成に追加します (`apiKey` は必要ありません)。

```json5
   {
   models: {
   providers: {
   "amazon-bedrock": {
   baseUrl: "<https://bedrock-runtime.us-east-1.amazonaws.com>",
   api: "bedrock-converse-stream",
   auth: "aws-sdk",
   models: [
   {
   id: "us.anthropic.claude-opus-4-6-v1:0",
   name: "Claude Opus 4.6 (Bedrock)",
   reasoning: true,
   input: ["text", "image"],
   cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
   contextWindow: 200000,
   maxTokens: 8192,
   },
   ],
   },
   },
   },
   agents: {
   defaults: {
   model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
   },
   },
   }

````

## EC2 インスタンスのロール

IAM ロールがアタッチされた EC2 インスタンスで OpenClaw を実行すると、AWS SDK
認証にはインスタンス メタデータ サービス (IMDS) が自動的に使用されます。
ただし、OpenClaw の資格情報検出は現在、環境のみをチェックします。
IMDS 認証情報ではなく、変数です。

**回避策:** `AWS_PROFILE=default` を設定して、AWS 認証情報が
利用可能です。実際の認証では、引き続き IMDS 経由のインスタンス ロールが使用されます。

```bash
# Add to ~/.bashrc or your shell profile
export AWS_PROFILE=default
export AWS_REGION=us-east-1
````

**EC2 インスタンス ロールに必要な IAM 権限**:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (自動検出用)

または、管理ポリシー `AmazonBedrockFullAccess` をアタッチします。

## クイックセットアップ (AWS パス)

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery
openclaw config set models.bedrockDiscovery.enabled true
openclaw config set models.bedrockDiscovery.region us-east-1

# 4. Set the workaround env vars
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## 注意事項

- Bedrock では、AWS アカウント/リージョンで有効になっている **モデル アクセス** が必要です。
- 自動検出には `bedrock:ListFoundationModels` 権限が必要です。
- プロファイルを使用する場合は、ゲートウェイ ホストで `AWS_PROFILE` を設定します。
- OpenClaw は、資格情報ソースを次の順序で表示します: `AWS_BEARER_TOKEN_BEDROCK`、
  次に `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、次に `AWS_PROFILE`、そして
  デフォルトの AWS SDK チェーン。
- 推論サポートはモデルによって異なります。 Bedrock モデル カードを確認してください
  現在の能力。
- マネージド キー フローを希望する場合は、OpenAI 互換のキー フローを配置することもできます。
  Bedrock の前にプロキシを配置し、代わりに OpenAI プロバイダーとして構成します。
