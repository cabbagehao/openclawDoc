---
summary: "OpenClaw で Amazon Bedrock（Converse API）モデルを使用する"
read_when:
  - OpenClaw で Amazon Bedrock モデルを使いたいとき
  - モデル呼び出しに必要な AWS 認証情報やリージョン設定を確認したいとき
title: "Amazon Bedrock"
seoTitle: "OpenClawでAmazon Bedrockを使うAWS認証・モデル設定ガイド"
description: "Amazon Bedrock を OpenClaw で使うための設定ガイドです。AWS 認証情報、リージョン指定、自動モデル検出、Converse API の前提をまとめています。"
x-i18n:
  source_hash: "73b0472f571ee6eb9c1b0d851ce94208914f2fa24eacc3b92a571aeb162dbca8"
---
OpenClaw は、pi-ai の **Bedrock Converse** streaming provider を介して **Amazon Bedrock** モデルを利用できます。Bedrock 認証では API キーではなく、**AWS SDK の default credential chain** を使用します。

## pi-ai がサポートする内容

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Auth: AWS 認証情報（環境変数、shared config、instance role）
- Region: `AWS_REGION` または `AWS_DEFAULT_REGION`（既定値: `us-east-1`）

## 自動モデル検出

AWS 認証情報が検出されると、OpenClaw は **streaming** と **text output** をサポートする Bedrock モデルを自動検出できます。検出には `bedrock:ListFoundationModels` を使い、結果はキャッシュされます（既定値: 1 時間）。

設定項目は `models.bedrockDiscovery` 配下にあります。

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

注意:

- AWS 認証情報が存在する場合、`enabled` の既定値は `true` です。
- `region` は `AWS_REGION`、`AWS_DEFAULT_REGION`、それでもなければ `us-east-1` の順で決まります。
- `providerFilter` は Bedrock の provider 名（例: `anthropic`）に一致します。
- `refreshInterval` は秒単位です。キャッシュを無効化するには `0` にします。
- `defaultContextWindow`（既定値: `32000`）と `defaultMaxTokens`（既定値: `4096`）は、検出されたモデルに適用されます。実際の制限が分かっている場合は上書きしてください。

## オンボーディング

1. **ゲートウェイ ホスト** で AWS 認証情報が利用可能であることを確認します。

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

2. 設定へ Bedrock provider とモデルを追加します（`apiKey` は不要です）。

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
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
```

## EC2 Instance Role

IAM role をアタッチした EC2 インスタンス上で OpenClaw を動かす場合、AWS SDK は自動的に instance metadata service（IMDS）を使って認証します。ただし、OpenClaw の credential detection は現状 IMDS ではなく環境変数を主に確認します。

**回避策:** `AWS_PROFILE=default` を設定し、AWS 認証情報が利用可能であることを示してください。実際の認証は引き続き IMDS 経由の instance role が使われます。

```bash
# Add to ~/.bashrc or your shell profile
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**EC2 instance role に必要な IAM 権限**:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels`（自動検出用）

または managed policy `AmazonBedrockFullAccess` をアタッチします。

## クイックセットアップ（AWS path）

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

- Bedrock を使うには、該当 AWS アカウント / リージョンで **model access** が有効になっている必要があります。
- 自動検出には `bedrock:ListFoundationModels` 権限が必要です。
- profile を使う場合は、ゲートウェイ ホストで `AWS_PROFILE` を設定してください。
- OpenClaw は認証情報ソースを次の順で扱います。`AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`、`AWS_PROFILE`、最後に default AWS SDK chain。
- reasoning 対応はモデルごとに異なります。現在の機能は Bedrock の model card を確認してください。
- managed key flow を好む場合は、Bedrock の前段に OpenAI 互換 proxy を置き、OpenAI provider として設定することもできます。
