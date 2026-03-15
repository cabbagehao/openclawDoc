# Kilo Gateway Provider 통합 설계

## 개요

이 문서는 기존 OpenRouter 구현을 본떠, OpenClaw에 "Kilo Gateway"를 일급 provider로 통합하는 설계를 설명합니다. Kilo Gateway는 다른 base URL을 사용하는 OpenAI 호환 completions API를 사용합니다.

## 설계 결정

### 1. Provider 이름

**권장안: `kilocode`**

근거:

- 제공된 사용자 설정 예시의 provider 키(`kilocode`)와 일치
- 기존 provider 이름 패턴(`openrouter`, `opencode`, `moonshot`)과 일관됨
- 짧고 기억하기 쉬움
- 지나치게 일반적인 "kilo" 또는 "gateway"라는 용어와의 혼동을 피함

검토한 대안: `kilo-gateway`

- 코드베이스에서는 하이픈이 들어간 이름이 덜 일반적이고, `kilocode`가 더 간결하므로 기각

### 2. 기본 모델 참조

**권장안: `kilocode/anthropic/claude-opus-4.6`**

근거:

- 사용자 설정 예시에 기반
- Claude Opus 4.5는 강력한 기본 모델
- 명시적으로 모델을 선택하면 자동 라우팅에 의존하지 않아도 됨

### 3. Base URL 설정

**권장안: 설정으로 재정의 가능한 하드코딩 기본값**

- **기본 Base URL:** `https://api.kilo.ai/api/gateway/`
- **설정 가능 여부:** 예, `models.providers.kilocode.baseUrl`을 통해 가능

이 방식은 Moonshot, Venice, Synthetic 같은 다른 provider의 패턴과 일치합니다.

### 4. 모델 스캔

**권장안: 초기에는 전용 모델 스캔 endpoint를 두지 않음**

근거:

- Kilo Gateway는 OpenRouter로 프록시하므로 모델이 동적으로 바뀜
- 사용자가 설정 파일에서 모델을 수동으로 설정할 수 있음
- 향후 Kilo Gateway가 `/models` endpoint를 제공하면 스캔을 추가할 수 있음

### 5. 특수 처리

**권장안: Anthropic 모델에 대해 OpenRouter 동작을 상속**

Kilo Gateway는 OpenRouter로 프록시하므로 동일한 특수 처리가 적용되어야 합니다.

- `anthropic/*` 모델에 대한 cache TTL eligibility
- `anthropic/*` 모델에 대한 추가 파라미터(`cacheControlTtl`)
- transcript policy는 OpenRouter 패턴을 따름

## 수정할 파일

### 핵심 자격 증명 관리

#### 1. `src/commands/onboard-auth.credentials.ts`

추가:

```typescript
export const KILOCODE_DEFAULT_MODEL_REF = "kilocode/anthropic/claude-opus-4.6";

export async function setKilocodeApiKey(key: string, agentDir?: string) {
  upsertAuthProfile({
    profileId: "kilocode:default",
    credential: {
      type: "api_key",
      provider: "kilocode",
      key,
    },
    agentDir: resolveAuthAgentDir(agentDir),
  });
}
```

#### 2. `src/agents/model-auth.ts`

`resolveEnvApiKey()`의 `envMap`에 추가:

```typescript
const envMap: Record<string, string> = {
  // ... existing entries
  kilocode: "KILOCODE_API_KEY",
};
```

#### 3. `src/config/io.ts`

`SHELL_ENV_EXPECTED_KEYS`에 추가:

```typescript
const SHELL_ENV_EXPECTED_KEYS = [
  // ... existing entries
  "KILOCODE_API_KEY",
];
```

### 설정 적용

#### 4. `src/commands/onboard-auth.config-core.ts`

새 함수 추가:

