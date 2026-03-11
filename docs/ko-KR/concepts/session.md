---
summary: "채팅을 위한 session 관리 규칙, 키, 영속성"
read_when:
  - session 처리나 저장소를 수정할 때
title: "Session Management"
---

# Session Management

OpenClaw는 **에이전트당 하나의 direct-chat session**을 기본으로 취급합니다. direct chat은 `agent:<agentId>:<mainKey>`(`mainKey` 기본값은 `main`)로 합쳐지고, group/channel chat은 각각 별도의 key를 가집니다. `session.mainKey`가 적용됩니다.

**direct message**를 어떻게 묶을지는 `session.dmScope`로 제어합니다.

- `main` (기본값): 모든 DM이 연속성을 위해 main session을 공유합니다.
- `per-peer`: 채널 전반에서 발신자 id별로 분리합니다.
- `per-channel-peer`: 채널 + 발신자별로 분리합니다(다중 사용자 inbox에 권장).
- `per-account-channel-peer`: 계정 + 채널 + 발신자별로 분리합니다(다중 계정 inbox에 권장).
  `per-peer`, `per-channel-peer`, `per-account-channel-peer`를 사용할 때는 `session.identityLinks`를 사용해 provider 접두사가 붙은 peer id를 canonical identity로 매핑할 수 있으므로, 동일 인물이 여러 채널에서 연락해도 같은 DM session을 공유할 수 있습니다.

## Secure DM mode (다중 사용자 구성에 권장)

> **Security Warning:** 에이전트가 **여러 사람**의 DM을 받을 수 있다면 secure DM mode를 강하게 권장합니다. 이 설정이 없으면 모든 사용자가 동일한 대화 context를 공유하게 되어, 사용자 간에 개인 정보가 노출될 수 있습니다.

**기본 설정에서 발생할 수 있는 문제 예시:**

- Alice (`<SENDER_A>`)가 비공개 주제(예: 진료 예약)에 대해 에이전트에게 메시지를 보냅니다.
- Bob (`<SENDER_B>`)이 에이전트에게 "우리가 무슨 이야기를 하고 있었지?"라고 묻습니다.
- 두 DM이 같은 session을 공유하기 때문에, 모델이 Alice의 이전 context를 사용해 Bob에게 답할 수 있습니다.

