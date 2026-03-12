---
summary: "サポートされている正規の SecretRef 資格情報サーフェスとサポートされていない SecretRef 資格情報サーフェス"
read_when:
  - SecretRef 資格情報の適用範囲の確認
  - 資格情報が「secrets configure」または「secrets apply」の対象となるかどうかを監査する
  - 資格情報がサポート対象外である理由の検証
title: "SecretRef 資格情報表面"
x-i18n:
  source_hash: "836ed5867601d359f966eca357ebcf675bff06d52f046ca47e7a79d3ee5f0b9a"
---

# SecretRef 資格情報サーフェス

このページは、正規の SecretRef 資格情報サーフェスを定義します。

スコープの意図:

- 範囲内: OpenClaw が作成またはローテーションしない、厳密にユーザー提供の資格情報。
- 範囲外: 実行時に生成または循環される認証情報、OAuth 更新マテリアル、およびセッションのようなアーティファクト。

## サポートされている認証情報

### `openclaw.json` ターゲット (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"- `models.providers.*.apiKey`

- `models.providers.*.headers.*`
- `skills.entries.*.apiKey`
- `agents.defaults.memorySearch.remote.apiKey`
- `agents.list[].memorySearch.remote.apiKey`
- `talk.apiKey`
- `talk.providers.*.apiKey`
- `messages.tts.elevenlabs.apiKey`
- `messages.tts.openai.apiKey`
- `tools.web.search.apiKey`
- `tools.web.search.gemini.apiKey`
- `tools.web.search.grok.apiKey`
- `tools.web.search.kimi.apiKey`
- `tools.web.search.perplexity.apiKey`
- `gateway.auth.password`
- `gateway.auth.token`
- `gateway.remote.token`
- `gateway.remote.password`
- `cron.webhookToken`
- `channels.telegram.botToken`
- `channels.telegram.webhookSecret`
- `channels.telegram.accounts.*.botToken`
- `channels.telegram.accounts.*.webhookSecret`
- `channels.slack.botToken`
- `channels.slack.appToken`
- `channels.slack.userToken`
- `channels.slack.signingSecret`
- `channels.slack.accounts.*.botToken`
- `channels.slack.accounts.*.appToken`
- `channels.slack.accounts.*.userToken`
- `channels.slack.accounts.*.signingSecret`
- `channels.discord.token`
- `channels.discord.pluralkit.token`
- `channels.discord.voice.tts.elevenlabs.apiKey`
- `channels.discord.voice.tts.openai.apiKey`
- `channels.discord.accounts.*.token`
- `channels.discord.accounts.*.pluralkit.token`
- `channels.discord.accounts.*.voice.tts.elevenlabs.apiKey`
- `channels.discord.accounts.*.voice.tts.openai.apiKey`
- `channels.irc.password`
- `channels.irc.nickserv.password`
- `channels.irc.accounts.*.password`
- `channels.irc.accounts.*.nickserv.password`
- `channels.bluebubbles.password`
- `channels.bluebubbles.accounts.*.password`
- `channels.feishu.appSecret`
- `channels.feishu.verificationToken`
- `channels.feishu.accounts.*.appSecret`
- `channels.feishu.accounts.*.verificationToken`
- `channels.msteams.appPassword`
- `channels.mattermost.botToken`
- `channels.mattermost.accounts.*.botToken`
- `channels.matrix.password`
- `channels.matrix.accounts.*.password`
- `channels.nextcloud-talk.botSecret`
- `channels.nextcloud-talk.apiPassword`
- `channels.nextcloud-talk.accounts.*.botSecret`
- `channels.nextcloud-talk.accounts.*.apiPassword`
- `channels.zalo.botToken`
- `channels.zalo.webhookSecret`
- `channels.zalo.accounts.*.botToken`
- `channels.zalo.accounts.*.webhookSecret`
- `channels.googlechat.serviceAccount` 兄弟 `serviceAccountRef` 経由 (互換性例外)
- `channels.googlechat.accounts.*.serviceAccount` 兄弟 `serviceAccountRef` 経由 (互換性例外)### `auth-profiles.json` ターゲット (`secrets configure` + `secrets apply` + `secrets audit`)

- `profiles.*.keyRef` (`type: "api_key"`)
- `profiles.*.tokenRef` (`type: "token"`)

[//]: # "secretref-supported-list-end"

注:

- 認証プロファイル プランのターゲットには `agentId` が必要です。
- 計画エントリは `profiles.*.key` / `profiles.*.token` をターゲットにし、兄弟参照 (`keyRef` / `tokenRef`) を書き込みます。
- 認証プロファイル参照は、実行時解決と監査カバレッジに含まれます。
- SecretRef 管理モデル プロバイダーの場合、生成された `agents/*/agent/models.json` エントリは、`apiKey`/ヘッダー サーフェスの非シークレット マーカー (解決されたシークレット値ではない) を保持します。
- Web 検索の場合:
  - 明示的プロバイダー モード (`tools.web.search.provider` セット) では、選択したプロバイダー キーのみがアクティブになります。
  - 自動モード (`tools.web.search.provider` 未設定) では、`tools.web.search.apiKey` およびプロバイダー固有のキーがアクティブになります。

## サポートされていない認証情報

範囲外の資格情報には次のものが含まれます。

[//]: # "secretref-unsupported-list-start"

- `commands.ownerDisplaySecret`
- `channels.matrix.accessToken`
- `channels.matrix.accounts.*.accessToken`
- `hooks.token`
- `hooks.gmail.pushToken`
- `hooks.mappings[].sessionKey`
- `auth-profiles.oauth.*`
- `discord.threadBindings.*.webhookToken`
- `whatsapp.creds.json`

[//]: # "secretref-unsupported-list-end"

理論的根拠:

- これらの認証情報は、読み取り専用の外部 SecretRef 解決に適合しない、ミント、ローテーション、セッション保持クラス、または OAuth 永続クラスです。
