---
summary: "`secrets apply` 実行プランの仕様: ターゲットの検証、パスの一致ルール、および `auth-profiles.json` の対象範囲"
description: "secrets apply が受け付けるプラン形式、対象範囲、target type、パス検証、失敗時挙動、運用チェック項目を定義します。"
read_when:
  - "`openclaw secrets apply` 用のプランを生成またはレビューする場合"
  - 「Invalid plan target path」エラーをデバッグする場合
  - ターゲットの種類やパスの検証ルールを理解したい場合
title: "OpenClaw secrets apply プラン仕様とターゲット検証・パス規則"
x-i18n:
  source_hash: "6fcbec7fbbe8d35fa6b9ef354d8aff83183c9f174097ff7a31b42498203f021b"
---
このページでは、`openclaw secrets apply` コマンドが強制する厳格な仕様（コントラクト）について定義します。

指定されたターゲットが以下のルールに一致しない場合、構成設定を変更する前に処理は失敗します。

## プランファイルの形式

`openclaw secrets apply --from <plan.json>` は、以下のような `targets` 配列を含む JSON を想定しています:

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

## サポートされる対象範囲

プランのターゲットとして受け入れられる認証情報のパスについては、以下を参照してください:

- [SecretRef 認証情報サーフェス](/reference/secretref-credential-surface)

## ターゲット型 (Target type) の挙動

一般原則:
- `target.type` は既知の種類である必要があり、正規化された `target.path` の形状と一致していなければなりません。

既存のプランとの互換性のために、以下のエイリアスも引き続き受け入れられます:
- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## パス検証ルール

各ターゲットは、以下のすべての項目で検証されます:

- `type` は既知のターゲット型であること。
- `path` は空でないドット区切りのパスであること。
- `pathSegments` は省略可能ですが、指定された場合は `path` と全く同じパスに正規化されること。
- 禁止されたセグメント（`__proto__`, `prototype`, `constructor`）が含まれていないこと。
- 正規化されたパスが、そのターゲット型に対して登録済みの形状と一致すること。
- `providerId` や `accountId` が指定されている場合、パス内に埋め込まれた ID と一致すること。
- `auth-profiles.json` を対象とする場合は `agentId` が必須であること。
- 新しい `auth-profiles.json` のマッピングを作成する場合は `authProfileProvider` を含めること。

## 失敗時の挙動

ターゲットの検証に失敗した場合、コマンドは以下のようなエラーを出力して終了します:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

プランが不正な場合、一切の書き込み（構成の変更）は行われません。

## 実行時および監査に関する補足

- SecretRef のみで構成された `auth-profiles.json` のエントリ（`keyRef` / `tokenRef`）は、実行時の解決プロセスおよび監査（Audit）の対象に含まれます。
- `secrets apply` は、サポートされている `openclaw.json` および `auth-profiles.json` のターゲットへの書き込み、およびオプションでの平文の消去（Scrub）を行います。

## 運用チェック

```bash
# 書き込みを行わずにプランを検証
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# 実際に適用
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
```

「Invalid target path」というメッセージで適用に失敗した場合は、`openclaw secrets configure` でプランを再生成するか、サポートされている形状に合わせてターゲットパスを修正してください。

## 関連ドキュメント

- [シークレット管理](/gateway/secrets)
- [CLI: secrets](/cli/secrets)
- [SecretRef 認証情報サーフェス](/reference/secretref-credential-surface)
- [構成リファレンス](/gateway/configuration-reference)
