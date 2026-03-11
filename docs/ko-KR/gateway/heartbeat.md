---
summary: "Heartbeat polling 메시지와 알림 규칙"
read_when:
  - heartbeat 주기나 메시징을 조정할 때
  - 예약 작업에 heartbeat와 cron 중 무엇을 쓸지 결정할 때
title: "Heartbeat"
---

# Heartbeat (Gateway)

> **Heartbeat vs Cron?** 언제 무엇을 써야 하는지는 [Cron vs Heartbeat](/automation/cron-vs-heartbeat)를 참고하세요.

Heartbeat는 main session에서 **주기적인 agent turn**을 실행하여, 모델이 사용자의 주의를 끌 만한 사항만 띄우고 과도한 스팸은 막도록 합니다.

문제 해결: [/automation/troubleshooting](/automation/troubleshooting)

## Quick start (beginner)

1. heartbeat를 활성 상태로 둡니다(기본값은 `30m`, Anthropic OAuth/setup-token일 때는 `1h`) 또는 원하는 주기로 설정합니다.
2. agent workspace에 작은 `HEARTBEAT.md` 체크리스트를 만듭니다(선택 사항이지만 권장).
3. heartbeat 메시지를 어디로 보낼지 결정합니다(기본값은 `target: "none"`, 마지막 연락처로 보내려면 `target: "last"`).
4. 필요하면 투명성을 위해 heartbeat reasoning delivery를 켭니다.
5. heartbeat가 `HEARTBEAT.md`만 필요하다면 lightweight bootstrap context를 사용합니다.
6. 필요하면 heartbeat를 active hour(로컬 시간)로 제한합니다.

예시 설정:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적 전달(기본값은 "none")
        directPolicy: "allow", // 기본값: direct/DM 전달 허용; 억제하려면 "block"
        lightContext: true, // 선택: bootstrap 파일 중 HEARTBEAT.md만 주입
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 선택: 별도 `Reasoning:` 메시지도 전송
      },
    },
  },
}
```

## Defaults

- Interval: `30m` (Anthropic OAuth/setup-token이 감지된 auth mode이면 `1h`). `agents.defaults.heartbeat.every` 또는 agent별 `agents.list[].heartbeat.every`를 설정하세요. 비활성화하려면 `0m`을 사용합니다.
- Prompt body (`agents.defaults.heartbeat.prompt`로 설정 가능):
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- heartbeat prompt는 user message로 **그대로** 전송됩니다. system prompt에는 “Heartbeat” 섹션이 추가되고, 내부적으로 해당 실행이 표시됩니다.
- Active hours(`heartbeat.activeHours`)는 설정된 timezone 기준으로 검사됩니다.
  window 밖에서는, 다음으로 window 안에 들어오는 tick까지 heartbeat를 건너뜁니다.

## What the heartbeat prompt is for

기본 prompt는 의도적으로 넓은 범위를 다룹니다.

- **Background tasks:** “Consider outstanding tasks”는 inbox, calendar, reminder, queued work 같은 후속 작업을 검토해 긴급한 항목만 올리도록 agent를 유도합니다.
- **Human check-in:** “Checkup sometimes on your human during day time”은 가벼운 “도움이 필요하신가요?” 메시지를 가끔 보내도록 유도하지만, 사용자의 로컬 timezone을 사용해 야간 스팸은 피합니다. 자세한 내용은 [/concepts/timezone](/concepts/timezone)을 참고하세요.

heartbeat가 매우 구체적인 작업만 하길 원한다면(예: “Gmail PubSub 통계 확인”, “gateway health 확인”), `agents.defaults.heartbeat.prompt` 또는 `agents.list[].heartbeat.prompt`에 커스텀 본문을 지정하세요. 이 문자열은 그대로 전송됩니다.

## Response contract

- 주의를 요할 일이 없으면 **`HEARTBEAT_OK`**로 응답합니다.
- heartbeat 실행 중 OpenClaw는 응답의 **시작 또는 끝**에 `HEARTBEAT_OK`가 있으면 이를 ack로 처리합니다. 해당 토큰은 제거되며, 남은 내용이 **`ackMaxChars` 이하**(기본값: 300)면 응답 전체가 drop됩니다.
- `HEARTBEAT_OK`가 응답 **중간**에 있으면 특별 취급하지 않습니다.
- 경고를 보낼 때는 `HEARTBEAT_OK`를 넣지 말고 경고 텍스트만 반환하세요.

heartbeat 외 실행에서 메시지 시작/끝에 stray `HEARTBEAT_OK`가 있어도 제거되고 로그에 남습니다. 메시지가 오직 `HEARTBEAT_OK`뿐이면 drop됩니다.

## Config

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 기본값: 30m (0m이면 비활성)
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 기본값 false (있으면 별도 Reasoning: 메시지 전달)
        lightContext: false, // 기본값 false; true면 workspace bootstrap 파일 중 HEARTBEAT.md만 유지
        target: "last", // 기본값 none | 옵션: last | none | <channel id>
        to: "+15551234567", // 선택: channel별 대상 override
        accountId: "ops-bot", // 선택: multi-account channel id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 뒤에 허용되는 최대 문자 수
      },
    },
  },
}
```

### Scope and precedence