```typescript
export const KILOCODE_BASE_URL = "https://api.kilo.ai/api/gateway/";

export function applyKilocodeProviderConfig(cfg: OpenClawConfig): OpenClawConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[KILOCODE_DEFAULT_MODEL_REF] = {
    ...models[KILOCODE_DEFAULT_MODEL_REF],
    alias: models[KILOCODE_DEFAULT_MODEL_REF]?.alias ?? "Kilo Gateway",
  };

  const providers = { ...cfg.models?.providers };
  const existingProvider = providers.kilocode;
  const { apiKey: existingApiKey, ...existingProviderRest } = (existingProvider ?? {}) as Record<
    string,
    unknown
  > as { apiKey?: string };
  const resolvedApiKey = typeof existingApiKey === "string" ? existingApiKey : undefined;
  const normalizedApiKey = resolvedApiKey?.trim();

  providers.kilocode = {
    ...existingProviderRest,
    baseUrl: KILOCODE_BASE_URL,
    api: "openai-completions",
    ...(normalizedApiKey ? { apiKey: normalizedApiKey } : {}),
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
    models: {
      mode: cfg.models?.mode ?? "merge",
      providers,
    },
  };
}

export function applyKilocodeConfig(cfg: OpenClawConfig): OpenClawConfig {
  const next = applyKilocodeProviderConfig(cfg);
  const existingModel = next.agents?.defaults?.model;
  return {
    ...next,
    agents: {
      ...next.agents,
      defaults: {
        ...next.agents?.defaults,
        model: {
          ...(existingModel && "fallbacks" in (existingModel as Record<string, unknown>)
            ? {
                fallbacks: (existingModel as { fallbacks?: string[] }).fallbacks,
              }
            : undefined),
          primary: KILOCODE_DEFAULT_MODEL_REF,
        },
      },
    },
  };
}
```

### 인증 선택 시스템

#### 5. `src/commands/onboard-types.ts`

`AuthChoice` 타입에 추가:

```typescript
export type AuthChoice =
  // ... existing choices
  "kilocode-api-key";
// ...
```

`OnboardOptions`에 추가:

```typescript
export type OnboardOptions = {
  // ... existing options
  kilocodeApiKey?: string;
  // ...
};
```

#### 6. `src/commands/auth-choice-options.ts`

`AuthChoiceGroupId`에 추가:

```typescript
export type AuthChoiceGroupId =
  // ... existing groups
  "kilocode";
// ...
```

`AUTH_CHOICE_GROUP_DEFS`에 추가:

```typescript
{
  value: "kilocode",
  label: "Kilo Gateway",
  hint: "API key (OpenRouter-compatible)",
  choices: ["kilocode-api-key"],
},
```

`buildAuthChoiceOptions()`에 추가:

```typescript
options.push({
  value: "kilocode-api-key",
  label: "Kilo Gateway API key",
  hint: "OpenRouter-compatible gateway",
});
```

#### 7. `src/commands/auth-choice.preferred-provider.ts`

매핑 추가:

```typescript
const PREFERRED_PROVIDER_BY_AUTH_CHOICE: Partial<Record<AuthChoice, string>> = {
  // ... existing mappings
  "kilocode-api-key": "kilocode",
};
```

### 인증 선택 적용

#### 8. `src/commands/auth-choice.apply.api-providers.ts`

Import 추가:

```typescript
import {
  // ... existing imports
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.js";
```

`kilocode-api-key` 처리 추가:

