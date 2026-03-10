# Kilo ゲートウェイ プロバイダーの統合設計

## 概要

この文書では、既存の OpenRouter 実装をモデルとした、OpenClaw のファーストクラスプロバイダーとして「Kilo Gateway」を統合するための設計の概要を説明します。 Kilo Gateway は、異なるベース URL を持つ OpenAI 互換の補完 API を使用します。

## 設計上の決定

### 1. プロバイダーの命名

**推奨事項: `kilocode`**

理論的根拠:

- 提供されたユーザー構成例と一致します (`kilocode` プロバイダー キー)
- 既存のプロバイダ命名パターンとの一貫性 (例: `openrouter`、`opencode`、`moonshot`)
- 短くて記憶に残る
- 一般的な「キロ」または「ゲートウェイ」という用語との混乱を避ける

検討された代替案: `kilo-gateway` - コードベースではハイフンでつながれた名前があまり一般的ではなく、`kilocode` の方が簡潔であるため拒否されました。

### 2. デフォルトのモデル参照

**推奨事項: `kilocode/anthropic/claude-opus-4.6`**

理論的根拠:

- ユーザー設定の例に基づく
- Claude Opus 4.5 は有能なデフォルト モデルです
- 明示的なモデル選択により自動ルーティングへの依存を回避

### 3. ベース URL の設定

**推奨: 設定を上書きしてハードコードされたデフォルト**

- **デフォルトのベース URL:** `https://api.kilo.ai/api/gateway/`
- **構成可能:** はい、`models.providers.kilocode.baseUrl` 経由

これは、Moonshot、Venice、Synthetic などの他のプロバイダーが使用するパターンと一致します。

### 4. モデルのスキャン

**推奨事項: 最初は専用のモデル スキャン エンドポイントを使用しません**

理論的根拠:- Kilo Gateway は OpenRouter にプロキシするため、モデルは動的です

- ユーザーは設定でモデルを手動で設定できます
- Kilo Gateway が将来 `/models` エンドポイントを公開する場合、スキャンを追加できる可能性があります

### 5. 特別な取り扱い

**推奨事項: 人間モデルの OpenRouter 動作を継承する**

Kilo Gateway は OpenRouter にプロキシするため、同じ特別な処理を適用する必要があります。

- `anthropic/*` モデルのキャッシュ TTL 適格性
- `anthropic/*` モデルの追加パラメータ (cacheControlTtl)
- 転写ポリシーは OpenRouter パターンに従います

## 変更するファイル

### コア認証情報管理

#### 1. `src/commands/onboard-auth.credentials.ts`

追加:

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

`resolveEnvApiKey()` の `envMap` に追加します。

```typescript
const envMap: Record<string, string> = {
  // ... existing entries
  kilocode: "KILOCODE_API_KEY",
};
```

#### 3. `src/config/io.ts`

`SHELL_ENV_EXPECTED_KEYS` に追加:

```typescript
const SHELL_ENV_EXPECTED_KEYS = [
  // ... existing entries
  "KILOCODE_API_KEY",
];
```

### 構成アプリケーション

#### 4. `src/commands/onboard-auth.config-core.ts`

新しい関数を追加します。

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

### 認証選択システム

#### 5. `src/commands/onboard-types.ts`

`AuthChoice` に次のように入力します。

```typescript
export type AuthChoice =
  // ... existing choices
  "kilocode-api-key";
// ...
```

`OnboardOptions` に追加:

```typescript
export type OnboardOptions = {
  // ... existing options
  kilocodeApiKey?: string;
  // ...
};
```

#### 6. `src/commands/auth-choice-options.ts`

`AuthChoiceGroupId` に追加:

```typescript
export type AuthChoiceGroupId =
  // ... existing groups
  "kilocode";
// ...
```

`AUTH_CHOICE_GROUP_DEFS` に追加:

```typescript
{
  value: "kilocode",
  label: "Kilo Gateway",
  hint: "API key (OpenRouter-compatible)",
  choices: ["kilocode-api-key"],
},
```

`buildAuthChoiceOptions()` に追加:

```typescript
options.push({
  value: "kilocode-api-key",
  label: "Kilo Gateway API key",
  hint: "OpenRouter-compatible gateway",
});
```

#### 7. `src/commands/auth-choice.preferred-provider.ts`

マッピングを追加します。

```typescript
const PREFERRED_PROVIDER_BY_AUTH_CHOICE: Partial<Record<AuthChoice, string>> = {
  // ... existing mappings
  "kilocode-api-key": "kilocode",
};
```

### 認証選択アプリケーション

#### 8. `src/commands/auth-choice.apply.api-providers.ts`

インポートを追加します。

```typescript
import {
  // ... existing imports
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.js";
```

`kilocode-api-key` の処理を追加します。