**해결 방법:** 사용자별로 session이 분리되도록 `dmScope`를 설정합니다.

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    // Secure DM mode: channel + sender별로 DM context를 분리합니다.
    dmScope: "per-channel-peer",
  },
}
```

**다음과 같은 경우 활성화하세요:**

- 둘 이상의 발신자에 대해 pairing approval을 사용 중인 경우
- 여러 항목이 있는 DM allowlist를 사용하는 경우
- `dmPolicy: "open"`을 설정한 경우
- 여러 전화번호 또는 계정이 에이전트에 메시지를 보낼 수 있는 경우

참고:

- 기본값은 연속성을 위한 `dmScope: "main"`입니다(모든 DM이 main session을 공유). 단일 사용자 구성에서는 문제가 없습니다.
- 로컬 CLI onboarding은 값이 설정되지 않은 경우 기본적으로 `session.dmScope: "per-channel-peer"`를 기록합니다(이미 명시된 값은 유지됨).
- 같은 채널에서 다중 계정 inbox를 운용한다면 `per-account-channel-peer`를 권장합니다.
- 동일 인물이 여러 채널로 연락한다면 `session.identityLinks`를 사용해 해당 DM session들을 하나의 canonical identity로 합칠 수 있습니다.
- DM 설정은 `openclaw security audit`로 확인할 수 있습니다([security](/cli/security) 참고).

## Gateway is the source of truth

모든 session 상태의 **소유권은 gateway**(“master” OpenClaw)에 있습니다. UI client(macOS app, WebChat 등)는 로컬 파일을 직접 읽지 말고 gateway에 질의해 session 목록과 token 수를 가져와야 합니다.

- **remote mode**에서는 관심 있는 session store가 Mac이 아니라 remote gateway host에 있습니다.
- UI에 표시되는 token 수는 gateway store field(`inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`)에서 가져옵니다. client는 총합을 “보정”하려고 JSONL transcript를 직접 파싱하지 않습니다.

## Where state lives

- **gateway host**에서:
  - Store file: `~/.openclaw/agents/<agentId>/sessions/sessions.json` (에이전트별).
- Transcript: `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl` (Telegram topic session은 `.../<SessionId>-topic-<threadId>.jsonl` 사용).
- Store는 `sessionKey -> { sessionId, updatedAt, ... }` 형태의 map입니다. 항목을 삭제해도 안전하며, 필요 시 다시 생성됩니다.
- Group entry에는 UI에서 session을 표시하기 위한 `displayName`, `channel`, `subject`, `room`, `space`가 포함될 수 있습니다.
- Session entry에는 `origin` 메타데이터(label + routing hint)가 포함되어, UI가 session의 출처를 설명할 수 있습니다.
- OpenClaw는 레거시 Pi/Tau session folder를 읽지 않습니다.

## Maintenance

OpenClaw는 시간이 지나도 `sessions.json`과 transcript artifact의 크기가 제한되도록 session-store maintenance를 적용합니다.

### Defaults

- `session.maintenance.mode`: `warn`
- `session.maintenance.pruneAfter`: `30d`
- `session.maintenance.maxEntries`: `500`
- `session.maintenance.rotateBytes`: `10mb`
- `session.maintenance.resetArchiveRetention`: 기본값은 `pruneAfter` (`30d`)
- `session.maintenance.maxDiskBytes`: 미설정(비활성화)
- `session.maintenance.highWaterBytes`: disk budget이 활성화되면 기본값은 `maxDiskBytes`의 `80%`

### How it works

Maintenance는 session store에 쓰기 작업이 발생할 때 실행되며, `openclaw sessions cleanup`으로 수동 실행할 수도 있습니다.

- `mode: "warn"`: 어떤 항목이 제거될지를 보고만 하고, entry/transcript는 변경하지 않습니다.
- `mode: "enforce"`: 다음 순서로 정리를 적용합니다.
  1. `pruneAfter`보다 오래된 stale entry를 제거합니다.
  2. entry 수를 `maxEntries`로 제한합니다(가장 오래된 항목부터).
  3. 제거된 entry가 더 이상 참조하지 않는 transcript file을 archive합니다.
  4. 보존 정책에 따라 오래된 `*.deleted.<timestamp>` 및 `*.reset.<timestamp>` archive를 삭제합니다.
  5. `sessions.json`이 `rotateBytes`를 초과하면 rotate합니다.
  6. `maxDiskBytes`가 설정되어 있으면 `highWaterBytes`를 목표로 disk budget을 강제합니다(오래된 artifact부터, 그다음 오래된 session 순서).

### 대형 store에서의 성능 주의사항

트래픽이 많은 환경에서는 큰 session store가 흔합니다. Maintenance는 write path에서 수행되므로, store가 매우 크면 쓰기 지연이 커질 수 있습니다.

비용을 가장 크게 늘리는 요인:

- 지나치게 큰 `session.maintenance.maxEntries` 값
- stale entry를 오래 유지하게 만드는 긴 `pruneAfter` 기간
- `~/.openclaw/agents/<agentId>/sessions/` 아래에 많은 transcript/archive artifact가 쌓인 경우
- 적절한 prune/cap 제한 없이 disk budget(`maxDiskBytes`)을 활성화한 경우

권장 사항:

- 운영 환경에서는 자동으로 증가를 제한할 수 있도록 `mode: "enforce"`를 사용하세요.
- 시간 제한과 개수 제한(`pruneAfter` + `maxEntries`)을 둘 다 설정하세요. 하나만 두지 마세요.
- 대규모 배포에서는 명확한 상한을 위해 `maxDiskBytes` + `highWaterBytes`를 함께 설정하세요.
- `highWaterBytes`는 `maxDiskBytes`보다 의미 있게 낮게 유지하세요(기본값 80%).
- 설정을 바꾼 뒤에는 `openclaw sessions cleanup --dry-run --json`을 실행해 강제 적용 전에 예상 영향을 검증하세요.
- 활발한 session이 자주 존재한다면 수동 cleanup 실행 시 `--active-key`를 전달하세요.

### Customize examples

보수적인 enforce 정책 사용:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "45d",
      maxEntries: 800,
      rotateBytes: "20mb",
      resetArchiveRetention: "14d",
    },
  },
}
```

