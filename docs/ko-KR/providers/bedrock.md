---
summary: "OpenClaw에서 Amazon Bedrock(Converse API) 모델 사용하기"
read_when:
  - OpenClaw에서 Amazon Bedrock 모델을 사용하고 싶을 때
  - 모델 호출을 위해 AWS 자격 증명/리전 설정이 필요할 때
title: "Amazon Bedrock"
---

# Amazon Bedrock

OpenClaw는 pi-ai의 **Bedrock Converse** 스트리밍 provider를 통해
**Amazon Bedrock** 모델을 사용할 수 있습니다. Bedrock 인증은 API 키가 아니라
**AWS SDK 기본 자격 증명 체인**을 사용합니다.

## pi-ai가 지원하는 항목

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Auth: AWS 자격 증명(env vars, shared config, 또는 instance role)
- Region: `AWS_REGION` 또는 `AWS_DEFAULT_REGION` (기본값: `us-east-1`)

## 자동 모델 탐색

AWS 자격 증명이 감지되면 OpenClaw는 **streaming**과 **text output**을 지원하는
Bedrock 모델을 자동으로 탐색할 수 있습니다. 탐색에는
`bedrock:ListFoundationModels`가 사용되며 캐시됩니다(기본값: 1시간).

설정 옵션은 `models.bedrockDiscovery` 아래에 있습니다:

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

참고:

- `enabled`는 AWS 자격 증명이 있으면 기본적으로 `true`입니다.
- `region`은 기본적으로 `AWS_REGION` 또는 `AWS_DEFAULT_REGION`, 그다음 `us-east-1`을 사용합니다.
- `providerFilter`는 Bedrock provider 이름과 매칭됩니다(예: `anthropic`).
- `refreshInterval`의 단위는 초이며, 캐시를 비활성화하려면 `0`으로 설정하세요.
- `defaultContextWindow`(기본값: `32000`)와 `defaultMaxTokens`(기본값: `4096`)는
  탐색된 모델에 사용됩니다(모델 한계를 알고 있다면 재정의하세요).

## 온보딩

1. **gateway host**에서 AWS 자격 증명을 사용할 수 있는지 확인하세요:

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

2. 설정에 Bedrock provider와 model을 추가하세요(`apiKey`는 필요 없음):

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

## EC2 인스턴스 역할

IAM 역할이 연결된 EC2 인스턴스에서 OpenClaw를 실행하면 AWS SDK는 인증을 위해
인스턴스 메타데이터 서비스(IMDS)를 자동으로 사용합니다. 하지만 현재
OpenClaw의 자격 증명 감지는 IMDS 자격 증명이 아니라 환경 변수만 확인합니다.

**우회 방법:** AWS 자격 증명을 사용할 수 있음을 알리기 위해 `AWS_PROFILE=default`를
설정하세요. 실제 인증은 여전히 IMDS를 통한 인스턴스 역할을 사용합니다.

```bash
# Add to ~/.bashrc or your shell profile
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

EC2 인스턴스 역할에 필요한 **IAM 권한**:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (자동 탐색용)

또는 관리형 정책 `AmazonBedrockFullAccess`를 연결하세요.

## 빠른 설정 (AWS 경로)

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

## 참고

- Bedrock를 사용하려면 AWS 계정/리전에서 **model access**가 활성화되어 있어야 합니다.
- 자동 탐색에는 `bedrock:ListFoundationModels` 권한이 필요합니다.
- 프로파일을 사용하는 경우 gateway host에서 `AWS_PROFILE`을 설정하세요.
- OpenClaw는 자격 증명 소스를 다음 순서로 표시합니다: `AWS_BEARER_TOKEN_BEDROCK`,
  그다음 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, 그다음 `AWS_PROFILE`, 그리고
  마지막으로 기본 AWS SDK 체인입니다.
- reasoning 지원 여부는 모델에 따라 다르므로 현재 기능은 Bedrock 모델 카드에서 확인하세요.
- 관리형 키 흐름을 선호한다면 OpenAI 호환 프록시를 Bedrock 앞에 두고,
  대신 OpenAI provider로 구성할 수도 있습니다.