````typescript
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
```また、関数の先頭に tokenProvider マッピングを追加します。

```typescript
if (params.opts.tokenProvider === "kilocode") {
  authChoice = "kilocode-api-key";
}
````

### CLI の登録

#### 9. `src/cli/program/register.onboard.ts`

CLI オプションを追加します。

```typescript
.option("--kilocode-api-key <key>", "Kilo Gateway API key")
```

アクションハンドラーに追加:

```typescript
kilocodeApiKey: opts.kilocodeApiKey as string | undefined,
```

認証選択のヘルプ テキストを更新します。

```typescript
.option(
  "--auth-choice <choice>",
  "Auth: setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|kilocode-api-key|ai-gateway-api-key|...",
)
```

### 非インタラクティブなオンボーディング

#### 10. `src/commands/onboard-non-interactive/local/auth-choice.ts`

`kilocode-api-key` の処理を追加します。

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

### アップデートのエクスポート

#### 11. `src/commands/onboard-auth.ts`

エクスポートを追加します。

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

### 特別な処理 (オプション)

#### 12. `src/agents/pi-embedded-runner/cache-ttl.ts`

Anthropic モデル用の Kilo Gateway サポートを追加します。

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

Kilo Gateway 処理を追加します (OpenRouter と同様):

```typescript
const isKilocodeGemini = provider === "kilocode" && modelId.toLowerCase().includes("gemini");

// Include in needsNonImageSanitize check
const needsNonImageSanitize =
  isGoogle || isAnthropic || isMistral || isOpenRouterGemini || isKilocodeGemini;
```

## 構成構造

### ユーザー設定の例

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

### 認証プロファイルの構造

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

## テストに関する考慮事項

1. **単体テスト:**
   - テスト `setKilocodeApiKey()` は正しいプロファイルを書き込みます
   - テスト `applyKilocodeConfig()` は正しいデフォルトを設定します
   - テスト `resolveEnvApiKey("kilocode")` は正しい環境変数を返します

2. **統合テスト:**
   - `--auth-choice kilocode-api-key` を使用してオンボーディング フローをテストする
   - `--kilocode-api-key` を使用して非対話型オンボーディングをテストする
   - `kilocode/` プレフィックスを使用したテスト モデルの選択

3. **E2E テスト:**
   - Kilo Gateway を介して実際の API 呼び出しをテストする (ライブ テスト)

## 移行メモ- 既存ユーザーの移行は不要

- 新規ユーザーはすぐに `kilocode-api-key` 認証の選択を使用できます
- `kilocode` プロバイダーを使用した既存の手動構成は引き続き機能します

## 将来の考慮事項

1. **モデル カタログ:** Kilo Gateway が `/models` エンドポイントを公開する場合、`scanOpenRouterModels()` と同様のスキャン サポートを追加します。

2. **OAuth サポート:** Kilo Gateway が OAuth を追加する場合、それに応じて認証システムを拡張します

3. **レート制限:** 必要に応じて、Kilo Gateway に固有のレート制限処理を追加することを検討してください。

4. **ドキュメント:** セットアップと使用法を説明するドキュメントを `docs/providers/kilocode.md` に追加します。

## 変更の概要|ファイル |タイプの変更 |説明 |

| -------------------------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `src/commands/onboard-auth.credentials.ts` |追加 | `KILOCODE_DEFAULT_MODEL_REF`、`setKilocodeApiKey()` |
| `src/agents/model-auth.ts` |変更 | `kilocode` を `envMap` に追加します。
| `src/config/io.ts` |変更 | `KILOCODE_API_KEY` をシェル環境キーに追加します。
| `src/commands/onboard-auth.config-core.ts` |追加 | `applyKilocodeProviderConfig()`、`applyKilocodeConfig()` |
| `src/commands/onboard-types.ts` |変更 | `kilocode-api-key` を `AuthChoice` に追加し、`kilocodeApiKey` をオプションに追加します。
| `src/commands/auth-choice-options.ts` |変更 | `kilocode` グループとオプションを追加 |
| `src/commands/auth-choice.preferred-provider.ts` |変更 | `kilocode-api-key` マッピングを追加 |
| `src/commands/auth-choice.apply.api-providers.ts` |変更 | `kilocode-api-key` 処理を追加 || `src/cli/program/register.onboard.ts` |変更 | `--kilocode-api-key` オプションを追加 |
| `src/commands/onboard-non-interactive/local/auth-choice.ts` |変更 |非対話型処理を追加する |
| `src/commands/onboard-auth.ts` |変更 |新しい関数をエクスポートする |
| `src/agents/pi-embedded-runner/cache-ttl.ts` |変更 |キロコードのサポートを追加 |
| `src/agents/transcript-policy.ts` |変更 |キロコード Gemini 処理を追加 |
