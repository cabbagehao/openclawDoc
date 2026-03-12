---
summary: "Kilo Gateway を OpenClaw の標準プロバイダーとして統合するための設計方針"
title: "Kilo Gateway プロバイダーの統合設計"
seoTitle: "OpenClawのKilo Gateway統合設計の方針と実装論点ガイド"
description: "本ドキュメントでは、既存の OpenRouter 実装をモデルとして、「Kilo Gateway」を OpenClaw の標準（ファーストクラス）プロバイダーとして統合するための設計案をまとめます。"
---
## 概要

本ドキュメントでは、既存の OpenRouter 実装をモデルとして、「Kilo Gateway」を OpenClaw の標準（ファーストクラス）プロバイダーとして統合するための設計案をまとめます。Kilo Gateway は OpenAI 互換の Completions API を使用しますが、ベース URL が異なります。

## 設計上の決定事項

### 1. プロバイダーの名称

**推奨: `kilocode`**

根拠:
- 提示されたユーザー構成例（`kilocode` プロバイダーキー）と一致します。
- 既存のプロバイダー命名パターン（`openrouter`, `opencode`, `moonshot` など）と一貫性があります。
- 短く、覚えやすい名称です。
- 一般的な「kilo」や「gateway」という単語との混同を避けることができます。

検討された代替案: `kilo-gateway`。コードベースではハイフン付きの名称はあまり一般的ではなく、`kilocode` の方が簡潔であるため不採用としました。

### 2. デフォルトモデルの参照

**推奨: `kilocode/anthropic/claude-opus-4.6`**

根拠:
- ユーザーの構成例に基づいています。
- Claude Opus 4.5 はメインモデルとして十分な能力を持っています。
- 明示的なモデル選択を行うことで、自動ルーティングへの依存を回避します。

### 3. ベース URL の設定

**推奨: ハードコードされたデフォルト値と、構成による上書きの併用**

- **デフォルトのベース URL:** `https://api.kilo.ai/api/gateway/`
- **上書き可能:** はい。`models.providers.kilocode.baseUrl` 経由で設定できます。

これは Moonshot, Venice, Synthetic などの他のプロバイダーで使用されているパターンと同様です。

### 4. モデルスキャン

**推奨: 初期段階では専用のモデルスキャンエンドポイントは設けない**

根拠:
- Kilo Gateway は OpenRouter へのプロキシであり、モデルは動的に変化します。
- ユーザーは構成ファイルでモデルを手動設定できます。
- 将来的に Kilo Gateway が `/models` エンドポイントを公開した際に、スキャン機能を追加することを検討します。

### 5. 特殊なハンドリング

**推奨: Anthropic モデルにおいて OpenRouter と同様の挙動を継承する**

Kilo Gateway は OpenRouter へのプロキシであるため、同様の特殊処理を適用すべきです:
- `anthropic/*` モデルに対するキャッシュ TTL 適格性の判定。
- `anthropic/*` モデルに対する追加パラメータ (`cacheControlTtl`) の付与。
- Conversation 記録（トランスクリプト）のポリシー。

## 修正対象ファイル

### コア認証情報管理

#### 1. `src/commands/onboard-auth.credentials.ts`

以下の追加を行います:

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

`resolveEnvApiKey()` 内の `envMap` に追加します:

```typescript
const envMap: Record<string, string> = {
  // ... 既存のエントリ
  kilocode: "KILOCODE_API_KEY",
};
```

#### 3. `src/config/io.ts`

`SHELL_ENV_EXPECTED_KEYS` に追加します:

```typescript
const SHELL_ENV_EXPECTED_KEYS = [
  // ... 既存のエントリ
  "KILOCODE_API_KEY",
];
```

### 構成設定の適用

#### 4. `src/commands/onboard-auth.config-core.ts`

新しい関数を追加します:

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

`AuthChoice` 型に追加します:

```typescript
export type AuthChoice =
  // ... 既存の選択肢
  "kilocode-api-key";
```

`OnboardOptions` に追加します:

```typescript
export type OnboardOptions = {
  // ... 既存のオプション
  kilocodeApiKey?: string;
};
```

#### 6. `src/commands/auth-choice-options.ts`

`AuthChoiceGroupId` に追加します:

```typescript
export type AuthChoiceGroupId =
  // ... 既存のグループ
  "kilocode";
```

`AUTH_CHOICE_GROUP_DEFS` に追加します:

```typescript
{
  value: "kilocode",
  label: "Kilo Gateway",
  hint: "API キー (OpenRouter 互換)",
  choices: ["kilocode-api-key"],
},
```

`buildAuthChoiceOptions()` 内に追加します:

```typescript
options.push({
  value: "kilocode-api-key",
  label: "Kilo Gateway API キー",
  hint: "OpenRouter 互換ゲートウェイ",
});
```

#### 7. `src/commands/auth-choice.preferred-provider.ts`

マッピングを追加します:

```typescript
const PREFERRED_PROVIDER_BY_AUTH_CHOICE: Partial<Record<AuthChoice, string>> = {
  // ... 既存のマッピング
  "kilocode-api-key": "kilocode",
};
```

### 認証選択の適用

#### 8. `src/commands/auth-choice.apply.api-providers.ts`

インポートを追加します:

```typescript
import {
  // ... 既存のインポート
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.js";
```

`kilocode-api-key` の処理を追加します:

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
        message: `既存の KILOCODE_API_KEY を使用しますか？ (${envKey.source}, ${formatApiKeyPreview(envKey.apiKey)})`,
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
      message: "Kilo Gateway API キーを入力してください",
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