sessions directory에 hard disk budget 적용:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      maxDiskBytes: "1gb",
      highWaterBytes: "800mb",
    },
  },
}
```

더 큰 설치 환경용 튜닝 예시:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "14d",
      maxEntries: 2000,
      rotateBytes: "25mb",
      maxDiskBytes: "2gb",
      highWaterBytes: "1.6gb",
    },
  },
}
```

CLI에서 maintenance를 미리 보거나 강제 실행:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

## Session pruning

OpenClaw는 기본적으로 LLM 호출 직전에 메모리 내 context에서 **오래된 tool result**를 잘라냅니다.
이 작업은 JSONL history를 다시 쓰지 않습니다. [/concepts/session-pruning](/concepts/session-pruning)을 참고하세요.

## Pre-compaction memory flush

session이 auto-compaction에 가까워지면 OpenClaw는 **조용한 memory flush**
turn을 실행해 모델이 지속적으로 보존해야 할 note를 디스크에 쓰도록 상기시킬 수 있습니다. 이 동작은
workspace에 쓰기 권한이 있을 때만 수행됩니다. [Memory](/concepts/memory)와
[Compaction](/concepts/compaction)을 참고하세요.

## Mapping transports → session keys

- direct chat은 `session.dmScope`를 따릅니다(기본값 `main`).
  - `main`: `agent:<agentId>:<mainKey>` (기기/채널 간 연속성 유지).
    - 여러 전화번호와 채널이 같은 agent main key로 매핑될 수 있으며, 하나의 대화로 들어오는 transport 역할을 합니다.
  - `per-peer`: `agent:<agentId>:dm:<peerId>`.
  - `per-channel-peer`: `agent:<agentId>:<channel>:dm:<peerId>`.
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:dm:<peerId>` (`accountId` 기본값은 `default`).
  - `session.identityLinks`가 provider 접두사가 붙은 peer id(예: `telegram:123`)와 매칭되면 canonical key가 `<peerId>`를 대체하므로, 동일 인물이 여러 채널에서 하나의 session을 공유할 수 있습니다.
- Group chat은 상태를 분리합니다: `agent:<agentId>:<channel>:group:<id>` (room/channel은 `agent:<agentId>:<channel>:channel:<id>` 사용).
  - Telegram forum topic은 분리를 위해 group id 뒤에 `:topic:<threadId>`를 추가합니다.
  - 레거시 `group:<id>` key도 마이그레이션을 위해 계속 인식됩니다.
- Inbound context는 여전히 `group:<id>`를 사용할 수 있습니다. 이 경우 channel은 `Provider`에서 추론되어 canonical한 `agent:<agentId>:<channel>:group:<id>` 형식으로 정규화됩니다.
- 기타 source:
  - Cron job: `cron:<job.id>`
  - Webhook: `hook:<uuid>` (hook에서 명시적으로 설정하지 않은 경우)
  - Node run: `node-<nodeId>`

## Lifecycle

- Reset policy: session은 만료될 때까지 재사용되며, 만료 여부는 다음 inbound message 시점에 평가됩니다.
- Daily reset: 기본값은 **gateway host 현지 시간 기준 오전 4:00**입니다. 마지막 업데이트 시각이 가장 최근의 daily reset 시각보다 이전이면 해당 session은 stale로 간주됩니다.
- Idle reset (선택 사항): `idleMinutes`는 슬라이딩 idle window를 추가합니다. daily reset과 idle reset이 모두 설정되면 **먼저 만료되는 쪽**이 새 session을 강제합니다.
- Legacy idle-only: `session.reset`/`resetByType` 설정 없이 `session.idleMinutes`만 지정하면, 하위 호환성을 위해 OpenClaw는 idle-only mode를 유지합니다.
- Per-type override (선택 사항): `resetByType`을 사용하면 `direct`, `group`, `thread` session의 정책을 각각 재정의할 수 있습니다(`thread`는 Slack/Discord thread, Telegram topic, connector가 제공하는 Matrix thread를 뜻함).
- Per-channel override (선택 사항): `resetByChannel`은 특정 채널의 reset policy를 재정의합니다(해당 채널의 모든 session type에 적용되며 `reset`/`resetByType`보다 우선함).
- Reset trigger: 정확히 `/new` 또는 `/reset`(및 `resetTriggers`에 추가한 항목)을 보내면 새 session id가 시작되고, 메시지의 나머지 부분은 그대로 전달됩니다. `/new <model>`은 model alias, `provider/model`, provider name(fuzzy match)을 받아 새 session model을 설정합니다. `/new` 또는 `/reset`만 단독으로 보내면 OpenClaw는 reset을 확인하기 위해 짧은 “hello” greeting turn을 실행합니다.
- Manual reset: store에서 특정 key를 삭제하거나 JSONL transcript를 제거하면 됩니다. 다음 메시지에서 다시 생성됩니다.
- Isolated cron job은 매 실행마다 항상 새로운 `sessionId`를 발급받습니다(idle 재사용 없음).

## Send policy (optional)

개별 id를 나열하지 않고도 특정 session type의 전송을 차단할 수 있습니다.

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // `agent:<id>:` prefix를 포함한 raw session key와 매칭합니다.
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

런타임 override(owner 전용):

- `/send on` → 이 session에 대해 허용
- `/send off` → 이 session에 대해 차단
- `/send inherit` → override를 지우고 config rule 사용
  이 명령들은 반드시 단독 메시지로 보내야 등록됩니다.

## Configuration (optional rename example)

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender", // group key를 서로 분리해서 유지
    dmScope: "main", // DM 연속성(shared inbox면 per-channel-peer/per-account-channel-peer로 설정)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // Defaults: mode=daily, atHour=4 (gateway host local time).
      // idleMinutes도 설정하면 먼저 만료되는 쪽이 우선합니다.
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  },
}
```