- `agents.defaults.heartbeat`는 전역 heartbeat 동작을 설정합니다.
- `agents.list[].heartbeat`는 그 위에 병합되며, 어떤 agent든 `heartbeat` block이 하나라도 있으면 **해당 agent들만** heartbeat를 실행합니다.
- `channels.defaults.heartbeat`는 모든 채널의 표시 기본값을 설정합니다.
- `channels.<channel>.heartbeat`는 채널 기본값을 override합니다.
- `channels.<channel>.accounts.<id>.heartbeat`는 multi-account 채널에서 account별로 override합니다.

### Per-agent heartbeats

`agents.list[]` 항목 중 하나라도 `heartbeat` block을 포함하면 **그 agent들만** heartbeat를 실행합니다. agent별 block은 `agents.defaults.heartbeat` 위에 병합되므로, 공통 기본값을 한 번만 두고 agent별로 override할 수 있습니다.

예시: agent 두 개 중 두 번째만 heartbeat 실행.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적 전달(기본값은 "none")
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
  },
}
```

### Active hours example

특정 timezone의 업무 시간에만 heartbeat를 제한합니다.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last", // 마지막 연락처로 명시적 전달(기본값은 "none")
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 선택; userTimezone이 있으면 그 값을, 없으면 host tz 사용
        },
      },
    },
  },
}
```

이 시간대 밖에서는(Eastern 기준 오전 9시 전 또는 오후 10시 후) heartbeat가 건너뛰어지며, 다음으로 시간 창 안에 들어오는 scheduled tick이 정상 실행됩니다.

### 24/7 setup

하루 종일 heartbeat를 실행하려면 다음 중 하나를 사용하세요.

- `activeHours`를 아예 생략(시간 제한 없음, 기본 동작)
- 하루 전체 window 지정: `activeHours: { start: "00:00", end: "24:00" }`

`start`와 `end`를 같은 값으로 두지 마세요(예: `08:00` ~ `08:00`). 이 경우 폭 0인 창으로 간주되어 heartbeat가 항상 건너뛰어집니다.

### Multi account example

Telegram 같은 multi-account 채널에서 특정 account를 타깃으로 하려면 `accountId`를 사용합니다.

```json5
{
  agents: {
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678:topic:42", // 선택: 특정 topic/thread로 라우팅
          accountId: "ops-bot",
        },
      },
    ],
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### Field notes

- `every`: heartbeat interval(duration string, 기본 단위 = 분)
- `model`: heartbeat 실행용 model override(`provider/model`)
- `includeReasoning`: 켜면 가능한 경우 별도의 `Reasoning:` 메시지도 전달(`/reasoning on`과 동일한 형태)
- `lightContext`: true면 heartbeat 실행 시 lightweight bootstrap context를 사용하고 workspace bootstrap 파일 중 `HEARTBEAT.md`만 유지
- `session`: heartbeat 실행용 session key(선택)
  - `main`(기본): agent main session
  - 명시적 session key(`openclaw sessions --json` 또는 [sessions CLI](/cli/sessions)에서 복사)
  - session key 형식: [Sessions](/concepts/session), [Groups](/channels/groups) 참고
- `target`:
  - `last`: 마지막으로 사용된 외부 채널로 전달
  - 명시적 채널: `whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`
  - `none`(기본값): heartbeat는 실행하지만 외부 전달은 하지 않음
- `directPolicy`: direct/DM 전달 동작 제어
  - `allow`(기본): direct/DM heartbeat 전달 허용
  - `block`: direct/DM 전달 억제(`reason=dm-blocked`)
- `to`: 선택적 수신자 override(channel별 id, 예: WhatsApp E.164 또는 Telegram chat id). Telegram topic/thread는 `<chatId>:topic:<messageThreadId>` 형식 사용
- `accountId`: multi-account 채널용 선택적 account id. `target: "last"`일 때 resolved last channel이 account를 지원하면 적용되고, 아니면 무시됩니다. resolved channel에 해당 account id가 없으면 전달을 건너뜁니다.
- `prompt`: 기본 prompt body override(병합되지 않음)
- `ackMaxChars`: `HEARTBEAT_OK` 뒤에 허용되는 최대 문자 수
- `suppressToolErrorWarnings`: true면 heartbeat 실행 중 tool error warning payload 억제
- `activeHours`: heartbeat 실행을 시간 창으로 제한. `start`(HH:MM, inclusive), `end`(HH:MM exclusive, `24:00` 허용), 선택적 `timezone`
  - 생략 또는 `"user"`: `agents.defaults.userTimezone`이 있으면 사용, 없으면 host system timezone
  - `"local"`: 항상 host system timezone 사용
  - 임의 IANA 식별자(예: `America/New_York`): 직접 사용. 잘못된 값이면 `"user"` 동작으로 fallback
  - `start`와 `end`는 같은 값이면 안 됩니다. 같으면 폭 0인 창으로 간주되어 항상 window 밖으로 처리됩니다.
  - active window 밖에서는, 다음으로 window 안에 들어오는 tick까지 heartbeat를 건너뜁니다.

## Delivery behavior

- heartbeat는 기본적으로 agent의 main session(`agent:<id>:<mainKey>`)에서 실행됩니다.
