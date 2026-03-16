---
title: "Slash Commands"
description: "텍스트·네이티브 슬래시 명령, directive, 권한 설정, 모델·세션 제어 명령 목록을 정리한 가이드입니다."
summary: "Slash command: text vs native, config, 지원 명령"
read_when:
  - chat command를 사용하거나 설정할 때
  - command routing 또는 permission을 디버깅할 때
x-i18n:
  source_path: "tools/slash-commands.md"
---

# Slash commands

command는 Gateway가 처리합니다. 대부분의 command는 `/`로 시작하는 **단독 메시지**로 보내야 합니다.
host-only bash chat command는 `! <cmd>`를 사용하며, `/bash <cmd>`는 그 별칭입니다.

관련된 시스템은 두 가지입니다.

- **Commands**: 단독 `/...` 메시지
- **Directives**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`
  - directive는 모델이 보기 전에 메시지에서 제거됩니다.
  - 일반 채팅 메시지( directive-only 가 아닌 경우)에서는 “inline hint”처럼 취급되며 session 설정을 영구 변경하지 않습니다.
  - directive-only 메시지(메시지가 directive만 포함)는 session에 영구 적용되고 acknowledgement를 반환합니다.
  - directive는 **승인된 발신자**에게만 적용됩니다. `commands.allowFrom`이 설정되어 있으면 그것만 allowlist로 사용하고, 없으면 채널 allowlist/pairing + `commands.useAccessGroups`로 권한을 판단합니다.
    권한이 없는 발신자에게는 directive가 plain text처럼 처리됩니다.

또한 몇 가지 **inline shortcut**도 있습니다(allowlisted/authorized sender 전용): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
이들은 즉시 실행되고, 모델이 남은 텍스트를 보기 전에 제거되며, 나머지 텍스트는 정상 흐름으로 계속 진행됩니다.

## Config

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    debug: false,
    restart: false,
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

- `commands.text` (기본값 `true`)는 chat message에서 `/...` 파싱을 활성화합니다.
  - native command가 없는 표면(WhatsApp/WebChat/Signal/iMessage/Google Chat/MS Teams)에서는 이를 `false`로 해도 text command가 계속 동작합니다.
- `commands.native` (기본값 `"auto"`)는 native command를 등록합니다.
  - Auto: Discord/Telegram은 on, Slack은 off(직접 slash command 추가 전까지), native를 지원하지 않는 provider에는 무시
  - provider별 override는 `channels.discord.commands.native`, `channels.telegram.commands.native`, `channels.slack.commands.native`에서 설정(bool 또는 `"auto"`)
  - `false`는 시작 시 Discord/Telegram에서 기존 등록 command를 제거합니다. Slack command는 Slack app이 관리하므로 자동 제거되지 않습니다.
- `commands.nativeSkills` (기본값 `"auto"`)는 지원되는 경우 **skill** command를 native로 등록합니다.
  - Auto: Discord/Telegram은 on, Slack은 off(Slack은 skill별 slash command를 직접 만들어야 함)
  - provider별 override는 `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, `channels.slack.commands.nativeSkills`에서 설정
- `commands.bash` (기본값 `false`)는 host shell command 실행용 `! <cmd>`를 활성화합니다(`/bash <cmd>`는 별칭, `tools.elevated` allowlist 필요)
- `commands.bashForegroundMs` (기본값 `2000`)는 bash가 background mode로 전환되기 전까지 기다리는 시간을 제어합니다(`0`이면 즉시 background)
- `commands.config` (기본값 `false`)는 `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기)
- `commands.debug` (기본값 `false`)는 `/debug`를 활성화합니다(runtime-only override)
- `commands.allowFrom` (선택)는 command authorization용 provider별 allowlist를 설정합니다. 설정되면, command와 directive의 권한 판단은 이것만 사용하고 채널 allowlist/pairing 및 `commands.useAccessGroups`는 무시됩니다. `"*"`는 전역 기본값으로, provider별 key가 있으면 그것이 우선합니다.
- `commands.useAccessGroups` (기본값 `true`)는 `commands.allowFrom`이 없을 때 command에 allowlist/policy를 적용합니다.

## Command list

Text + native(활성화된 경우):

- `/help`
- `/commands`
- `/skill <name> [input]` (name으로 skill 실행)
- `/status` (현재 상태 표시, 가능하면 현재 model provider의 provider usage/quota 포함)
- `/allowlist` (allowlist 항목 조회/추가/삭제)
- `/approve <id> allow-once|allow-always|deny` (exec approval prompt 처리)
- `/context [list|detail|json]` (“context” 설명. `detail`은 파일별 + tool별 + skill별 + system prompt 크기 표시)
- `/export-session [path]` (별칭: `/export`) (full system prompt를 포함해 현재 session을 HTML로 export)
- `/whoami` (발신자 id 표시, 별칭 `/id`)
- `/session idle <duration|off>` (focused thread binding의 inactivity auto-unfocus 관리)
- `/session max-age <duration|off>` (focused thread binding의 hard max-age auto-unfocus 관리)
- `/subagents list|kill|log|info|send|steer|spawn` (현재 session의 sub-agent run 조회/제어/생성)
- `/acp spawn|cancel|steer|close|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|sessions` (ACP runtime session 조회/제어)
- `/agents` (현재 session에 연결된 thread-bound agent 나열)
- `/focus <target>` (Discord: 이 thread 또는 새 thread를 session/subagent target에 bind)
- `/unfocus` (Discord: 현재 thread binding 제거)
- `/kill <id|#|all>` (현재 session에서 실행 중인 sub-agent를 즉시 abort, confirmation message 없음)
- `/steer <id|#> <message>` (실행 중인 sub-agent를 즉시 steer: 가능하면 현재 run 안에서, 아니면 현재 작업을 abort하고 steer message로 재시작)
- `/tell <id|#> <message>` (`/steer` 별칭)
- `/config show|get|set|unset` (디스크 config 영속화, owner-only, `commands.config: true` 필요)
- `/debug show|set|unset|reset` (runtime override, owner-only, `commands.debug: true` 필요)
- `/usage off|tokens|full|cost` (응답별 usage footer 또는 로컬 비용 요약)
- `/tts off|always|inbound|tagged|status|provider|limit|summary|audio` (TTS 제어. [/tts](/tts) 참고)
  - Discord에서는 `/tts`가 예약되어 있어 native command는 `/voice`를 사용. text `/tts`는 계속 사용 가능