また、関数の冒頭で `tokenProvider` のマッピングを追加します:

```typescript
if (params.opts.tokenProvider === "kilocode") {
  authChoice = "kilocode-api-key";
}
```

### CLI 登録

#### 9. `src/cli/program/register.onboard.ts`

CLI オプションを追加します:

```typescript
.option("--kilocode-api-key <key>", "Kilo Gateway API キー")
```

アクションハンドラーに追加します:

```typescript
kilocodeApiKey: opts.kilocodeApiKey as string | undefined,
```

`auth-choice` のヘルプテキストを更新します:

```typescript
.option(
  "--auth-choice <choice>",
  "認証方法: setup-token|token|chutes|openai-codex|openai-api-key|openrouter-api-key|kilocode-api-key|ai-gateway-api-key|...",
)
```

### 非対話型オンボーディング

#### 10. `src/commands/onboard-non-interactive/local/auth-choice.ts`

`kilocode-api-key` の処理を追加します:

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
  // ... デフォルトモデルの適用処理へ
}
```

### エクスポートの更新

#### 11. `src/commands/onboard-auth.ts`

エクスポートを追加します:

```typescript
export {
  // ... 既存のエクスポート
  applyKilocodeConfig,
  applyKilocodeProviderConfig,
  KILOCODE_BASE_URL,
} from "./onboard-auth.config-core.js";

export {
  // ... 既存のエクスポート
  KILOCODE_DEFAULT_MODEL_REF,
  setKilocodeApiKey,
} from "./onboard-auth.credentials.js";
```

### 特殊なハンドリング (任意)

#### 12. `src/agents/pi-embedded-runner/cache-ttl.ts`

Anthropic モデル用の Kilo Gateway サポートを追加します:

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

Kilo Gateway 用の処理を追加します（OpenRouter と同様）:

```typescript
const isKilocodeGemini = provider === "kilocode" && modelId.toLowerCase().includes("gemini");

// needsNonImageSanitize のチェックに含める
const needsNonImageSanitize =
  isGoogle || isAnthropic || isMistral || isOpenRouterGemini || isKilocodeGemini;
```

## 構成の構造

### ユーザー構成例 (`openclaw.json`)

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

### 認証プロファイル構造 (`auth-profiles.json`)

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

## テストの考慮事項

1. **ユニットテスト:**
   - `setKilocodeApiKey()` が正しいプロファイルを書き込むこと。
   - `applyKilocodeConfig()` が正しいデフォルト値を設定すること。
   - `resolveEnvApiKey("kilocode")` が正しい環境変数を返すこと。

2. **統合テスト:**
   - `--auth-choice kilocode-api-key` を使用したオンボーディングフロー。
   - `--kilocode-api-key` を使用した非対話型オンボーディング。
   - `kilocode/` 接頭辞を使用したモデル選択。

3. **E2E テスト:**
   - Kilo Gateway 経由での実際の API 呼び出し（ライブテスト）。

## 移行に関する注意

- 既存ユーザーへの影響はありません。
- 新規ユーザーはすぐに `kilocode-api-key` を認証方法として選択できます。
- 既存の `kilocode` プロバイダーの手動構成も引き続き動作します。

## 将来的な展望

1. **モデルカタログ:** Kilo Gateway が `/models` エンドポイントを公開した場合、`scanOpenRouterModels()` のようなスキャン機能を追加します。

2. **OAuth 対応:** Kilo Gateway が OAuth を導入した際、認証システムを拡張します。

3. **レート制限:** 必要に応じて、Kilo Gateway 固有のレート制限ハンドリングを追加します。

4. **ドキュメント:** `docs/providers/kilocode.md` を作成し、セットアップと使用方法を説明します。

## 変更サマリー

| ファイル | 変更内容 | 説明 |
| --- | :---: | --- |
| `src/commands/onboard-auth.credentials.ts` | 追加 | `KILOCODE_DEFAULT_MODEL_REF`, `setKilocodeApiKey()` |
| `src/agents/model-auth.ts` | 修正 | `envMap` に `kilocode` を追加 |
| `src/config/io.ts` | 修正 | シェル環境変数キーに `KILOCODE_API_KEY` を追加 |
| `src/commands/onboard-auth.config-core.ts` | 追加 | `applyKilocodeProviderConfig()`, `applyKilocodeConfig()` |
| `src/commands/onboard-types.ts` | 修正 | `AuthChoice` に `kilocode-api-key` を追加、オプションに `kilocodeApiKey` を追加 |
| `src/commands/auth-choice-options.ts` | 修正 | `kilocode` グループとオプションを追加 |
| `src/commands/auth-choice.preferred-provider.ts` | 修正 | `kilocode-api-key` のマッピングを追加 |
| `src/commands/auth-choice.apply.api-providers.ts` | 修正 | `kilocode-api-key` の処理ロジックを追加 |
| `src/cli/program/register.onboard.ts` | 修正 | CLI オプション `--kilocode-api-key` を追加 |
| `src/commands/onboard-non-interactive/local/auth-choice.ts` | 修正 | 非対話モードでの処理を追加 |
| `src/commands/onboard-auth.ts` | 修正 | 新しい関数のエクスポートを追加 |
| `src/agents/pi-embedded-runner/cache-ttl.ts` | 修正 | kilocode プロバイダーのキャッシュ適格性を追加 |
| `src/agents/transcript-policy.ts` | 修正 | kilocode 経由の Gemini モデル用サニタイズ処理を追加 |
