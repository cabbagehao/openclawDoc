---
summary: "OpenClaw が認証プロファイルをローテーションし、モデル間でフォールバックする方法"
read_when:
  - 認証プロファイルのローテーション、クールダウン、またはモデルのフォールバック動作の診断
  - 認証プロファイルまたはモデルのフェイルオーバー ルールの更新
title: "モデルフェイルオーバー"
x-i18n:
  source_hash: "5a0a7c83118d7d751ad0cd4936a548ba48b3a95cd4ca96276e4e308078ccf5c9"
---

# モデルフェイルオーバー

OpenClaw は 2 つの段階で障害を処理します。

1. 現在のプロバイダー内での **認証プロファイルのローテーション**。
2. `agents.defaults.model.fallbacks` の次のモデルへの **モデル フォールバック**。

このドキュメントでは、実行時ルールとそれを裏付けるデータについて説明します。

## 認証ストレージ (キー + OAuth)

OpenClaw は、API キーと OAuth トークンの両方に **認証プロファイル** を使用します。

- シークレットは `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (レガシー: `~/.openclaw/agent/auth-profiles.json`) にあります。
- 構成 `auth.profiles` / `auth.order` は **メタデータ + ルーティングのみ** (シークレットなし)。
- 従来のインポート専用 OAuth ファイル: `~/.openclaw/credentials/oauth.json` (最初の使用時に `auth-profiles.json` にインポートされます)。

詳細: [/concepts/oauth](/concepts/oauth)

資格情報の種類:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (一部のプロバイダーでは + `projectId`/`enterpriseUrl`)

## プロファイル ID

OAuth ログインでは個別のプロファイルが作成されるため、複数のアカウントが共存できます。

- デフォルト: `provider:default` (電子メールが使用できない場合)。
- 電子メールによる OAuth: `provider:<email>` (例: `google-antigravity:user@gmail.com`)。

プロファイルは、`profiles` の下の `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` に存在します。

## 回転順序

プロバイダーに複数のプロファイルがある場合、OpenClaw は次のような順序を選択します。

1. **明示的な構成**: `auth.order[provider]` (設定されている場合)。
2. **設定されたプロファイル**: `auth.profiles` はプロバイダーによってフィルタリングされました。
3. **保存されたプロファイル**: プロバイダーの `auth-profiles.json` のエントリ。明示的な順序が設定されていない場合、OpenClaw はラウンドロビン順序を使用します。

- **主キー:** プロファイル タイプ (**API キーの前に OAuth**)。
- **二次キー:** `usageStats.lastUsed` (各タイプ内で最も古いものから順)。
- **クールダウン/無効化されたプロファイル**は、有効期限が最も早い順に最後に移動されます。

### セッションの持続性 (キャッシュに優しい)

OpenClaw **選択された認証プロファイルをセッションごとに固定**して、プロバイダーのキャッシュを暖かく保ちます。
リクエストごとにローテーションするわけではありません\*\*。固定されたプロファイルは、次の場合まで再利用されます。

- セッションがリセットされます (`/new` / `/reset`)
- 圧縮が完了します (圧縮カウントが増加します)
- プロファイルはクールダウン中/無効になっています

`/model …@<profileId>` による手動選択により、そのセッションの **ユーザー オーバーライド**が設定されます
新しいセッションが開始されるまで自動回転されません。

自動固定されたプロファイル (セッション ルーターによって選択された) は **優先** として扱われます。
それらは最初に試行されますが、OpenClaw はレート制限/タイムアウトに応じて別のプロファイルにローテーションする可能性があります。
ユーザーが固定したプロファイルはそのプロファイルにロックされたままになります。失敗してモデルがフォールバックした場合
が設定されている場合、OpenClaw はプロファイルを切り替える代わりに次のモデルに移行します。

### OAuth が「失われたように見える」理由

同じプロバイダーの OAuth プロファイルと API キー プロファイルの両方がある場合、固定されない限り、ラウンドロビンによってメッセージ間でそれらを切り替えることができます。単一のプロファイルを強制するには:- `auth.order[provider] = ["provider:profileId"]` でピン留めするか、または

- プロファイル オーバーライドを使用して、`/model …` 経由でセッションごとのオーバーライドを使用します (UI/チャット サーフェスでサポートされている場合)。

## クールダウン

認証/レート制限エラー（または次のようなタイムアウト）によりプロファイルが失敗した場合
レート制限など)、OpenClaw はそれをクールダウンとしてマークし、次のプロファイルに移動します。
フォーマット/無効なリクエスト エラー (例: Cloud Code Assist ツールの呼び出し ID)
検証の失敗）はフェイルオーバーに値するものとして扱われ、同じクールダウンが使用されます。
`Unhandled stop reason: error` などの OpenAI 互換の停止理由エラー、
`stop reason: error` および `reason: error` はタイムアウト/フェイルオーバーとして分類されます
信号。

クールダウンでは指数バックオフが使用されます。

- 1分
- 5分
- 25分
- 1時間（上限）

状態は `usageStats` の下の `auth-profiles.json` に保存されます。

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 課金を無効にする

請求/クレジットの失敗 (「クレジット不足」/「クレジット残高が低すぎる」など) はフェイルオーバーの価値があるものとして扱われますが、通常は一時的なものではありません。 OpenClaw は、短いクールダウンの代わりに、プロファイルを **無効** (バックオフが長い) としてマークし、次のプロファイル/プロバイダーにローテーションします。

状態は `auth-profiles.json` に保存されます。

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

デフォルト:

- 請求バックオフは **5 時間**から始まり、請求失敗ごとに 2 倍になり、**24 時間**で上限となります。
- プロファイルが **24 時間**失敗しなかった場合、バックオフ カウンターはリセットされます (構成可能)。

## モデルのフォールバックプロバイダーのすべてのプロファイルが失敗した場合、OpenClaw は次のモデルに移行します

`agents.defaults.model.fallbacks`。これは、認証の失敗、レート制限、および
プロファイルのローテーションを使い果たしたタイムアウト (他のエラーはフォールバックを進めません)。

モデルのオーバーライド (フックまたは CLI) で実行が開始された場合でも、フォールバックは次の時点で終了します。
`agents.defaults.model.primary` 構成されたフォールバックを試した後。

## 関連する構成

以下については、[ゲートウェイ構成](/gateway/configuration) を参照してください。

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` ルーティング

より広範なモデルの選択とフォールバックの概要については、[モデル](/concepts/models) を参照してください。
