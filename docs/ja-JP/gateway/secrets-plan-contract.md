---
summary: "「secrets apply」プランの契約: ターゲット検証、パス照合、および「auth-profiles.json」ターゲット スコープ"
read_when:
  - 「openclaw Secrets apply」計画の生成またはレビュー
  - 「無効なプラン ターゲット パス」エラーのデバッグ
  - ターゲットの種類とパスの検証動作を理解する
title: "秘密適用プラン契約書"
x-i18n:
  source_hash: "6fcbec7fbbe8d35fa6b9ef354d8aff83183c9f174097ff7a31b42498203f021b"
---

# シークレット適用プラン契約

このページでは、`openclaw secrets apply` によって強制される厳密な契約を定義します。

ターゲットがこれらのルールに一致しない場合、構成を変更する前に適用は失敗します。

## ファイルの形状を計画する

`openclaw secrets apply --from <plan.json>` は、計画ターゲットの `targets` 配列を想定しています。

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## サポートされるターゲット スコープ

プラン ターゲットは、以下のサポートされている資格情報パスに対して受け入れられます。

- [SecretRef 資格情報サーフェス](/reference/secretref-credential-surface)

## ターゲットタイプの動作

一般規則:

- `target.type` が認識され、正規化された `target.path` 形状と一致する必要があります。

互換性エイリアスは、既存のプランに対して引き続き受け入れられます。

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## パス検証ルール

各ターゲットは次のすべてで検証されます。

- `type` は認識されたターゲット タイプである必要があります。
- `path` は空でないドット パスでなければなりません。
- `pathSegments`は省略可能です。指定した場合は、`path` とまったく同じパスに正規化する必要があります。
- 禁止されたセグメントは拒否されます: `__proto__`、`prototype`、`constructor`。
- 正規化されたパスは、ターゲット タイプの登録されたパス形状と一致する必要があります。
- `providerId` または `accountId` が設定されている場合は、パス内でエンコードされた ID と一致する必要があります。
- `auth-profiles.json` ターゲットには `agentId` が必要です。
- 新しい `auth-profiles.json` マッピングを作成する場合は、`authProfileProvider` を含めます。

## 失敗時の動作ターゲットが検証に失敗した場合、適用は次のようなエラーで終了します

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

無効なプランに対して書き込みはコミットされません。

## 実行時および監査範囲のメモ

- 参照専用の `auth-profiles.json` エントリ (`keyRef`/`tokenRef`) は、実行時解決および監査カバレッジに含まれます。
- `secrets apply` は、サポートされている `openclaw.json` ターゲット、サポートされている `auth-profiles.json` ターゲット、およびオプションのスクラブ ターゲットを書き込みます。

## オペレーターのチェック

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
```

適用が無効なターゲット パス メッセージで失敗した場合は、`openclaw secrets configure` を使用してプランを再生成するか、ターゲット パスを上記のサポートされている形状に修正します。

## 関連ドキュメント

- [機密管理](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [SecretRef 資格情報サーフェス](/reference/secretref-credential-surface)
- [構成リファレンス](/gateway/configuration-reference)