- `/stop`
- `/restart`
- `/dock-telegram` (별칭: `/dock_telegram`) (응답 채널을 Telegram으로 전환)
- `/dock-discord` (별칭: `/dock_discord`) (응답 채널을 Discord로 전환)
- `/dock-slack` (별칭: `/dock_slack`) (응답 채널을 Slack으로 전환)
- `/activation mention|always` (group 전용)
- `/send on|off|inherit` (owner-only)
- `/reset` 또는 `/new [model]` (선택적 model hint, 나머지 텍스트는 그대로 전달)
- `/think <off|minimal|low|medium|high|xhigh>` (model/provider에 따라 동적 선택, 별칭 `/thinking`, `/t`)
- `/verbose on|full|off` (별칭 `/v`)
- `/reasoning on|off|stream` (별칭 `/reason`; on이면 `Reasoning:` 접두사의 별도 메시지를 보냄, `stream` = Telegram draft only)
- `/elevated on|off|ask|full` (별칭 `/elev`; `full`은 exec approval 건너뜀)
- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` (현재 상태 보기는 `/exec`)
- `/model <name>` (별칭 `/models`; 또는 `agents.defaults.models.*.alias`의 `/<alias>`)
- `/queue <mode>` (예: `debounce:2s cap:25 drop:summarize`; 현재 설정 보기는 `/queue`)
- `/bash <command>` (host-only, `! <command>` 별칭, `commands.bash: true` + `tools.elevated` allowlist 필요)

Text-only:

- `/compact [instructions]` ([/concepts/compaction](/concepts/compaction) 참고)
- `! <command>` (host-only, 한 번에 하나씩, 장기 job은 `!poll`, `!stop` 사용)
- `!poll` (output/status 확인, 선택적 `sessionId` 허용, `/bash poll`도 가능)
- `!stop` (실행 중인 bash job 중단, 선택적 `sessionId` 허용, `/bash stop`도 가능)

참고:

- command와 인자 사이에는 선택적으로 `:`를 넣을 수 있습니다(예: `/think: high`, `/send: on`, `/help:`).
- `/new <model>`은 model alias, `provider/model`, provider name(fuzzy match)을 받을 수 있습니다. 매칭되지 않으면 텍스트는 message body로 취급됩니다.
- provider usage의 전체 breakdown은 `openclaw status --usage`를 사용하세요.
- `/allowlist add|remove`는 `commands.config=true`가 필요하며 채널 `configWrites`를 따릅니다.
- `/usage`는 응답별 usage footer를 제어하고, `/usage cost`는 OpenClaw session log 기반의 로컬 비용 요약을 표시합니다.
- `/restart`는 기본 활성화되어 있습니다. 비활성화하려면 `commands.restart: false`를 설정하세요.
- Discord 전용 native command: `/vc join|leave|status` (voice channel 제어, `channels.discord.voice`와 native commands 필요, text command는 없음)
- Discord thread-binding command(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`)는 effective thread binding이 활성화되어 있어야 합니다(`session.threadBindings.enabled`, `channels.discord.threadBindings.enabled`)
- ACP command reference와 runtime behavior는 [ACP Agents](/tools/acp-agents)를 참고하세요.
- `/verbose`는 debugging과 추가 가시성을 위한 기능이므로, 평소에는 **off**를 유지하는 편이 좋습니다.
- tool failure summary는 관련 있을 때 계속 표시되지만, 자세한 failure text는 `/verbose`가 `on` 또는 `full`일 때만 포함됩니다.
- `/reasoning`(및 `/verbose`)은 group setting에서 위험할 수 있습니다. 의도치 않은 internal reasoning 또는 tool output을 노출할 수 있으므로, 특히 group chat에서는 꺼 두는 편이 안전합니다.
- **Fast path:** allowlisted sender의 command-only message는 즉시 처리됩니다(queue와 model을 우회)
- **Group mention gating:** allowlisted sender의 command-only message는 mention requirement를 우회합니다.
- **Inline shortcut (allowlisted sender only):** 일부 command는 일반 메시지 안에 포함되어 있어도 동작하고, 모델이 남은 텍스트를 보기 전에 제거됩니다.
  - 예: `hey /status`는 status reply를 즉시 보내고, 나머지 텍스트는 정상 흐름으로 진행됩니다.
