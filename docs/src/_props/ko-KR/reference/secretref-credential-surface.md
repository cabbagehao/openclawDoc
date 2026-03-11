---
summary: "정식으로 지원되는 vs 미지원 SecretRef credential 표면"
read_when:
  - SecretRef credential coverage 를 검증할 때
  - 특정 credential 이 `secrets configure` 또는 `secrets apply` 대상인지 감사할 때
  - 어떤 credential 이 지원 표면 밖에 있는지 이유를 확인할 때
title: "SecretRef Credential Surface"
---

# SecretRef credential surface

이 페이지는 정식 SecretRef credential surface 를 정의합니다.

범위 의도:

* 범위 포함: OpenClaw 가 직접 발급하거나 회전하지 않는, 사용자가 제공한 credential 만
* 범위 제외: runtime 이 발급하거나 회전하는 credential, OAuth refresh material, session 류 아티팩트

## Supported credentials

### `openclaw.json` 대상 (`secrets configure` + `secrets apply` + `secrets audit`)

[//]: # "secretref-supported-list-start"

* `models.providers.*.apiKey`
* `models.providers.*.headers.*`
* `skills.entries.*.apiKey`
* `agents.defaults.memorySearch.remote.apiKey`
* `agents.list[].memorySearch.remote.apiKey`
* `talk.apiKey`
* `talk.providers.*.apiKey`
* `messages.tts.elevenlabs.apiKey`
* `messages.tts.openai.apiKey`
* `tools.web.search.apiKey`
* `tools.web.search.gemini.apiKey`
* `tools.web.search.grok.apiKey`
* `tools.web.search.kimi.apiKey`
* `tools.web.search.perplexity.apiKey`
* `gateway.auth.password`
* `gateway.auth.token`
* `gateway.remote.token`
* `gateway.remote.password`
* `cron.webhookToken`
* `channels.telegram.botToken`
* `channels.telegram.webhookSecret`
* `channels.telegram.accounts.*.botToken`
* `channels.telegram.accounts.*.webhookSecret`
* `channels.slack.botToken`
* `channels.slack.appToken`
* `channels.slack.userToken`
* `channels.slack.signingSecret`
* `channels.slack.accounts.*.botToken`
* `channels.slack.accounts.*.appToken`
* `channels.slack.accounts.*.userToken`
* `channels.slack.accounts.*.signingSecret`
* `channels.discord.token`
* `channels.discord.pluralkit.token`
* `channels.discord.voice.tts.elevenlabs.apiKey`
* `channels.discord.voice.tts.openai.apiKey`
* `channels.discord.accounts.*.token`
* `channels.discord.accounts.*.pluralkit.token`
* `channels.discord.accounts.*.voice.tts.elevenlabs.apiKey`
* `channels.discord.accounts.*.voice.tts.openai.apiKey`
* `channels.irc.password`
* `channels.irc.nickserv.password`
* `channels.irc.accounts.*.password`
* `channels.irc.accounts.*.nickserv.password`
* `channels.bluebubbles.password`
* `channels.bluebubbles.accounts.*.password`
* `channels.feishu.appSecret`
* `channels.feishu.verificationToken`
* `channels.feishu.accounts.*.appSecret`
* `channels.feishu.accounts.*.verificationToken`
* `channels.msteams.appPassword`
* `channels.mattermost.botToken`
* `channels.mattermost.accounts.*.botToken`
* `channels.matrix.password`
* `channels.matrix.accounts.*.password`
* `channels.nextcloud-talk.botSecret`
* `channels.nextcloud-talk.apiPassword`
* `channels.nextcloud-talk.accounts.*.botSecret`
* `channels.nextcloud-talk.accounts.*.apiPassword`
* `channels.zalo.botToken`
* `channels.zalo.webhookSecret`
* `channels.zalo.accounts.*.botToken`
* `channels.zalo.accounts.*.webhookSecret`
* `channels.googlechat.serviceAccount` via sibling `serviceAccountRef` (compatibility exception)
* `channels.googlechat.accounts.*.serviceAccount` via sibling `serviceAccountRef` (compatibility exception)

### `auth-profiles.json` 대상 (`secrets configure` + `secrets apply` + `secrets audit`)

* `profiles.*.keyRef` (`type: "api_key"`)
* `profiles.*.tokenRef` (`type: "token"`)

[//]: # "secretref-supported-list-end"

메모:

* auth-profile plan target 은 `agentId` 가 필요합니다.
* plan entry 는 `profiles.*.key` / `profiles.*.token` 을 대상으로 하고 sibling ref (`keyRef` / `tokenRef`)를 기록합니다.
* auth-profile ref 는 runtime resolution 및 audit coverage 에 포함됩니다.
* SecretRef 로 관리되는 model provider 의 경우, 생성된 `agents/*/agent/models.json` 항목은 `apiKey`/header surface 에 대해 비밀이 아닌 marker(해석된 비밀 값 아님)만 저장합니다.
* web search 의 경우:
  * explicit provider mode (`tools.web.search.provider` 설정)에서는 선택된 provider key 만 활성화
  * auto mode (`tools.web.search.provider` unset)에서는 `tools.web.search.apiKey` 와 provider-specific key 가 활성화

## Unsupported credentials

범위 밖 credential 예시:

[//]: # "secretref-unsupported-list-start"

* `commands.ownerDisplaySecret`
* `channels.matrix.accessToken`
* `channels.matrix.accounts.*.accessToken`
* `hooks.token`
* `hooks.gmail.pushToken`
* `hooks.mappings[].sessionKey`
* `auth-profiles.oauth.*`
* `discord.threadBindings.*.webhookToken`
* `whatsapp.creds.json`

[//]: # "secretref-unsupported-list-end"

이유:

* 이런 credential 은 발급되거나 회전되거나 session-bearing 이거나 OAuth 지속물에 속하기 때문에, 읽기 전용 외부 SecretRef resolution 모델과 맞지 않습니다.