## Inspecting

- `openclaw status` — store path와 최근 session을 표시합니다.
- `openclaw sessions --json` — 모든 entry를 출력합니다(`--active <minutes>`로 필터링 가능).
- `openclaw gateway call sessions.list --params '{}'` — 실행 중인 gateway에서 session을 가져옵니다(remote gateway는 `--url`/`--token` 사용).
- 채팅에서 `/status`를 단독 메시지로 보내면, agent가 reachable한지, session context를 얼마나 사용 중인지, 현재 thinking/verbose toggle 상태, WhatsApp web credential이 마지막으로 언제 refresh되었는지를 확인할 수 있습니다(relink 필요 여부를 파악하는 데 도움이 됨).
- `/context list` 또는 `/context detail`을 단독으로 보내면 system prompt와 주입된 workspace file, 그리고 가장 큰 context 기여 항목을 확인할 수 있습니다.
- `/stop`(또는 `stop`, `stop action`, `stop run`, `stop openclaw` 같은 단독 abort phrase)을 보내면 현재 run을 중단하고, 해당 session의 queued follow-up을 비우며, 그 session에서 생성된 sub-agent run도 모두 중단합니다(응답에는 중단된 개수가 포함됨).
- `/compact`(선택적으로 지시 사항 포함)을 단독 메시지로 보내면 오래된 context를 요약해 window space를 확보할 수 있습니다. [/concepts/compaction](/concepts/compaction)을 참고하세요.
- 전체 turn을 검토하려면 JSONL transcript를 직접 열어볼 수 있습니다.

## Tips

- primary key는 1:1 트래픽 전용으로 유지하고, group은 각자의 key를 쓰게 두세요.
- cleanup을 자동화할 때는 다른 context를 보존하기 위해 store 전체가 아니라 개별 key를 삭제하세요.

## Session origin metadata

각 session entry는 최선의 노력 기준으로 `origin`에 출처 정보를 기록합니다.

- `label`: 사람이 읽기 좋은 label(conversation label + group subject/channel에서 해석)
- `provider`: 정규화된 channel id(extension 포함)
- `from`/`to`: inbound envelope의 원시 routing id
- `accountId`: provider account id(다중 계정인 경우)
- `threadId`: 채널이 지원하면 thread/topic id
  origin field는 direct message, channel, group에 대해 채워집니다. connector가
  delivery routing만 업데이트하더라도(예: DM main session을 최신 상태로 유지하기 위해)
  session이 설명용 metadata를 유지할 수 있도록 inbound context는 계속 제공해야 합니다.
  extension은 inbound context에 `ConversationLabel`, `GroupSubject`, `GroupChannel`,
  `GroupSpace`, `SenderName`을 넣고 `recordSessionMetaFromInbound`를 호출하거나(또는 동일한
  context를 `updateLastRoute`에 전달하는 방식으로) 이를 처리할 수 있습니다.
