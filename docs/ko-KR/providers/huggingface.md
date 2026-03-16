---
summary: "Hugging Face Inference 설정 (auth + model 선택)"
description: "Hugging Face Inference 설정 (auth + model 선택)"
read_when:
  - OpenClaw와 함께 Hugging Face Inference를 사용하려고 할 때
  - HF token env var 또는 CLI auth 선택이 필요할 때
title: "Hugging Face (Inference)"
---

# Hugging Face (Inference)

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers)는 단일 router API를 통해 OpenAI 호환 chat completions를 제공합니다. 하나의 token으로 많은 model(DeepSeek, Llama 등)에 접근할 수 있습니다. OpenClaw는 **OpenAI 호환 endpoint**(chat completions 전용)를 사용합니다. text-to-image, embeddings, speech는 [HF inference clients](https://huggingface.co/docs/api-inference/quicktour)를 직접 사용하세요.

- provider: `huggingface`
- 인증: `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN` (**Make calls to Inference Providers** 권한이 있는 fine-grained token)
- API: OpenAI 호환 (`https://router.huggingface.co/v1`)
- Billing: 단일 HF token 사용. [pricing](https://huggingface.co/docs/inference-providers/pricing)은 프로바이더 요율을 따르며 free tier가 있습니다.

## 빠른 시작

1. [Hugging Face → Settings → Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained)에서 **Make calls to Inference Providers** 권한이 있는 fine-grained token을 생성합니다.
2. onboarding을 실행하고 프로바이더 dropdown에서 **Hugging Face**를 선택한 뒤, 프롬프트가 나오면 API 키를 입력합니다:

```bash
openclaw onboard --auth-choice huggingface-api-key
```

3. **Default Hugging Face model** dropdown에서 원하는 model을 선택합니다 (유효한 token이 있으면 Inference API에서 목록을 불러오고, 그렇지 않으면 built-in 목록을 표시합니다). 선택한 값은 기본 model로 저장됩니다.
4. 나중에 config에서 기본 model을 설정하거나 변경할 수도 있습니다:

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
    },
  },
}
```

## 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

이렇게 하면 `huggingface/deepseek-ai/DeepSeek-R1`이 기본 model로 설정됩니다.

## 환경 참고

Gateway가 daemon(launchd/systemd)으로 실행된다면 `HUGGINGFACE_HUB_TOKEN` 또는 `HF_TOKEN`이 해당 process에서 사용 가능해야 합니다
(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).

## Model discovery and onboarding dropdown

OpenClaw는 **Inference endpoint를 직접 호출**하여 model을 찾습니다:

```bash
GET https://router.huggingface.co/v1/models
```

(선택 사항: 전체 목록을 받으려면 `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` 또는 `$HF_TOKEN`을 보내세요. 일부 endpoint는 auth 없이 부분 목록만 반환합니다.) 응답은 OpenAI 스타일의 `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }` 형식입니다.

OpenClaw에 Hugging Face API 키를 구성하면(`onboarding`, `HUGGINGFACE_HUB_TOKEN`, 또는 `HF_TOKEN`을 통해), 이 GET을 사용해 사용 가능한 chat-completion model을 찾습니다. **대화형 온보딩** 중에는 token을 입력한 뒤 이 목록(또는 요청 실패 시 built-in catalog)으로 채워진 **Default Hugging Face model** dropdown이 표시됩니다. 런타임(예: Gateway 시작 시)에도 key가 있으면 OpenClaw는 다시 **GET** `https://router.huggingface.co/v1/models`를 호출해 catalog를 새로 고칩니다. 이 목록은 built-in catalog와 병합됩니다(context window 및 cost 같은 metadata 포함). 요청이 실패하거나 key가 없으면 built-in catalog만 사용합니다.

## Model names and editable options

- **API에서 가져온 이름:** API가 `name`, `title`, 또는 `display_name`을 반환하면 model 표시 이름은 **GET /v1/models에서 hydrate**됩니다. 그렇지 않으면 model id에서 파생됩니다 (예: `deepseek-ai/DeepSeek-R1` → “DeepSeek R1”).
- **표시 이름 override:** config에서 model별 custom label을 설정해 CLI와 UI에 원하는 방식으로 표시되게 할 수 있습니다:

```json5
{
  agents: {
    defaults: {
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
        "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
      },
    },
  },
}
```

- **Provider / policy 선택:** router가 backend를 고르는 방식을 선택하려면 **model id**에 suffix를 붙이세요:
  - **`:fastest`** — 최고 처리량 (router가 선택, 프로바이더 선택은 **고정됨**. interactive backend picker 없음).
  - **`:cheapest`** — 출력 token당 최저 비용 (router가 선택, 프로바이더 선택은 **고정됨**).
  - **`:provider`** — 특정 backend를 강제합니다 (예: `:sambanova`, `:together`).

  **:cheapest** 또는 **:fastest**를 선택하면(예: onboarding model dropdown에서), 프로바이더가 고정됩니다. router가 비용 또는 속도로 결정하므로 선택적 “prefer specific backend” 단계는 표시되지 않습니다. 이를 `models.providers.huggingface.models`에 별도 항목으로 추가하거나 suffix가 포함된 값으로 `model.primary`를 설정할 수 있습니다. 기본 순서는 [Inference Provider settings](https://hf.co/settings/inference-providers)에서 설정할 수도 있습니다 (suffix가 없으면 그 순서를 사용).

- **Config merge:** `models.providers.huggingface.models`의 기존 항목(예: `models.json` 안)은 config merge 시 유지됩니다. 따라서 거기에 설정한 custom `name`, `alias`, model option은 보존됩니다.

## Model IDs and configuration examples

모델 ref는 `huggingface/<org>/<model>` 형식을 사용합니다 (Hub 스타일 ID). 아래 목록은 **GET** `https://router.huggingface.co/v1/models`에서 온 것이며, 실제 catalog에는 더 많은 항목이 있을 수 있습니다.

**예시 ID (inference endpoint 기준):**

| Model                  | Ref (prefix with `huggingface/`)    |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

model id에 `:fastest`, `:cheapest`, `:provider`(예: `:together`, `:sambanova`)를 붙일 수 있습니다. 기본 순서는 [Inference Provider settings](https://hf.co/settings/inference-providers)에서 설정하세요. 전체 목록은 [Inference Providers](https://huggingface.co/docs/inference-providers) 및 **GET** `https://router.huggingface.co/v1/models`를 참고하세요.

### Complete configuration examples

**기본은 DeepSeek R1, 폴백은 Qwen:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-R1",
        fallbacks: ["huggingface/Qwen/Qwen3-8B"],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
      },
    },
  },
}
```

**기본은 Qwen, 여기에 :cheapest 및 :fastest variant 추가:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen3-8B" },
      models: {
        "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
        "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
        "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
      },
    },
  },
}
```

**DeepSeek + Llama + GPT-OSS에 alias 지정:**

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
        fallbacks: [
          "huggingface/meta-llama/Llama-3.3-70B-Instruct",
          "huggingface/openai/gpt-oss-120b",
        ],
      },
      models: {
        "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
        "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
        "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
      },
    },
  },
}
```

**`:provider`로 특정 backend 강제:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/deepseek-ai/DeepSeek-R1:together" },
      models: {
        "huggingface/deepseek-ai/DeepSeek-R1:together": { alias: "DeepSeek R1 (Together)" },
      },
    },
  },
}
```

**policy suffix가 붙은 여러 Qwen 및 DeepSeek model:**

```json5
{
  agents: {
    defaults: {
      model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
      models: {
        "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
        "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
        "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
        "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
      },
    },
  },
}
```