```typescript
if (authChoice === "kilocode-api-key") {
  const store = ensureAuthProfileStore(params.agentDir, {
    allowKeychainPrompt: false,
  });
  const profileOrder = resolveAuthProfileOrder({
    cfg: nextConfig,
    store,
    provider: "kilocode",
  });
  const existingProfileId = profileOrder.find((profileId) => Boolean(store.profiles[profileId]));
  const existingCred = existingProfileId ? store.profiles[existingProfileId] : undefined;
  let profileId = "kilocode:default";
  let mode: "api_key" | "oauth" | "token" = "api_key";
  let hasCredential = false;

  if (existingProfileId && existingCred?.type) {
    profileId = existingProfileId;
    mode =
      existingCred.type === "oauth" ? "oauth" : existingCred.type === "token" ? "token" : "api_key";
    hasCredential = true;
  }

  if (!hasCredential && params.opts?.token && params.opts?.tokenProvider === "kilocode") {
    await setKilocodeApiKey(normalizeApiKeyInput(params.opts.token), params.agentDir);
    hasCredential = true;
  }

  if (!hasCredential) {
    const envKey = resolveEnvApiKey("kilocode");
    if (envKey) {
      const useExisting = await params.prompter.confirm({
        message: `Use existing KILOCODE_API_KEY (${envKey.source}, ${formatApiKeyPreview(envKey.apiKey)})?`,
        initialValue: true,
      });
      if (useExisting) {
        await setKilocodeApiKey(envKey.apiKey, params.agentDir);
        hasCredential = true;
      }
    }
  }

  if (!hasCredential) {
    const key = await params.prompter.text({
      message: "Enter Kilo Gateway API key",
      validate: validateApiKeyInput,
    });
    await setKilocodeApiKey(normalizeApiKeyInput(String(key)), params.agentDir);
    hasCredential = true;
  }

  if (hasCredential) {
    nextConfig = applyAuthProfileConfig(nextConfig, {
      profileId,
      provider: "kilocode",
      mode,
    });
  }
  {
    const applied = await applyDefaultModelChoice({
      config: nextConfig,
      setDefaultModel: params.setDefaultModel,
      defaultModel: KILOCODE_DEFAULT_MODEL_REF,
      applyDefaultConfig: applyKilocodeConfig,
      applyProviderConfig: applyKilocodeProviderConfig,
      noteDefault: KILOCODE_DEFAULT_MODEL_REF,
      noteAgentModel,
      prompter: params.prompter,
    });
    nextConfig = applied.config;
    agentModelOverride = applied.agentModelOverride ?? agentModelOverride;
  }
  return { config: nextConfig, agentModelOverride };
}
```

함수 상단에 tokenProvider 매핑도 추가:

```typescript
if (params.opts.tokenProvider === "kilocode") {
  authChoice = "kilocode-api-key";
}
```

### CLI 등록

#### 9. `src/cli/program/register.onboard.ts`

CLI 옵션 추가:

```typescript
.option("--kilocode-api-key <key>", "Kilo Gateway API key")
```

action handler에 추가:

```typescript
kilocodeApiKey: opts.kilocodeApiKey as string | undefined,
```

auth-choice 도움말 텍스트 갱신:

```typescript
.option(
  "--auth-choice <choice>",
  "Auth: setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|kilocode-api-key|ai-gateway-api-key|...",
)
```

### 비대화형 온보딩

#### 10. `src/commands/onboard-non-interactive/local/auth-choice.ts`

`kilocode-api-key` 처리 추가:

```typescript
if (authChoice === "kilocode-api-key") {
  const resolved = await resolveNonInteractiveApiKey({
    provider: "kilocode",
    cfg: baseConfig,
    flagValue: opts.kilocodeApiKey,
    flagName: "--kilocode-api-key",
    envVar: "KILOCODE_API_KEY",
  });
  await setKilocodeApiKey(resolved.apiKey, agentDir);
  nextConfig = applyAuthProfileConfig(nextConfig, {
    profileId: "kilocode:default",
    provider: "kilocode",
    mode: "api_key",
  });
  // ... apply default model
}
```

### export 갱신

#### 11. `src/commands/onboard-auth.ts`

다음 export를 추가:

```typescript
export {
  // ... existing exports
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_BASE_URL,
} from "./onboard-auth.config-core.js";

export {
  // ... existing exports
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.credentials.js";
```

### 특수 처리 선택 사항

#### 12. `src/agents/pi-embedded-runner/cache-ttl.ts`

Anthropic 모델용 Kilo Gateway 지원 추가:

```typescript
export function isCacheTtlEligibleProvider(provider: string, modelId: string): boolean {
  const normalizedProvider = provider.toLowerCase();
  const normalizedModelId = modelId.toLowerCase();
  if (normalizedProvider === "anthropic") return true;
  if (normalizedProvider === "openrouter" && normalizedModelId.startsWith("anthropic/"))
    return true;
  if (normalizedProvider === "kilocode" && normalizedModelId.startsWith("anthropic/")) return true;
  return false;
}
```

#### 13. `src/agents/transcript-policy.ts`

Kilo Gateway 처리 추가(OpenRouter와 유사):

```typescript
const isKilocodeGemini = provider === "kilocode" && modelId.toLowerCase().includes("gemini");

// Include in needsNonImageSanitize check
const needsNonImageSanitize =
  isGoogle || isAnthropic || isMistral || isOpenRouterGemini || isKilocodeGemini;
```