- 현재 지원: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
- 권한 없는 command-only message는 조용히 무시되며, inline `/...` token은 plain text로 처리됩니다.
- **Skill command:** `user-invocable` skill은 slash command로 노출됩니다. 이름은 `a-z0-9_`로 정리되고 최대 32자이며, 충돌 시 `_2` 같은 숫자 suffix가 붙습니다.
  - `/skill <name> [input]`은 name으로 skill을 실행합니다(native command limit 때문에 skill별 command를 못 쓰는 경우에 유용)
  - 기본적으로 skill command는 일반 request처럼 모델로 전달됩니다.
  - skill은 선택적으로 `command-dispatch: tool`을 선언해 command를 tool로 직접 라우팅할 수 있습니다(결정론적, 모델 불필요)
  - 예: `/prose` (OpenProse plugin) — [OpenProse](/prose) 참고
- **Native command argument:** Discord는 동적 옵션에 autocomplete를 사용하고(필수 인자를 생략하면 button menu도 사용), Telegram과 Slack은 choice를 지원하는 command에서 인자를 생략하면 button menu를 표시합니다.

## Usage surfaces (what shows where)

- **Provider usage/quota** (예: “Claude 80% left”)는 usage tracking이 활성화된 경우 `/status`에 표시됩니다.
- **응답별 token/cost**는 `/usage off|tokens|full`로 제어됩니다(일반 reply 뒤에 붙음).
- `/model status`는 usage가 아니라 **model/auth/endpoint** 상태를 보여줍니다.

## Model selection (`/model`)

`/model`은 directive로 구현됩니다.

예시:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model opus@anthropic:default
/model status
```

참고:

- `/model`, `/model list`는 compact numbered picker(모델 family + 사용 가능한 provider)를 보여줍니다.
- Discord에서는 `/model`, `/models`가 provider/model dropdown + Submit이 있는 interactive picker를 엽니다.
- `/model <#>`는 해당 picker에서 선택하며, 가능하면 현재 provider를 우선합니다.
- `/model status`는 상세 view를 보여주며, 가능하면 provider endpoint(`baseUrl`)와 API mode(`api`)도 포함합니다.

## Debug overrides

`/debug`는 **runtime-only** config override(메모리상, 디스크 아님)를 설정합니다. owner-only이며 기본 비활성, `commands.debug: true`로 활성화합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

참고:

- override는 즉시 적용되지만 `openclaw.json`에는 쓰지 않습니다.
- `/debug reset`으로 모든 override를 지우고 디스크 config 상태로 되돌릴 수 있습니다.

## Config updates

`/config`는 디스크의 `openclaw.json`에 씁니다. owner-only이며 기본 비활성, `commands.config: true`로 활성화합니다.

예시:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

참고:

- 쓰기 전 config validation을 수행하며, 잘못된 변경은 거부됩니다.
- `/config` 변경은 restart 후에도 유지됩니다.

## Surface notes

- **Text command**는 일반 chat session에서 실행됩니다(DM은 `main` 공유, group은 자체 session 사용).
- **Native command**는 격리된 session을 사용합니다.
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (prefix는 `channels.slack.slashCommand.sessionPrefix`로 설정 가능)
  - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey`를 통해 chat session을 대상으로 함)
- **`/stop`**은 현재 chat session을 대상으로 하여 현재 run을 abort할 수 있게 합니다.
- **Slack:** `channels.slack.slashCommand`는 단일 `/openclaw` 스타일 command용으로 여전히 지원됩니다. `commands.native`를 활성화하면 built-in command마다 Slack slash command를 하나씩 직접 만들어야 합니다(이름은 `/help` 등과 동일).
  command argument menu는 Slack에서 ephemeral Block Kit button으로 전달됩니다.
  - Slack native 예외: `/status`는 Slack 예약어이므로 `/agentstatus`를 등록해야 합니다. text `/status`는 그대로 동작합니다.