## 설정 구조

### 사용자 설정 예시

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "kilocode": {
        "baseUrl": "https://api.kilo.ai/api/gateway/",
        "apiKey": "xxxxx",
        "api": "openai-completions",
        "models": [
          {
            "id": "anthropic/claude-opus-4.6",
            "name": "Anthropic: Claude Opus 4.6"
          },
          { "id": "minimax/minimax-m2.5:free", "name": "Minimax: Minimax M2.5" }
        ]
      }
    }
  }
}
```

### 인증 프로필 구조

```json
{
  "profiles": {
    "kilocode:default": {
      "type": "api_key",
      "provider": "kilocode",
      "key": "xxxxx"
    }
  }
}
```

## 테스트 고려 사항

1. **단위 테스트:**
   - `setKilocodeApiKey()`가 올바른 프로필을 기록하는지 테스트
   - `applyKilocodeConfig()`가 올바른 기본값을 설정하는지 테스트
   - `resolveEnvApiKey("kilocode")`가 올바른 환경 변수를 반환하는지 테스트

2. **통합 테스트:**
   - `--auth-choice kilocode-api-key`를 사용하는 온보딩 흐름 테스트
   - `--kilocode-api-key`를 사용하는 비대화형 온보딩 테스트
   - `kilocode/` 접두사를 사용하는 모델 선택 테스트

3. **E2E 테스트:**
   - Kilo Gateway를 통한 실제 API 호출 테스트(live tests)

## 마이그레이션 참고

- 기존 사용자에게는 마이그레이션이 필요 없음
- 신규 사용자는 즉시 `kilocode-api-key` 인증 선택지를 사용할 수 있음
- `kilocode` provider를 사용하는 기존 수동 설정도 계속 동작함

## 향후 고려 사항

1. **모델 카탈로그:** Kilo Gateway가 `/models` endpoint를 노출하면 `scanOpenRouterModels()`와 유사한 스캔 지원 추가

2. **OAuth 지원:** Kilo Gateway가 OAuth를 추가하면 인증 시스템도 확장

3. **Rate limiting:** 필요 시 Kilo Gateway 전용 rate limit 처리 추가 고려

4. **문서화:** 설정 및 사용법을 설명하는 `docs/providers/kilocode.md` 문서 추가

## 변경 요약

| File                                                        | Change Type | Description                                                             |
| ----------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `src/commands/onboard-auth.credentials.ts`                  | Add         | `KILOCODE_DEFAULT_MODEL_REF`, `setKilocodeApiKey()`                     |
| `src/agents/model-auth.ts`                                  | Modify      | `envMap`에 `kilocode` 추가                                              |
| `src/config/io.ts`                                          | Modify      | shell env key에 `KILOCODE_API_KEY` 추가                                 |
| `src/commands/onboard-auth.config-core.ts`                  | Add         | `applyKilocodeProviderConfig()`, `applyKilocodeConfig()`                |
| `src/commands/onboard-types.ts`                             | Modify      | `AuthChoice`에 `kilocode-api-key` 추가, options에 `kilocodeApiKey` 추가 |
| `src/commands/auth-choice-options.ts`                       | Modify      | `kilocode` 그룹 및 옵션 추가                                            |
| `src/commands/auth-choice.preferred-provider.ts`            | Modify      | `kilocode-api-key` 매핑 추가                                            |
| `src/commands/auth-choice.apply.api-providers.ts`           | Modify      | `kilocode-api-key` 처리 추가                                            |
| `src/cli/program/register.onboard.ts`                       | Modify      | `--kilocode-api-key` 옵션 추가                                          |
| `src/commands/onboard-non-interactive/local/auth-choice.ts` | Modify      | 비대화형 처리 추가                                                      |
| `src/commands/onboard-auth.ts`                              | Modify      | 새 함수 export                                                          |
| `src/agents/pi-embedded-runner/cache-ttl.ts`                | Modify      | kilocode 지원 추가                                                      |
| `src/agents/transcript-policy.ts`                           | Modify      | kilocode Gemini 처리 추가                                               |
