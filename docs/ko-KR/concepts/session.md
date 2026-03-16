---
summary: "Session management rules, keys, and persistence for chats"
description: "direct message grouping, session key mapping, persistence, maintenance, reset policy를 포함한 OpenClaw session 관리 규칙을 설명합니다."
read_when:
  - session handling이나 storage를 수정해야 할 때
title: "Session Management"
x-i18n:
  source_path: "concepts/session.md"
---

# Session Management

OpenClaw는 **agent당 하나의 direct-chat session**을 primary로 취급합니다.
direct chat은 `agent:<agentId>:<mainKey>`로 collapse되며
(기본 `main`), group/channel chat은 각자 별도 key를 가집니다.
`session.mainKey`도 그대로 존중됩니다.

**direct message**가 어떻게 묶일지는 `session.dmScope`로 제어합니다.

- `main`
  (기본값):
  모든 DM이 continuity를 위해 main session을 공유
- `per-peer`:
  channel 전반에서 sender id별로 분리
- `per-channel-peer`:
  channel + sender별로 분리
  (multi-user inbox에 권장)
- `per-account-channel-peer`:
  account + channel + sender별로 분리
  (multi-account inbox에 권장)

`per-peer`, `per-channel-peer`, `per-account-channel-peer`를 쓸 때는
`session.identityLinks`를 사용해 provider-prefixed peer id를 canonical identity로
매핑할 수 있습니다. 그러면 같은 사람이 여러 channel로 연락해도 하나의 DM session을
공유하게 할 수 있습니다.

## Secure DM mode (recommended for multi-user setups)

> **Security Warning:** agent가 **여러 사람**의 DM을 받을 수 있다면, secure DM mode를
> 강하게 권장합니다. 그렇지 않으면 모든 사용자가 같은 conversation context를 공유해
> private information이 다른 사용자에게 노출될 수 있습니다.

**기본 설정에서 생길 수 있는 문제 예시:**

- Alice (`<SENDER_A>`)가 medical appointment 같은 private topic을 agent와 이야기함
- Bob (`<SENDER_B>`)이 agent에게 "What were we talking about?"라고 질문함
- 두 DM이 같은 session을 공유하므로, model이 Alice의 prior context를 써서 Bob에게
  답할 수 있음

**해결 방법:** `dmScope`를 사용자별로 분리되는 값으로 설정합니다.

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    // Secure DM mode: isolate DM context per channel + sender.
    dmScope: "per-channel-peer",
  },
}
```

**다음 상황이라면 이 기능을 켜는 편이 좋습니다:**

- pairing approval을 받은 sender가 둘 이상일 때
- 여러 entry가 있는 DM allowlist를 쓸 때
- `dmPolicy: "open"`을 쓸 때
- 여러 phone number나 account가 agent에 message를 보낼 수 있을 때

참고:

- 기본값 `dmScope: "main"`은 continuity를 위한 값이며, single-user setup에는 적절합니다
- local CLI onboarding은 값이 unset일 때 기본적으로
  `session.dmScope: "per-channel-peer"`를 기록합니다
  (기존 explicit 값은 유지)
- 같은 channel에서 여러 account를 쓰는 inbox라면
  `per-account-channel-peer`가 더 적합합니다
- 같은 사람이 여러 channel로 연락한다면 `session.identityLinks`로 하나의 canonical
  identity에 collapse할 수 있습니다
- DM 설정은 `openclaw security audit`로 검증할 수 있습니다
  ([security](/cli/security))

## Gateway is the source of truth

모든 session state는 **gateway**(master OpenClaw)가 소유합니다.
macOS app, WebChat 같은 UI client는 local file을 직접 읽지 말고 gateway에 질의해
session list와 token count를 받아와야 합니다.

- **remote mode**에서는 실제 session store가 Mac이 아니라 remote gateway host에
  있습니다
- UI에 보이는 token count는 gateway store field
  (`inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`)에서 옵니다.
  client는 JSONL transcript를 직접 파싱해서 total을 "보정"하지 않습니다

## Where state lives

- **gateway host**:
  - store file:
    `~/.openclaw/agents/<agentId>/sessions/sessions.json`
    (agent별)
- transcript:
  `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`
  (Telegram topic session은 `.../<SessionId>-topic-<threadId>.jsonl`)
- store는 `sessionKey -> { sessionId, updatedAt, ... }` map입니다.
  entry를 삭제해도 필요 시 on demand로 다시 만들어지므로 안전합니다
- group entry에는 UI용 label을 위해 `displayName`, `channel`, `subject`, `room`,
  `space`가 들어갈 수 있습니다
- session entry에는 어디서 온 session인지 설명하는 `origin` metadata
  (label + routing hint)가 포함됩니다
- OpenClaw는 legacy Pi/Tau session folder를 읽지 않습니다

## Maintenance

OpenClaw는 시간이 지나도 `sessions.json`과 transcript artifact가 무한정 커지지 않도록
session-store maintenance를 수행합니다.

### Defaults

- `session.maintenance.mode`: `warn`
- `session.maintenance.pruneAfter`: `30d`
- `session.maintenance.maxEntries`: `500`
- `session.maintenance.rotateBytes`: `10mb`
- `session.maintenance.resetArchiveRetention`:
  기본값은 `pruneAfter`
  (`30d`)
- `session.maintenance.maxDiskBytes`: unset
  (disabled)
- `session.maintenance.highWaterBytes`:
  disk budget을 켠 경우 기본값은 `maxDiskBytes`의 `80%`

### How it works

maintenance는 session-store write 시 실행되며,
`openclaw sessions cleanup`으로 수동 실행도 가능합니다.

- `mode: "warn"`:
  무엇이 제거될지 보고만 하고 실제 mutation은 하지 않음
- `mode: "enforce"`:
  다음 순서로 cleanup 적용
  1. `pruneAfter`보다 오래된 stale entry 제거
  2. entry count를 `maxEntries`로 cap
     (가장 오래된 것부터)
  3. 제거된 entry가 더 이상 참조하지 않는 transcript file archive
  4. retention policy에 따라 오래된 `*.deleted.<timestamp>`,
     `*.reset.<timestamp>` archive 제거
  5. `sessions.json`이 `rotateBytes`를 넘으면 rotate
  6. `maxDiskBytes`가 설정돼 있으면 `highWaterBytes`까지 disk budget 강제
     (오래된 artifact 우선, 그다음 오래된 session)

### Performance caveat for large stores

고부하 환경에서는 큰 session store가 흔합니다. maintenance는 write path에서 수행되므로,
store가 아주 크면 write latency가 늘어날 수 있습니다.

특히 비용이 커지는 요인:

- 너무 높은 `session.maintenance.maxEntries`
- stale entry를 오래 남기는 긴 `pruneAfter`
- `~/.openclaw/agents/<agentId>/sessions/` 안의 많은 transcript/archive artifact
- 적절한 prune/cap 없이 `maxDiskBytes`만 켜는 경우

권장 사항:

- production에서는 `mode: "enforce"`를 사용해 growth를 자동으로 bounded 상태로 유지
- 시간 제한과 개수 제한을 함께 설정
  (`pruneAfter` + `maxEntries`)
- 큰 배포에서는 `maxDiskBytes` + `highWaterBytes`로 hard upper bound 설정
- `highWaterBytes`는 `maxDiskBytes`보다 충분히 낮게 유지
  (기본 80%)
- config 변경 후 `openclaw sessions cleanup --dry-run --json`으로 예상 영향 확인
- active session이 많다면 manual cleanup 시 `--active-key`를 전달

### Customize examples

보수적인 enforce policy:

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

session directory에 hard disk budget 적용:

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

큰 설치를 위한 예시:

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

CLI에서 preview 또는 강제 실행:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

## Session pruning

OpenClaw는 기본적으로 LLM call 직전에 in-memory context에서 **오래된 tool result**를
trim합니다. JSONL history를 다시 쓰지는 않습니다.
자세한 내용은 [/concepts/session-pruning](/concepts/session-pruning)을 보세요.

## Pre-compaction memory flush

session이 auto-compaction에 가까워지면, OpenClaw는 model에게 durable note를 disk에
쓰라고 상기시키는 **silent memory flush** turn을 실행할 수 있습니다.
이 동작은 workspace에 쓰기 권한이 있을 때만 실행됩니다.
[Memory](/concepts/memory)와 [Compaction](/concepts/compaction)을 참고하세요.

## Mapping transports → session keys

- direct chat은 `session.dmScope`
  (기본값 `main`)를 따릅니다
  - `main`:
    `agent:<agentId>:<mainKey>`
    (device/channel을 넘어 continuity 유지)
    - 여러 phone number와 channel이 같은 agent main key에 매핑될 수 있으며,
      하나의 conversation으로 작동합니다
  - `per-peer`:
    `agent:<agentId>:dm:<peerId>`
  - `per-channel-peer`:
    `agent:<agentId>:<channel>:dm:<peerId>`
  - `per-account-channel-peer`:
    `agent:<agentId>:<channel>:<accountId>:dm:<peerId>`
    (`accountId` 기본값은 `default`)
  - `session.identityLinks`가 provider-prefixed peer id
    (예: `telegram:123`)와 일치하면 `<peerId>` 대신 canonical key를 사용해 같은 사람이
    channel을 넘어 session을 공유하게 합니다
- group chat은 state를 분리합니다:
  `agent:<agentId>:<channel>:group:<id>`
  (room/channel은 `agent:<agentId>:<channel>:channel:<id>`)
  - Telegram forum topic은 group id 뒤에 `:topic:<threadId>`를 붙여 분리합니다
  - legacy `group:<id>` key도 migration용으로 인식됩니다
- inbound context는 여전히 `group:<id>`를 쓸 수 있지만, channel은 `Provider`에서
  추론되어 canonical
  `agent:<agentId>:<channel>:group:<id>` 형태로 normalize됩니다
- 그 외 source:
  - Cron job:
    `cron:<job.id>`
  - Webhook:
    `hook:<uuid>`
    (hook이 명시적으로 설정하지 않은 경우)
  - Node run:
    `node-<nodeId>`

## Lifecycle

- reset policy:
  session은 만료될 때까지 재사용되며, 만료 여부는 다음 inbound message에서 평가됨
- daily reset:
  기본값은 **gateway host local time 기준 오전 4시**.
  마지막 update가 가장 최근 daily reset 시각보다 이전이면 stale로 간주
- idle reset
  (optional):
  `idleMinutes`는 sliding idle window를 추가합니다.
  daily와 idle이 함께 있으면 **더 먼저 만료되는 쪽**이 새 session을 강제
- legacy idle-only:
  `session.idleMinutes`만 있고 `session.reset`/`resetByType`이 없으면 backward
  compatibility를 위해 idle-only mode 유지
- type별 override
  (optional):
  `resetByType`으로 `direct`, `group`, `thread` policy override 가능
  (thread = Slack/Discord thread, Telegram topic, connector가 제공하는 Matrix thread)
- channel별 override
  (optional):
  `resetByChannel`은 channel의 reset policy를 override하며,
  `reset`/`resetByType`보다 우선
- reset trigger:
  정확히 `/new` 또는 `/reset`
  (및 `resetTriggers`의 추가 trigger)는 새 session id를 시작하고 message의 나머지를
  계속 전달합니다.
  `/new <model>`은 model alias, `provider/model`, provider name의 fuzzy match를
  받아 새 session model을 설정할 수 있습니다.
  `/new`나 `/reset`만 단독으로 보내면, OpenClaw는 짧은 "hello" greeting turn으로 reset을
  확인해 줍니다
- manual reset:
  store에서 특정 key를 지우거나 JSONL transcript를 제거하면, 다음 message가 다시
  만들어 냅니다
- isolated cron job은 매 run마다 항상 새 `sessionId`를 만듭니다
  (idle reuse 없음)

## Send policy (optional)

특정 session type에 대한 delivery를 개별 id 나열 없이 차단할 수 있습니다.

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // Match the raw session key (including the `agent:<id>:` prefix).
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

runtime override
(owner only):

- `/send on` → 이 session에서 allow
- `/send off` → 이 session에서 deny
- `/send inherit` → override를 지우고 config rule 사용

이 command는 standalone message로 보내야 적용됩니다.

## Configuration (optional rename example)

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender", // keep group keys separate
    dmScope: "main", // DM continuity (set per-channel-peer/per-account-channel-peer for shared inboxes)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // Defaults: mode=daily, atHour=4 (gateway host local time).
      // If you also set idleMinutes, whichever expires first wins.
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

- `openclaw status`
  — store path와 recent session 표시
- `openclaw sessions --json`
  — 모든 entry dump
  (`--active <minutes>`로 filter 가능)
- `openclaw gateway call sessions.list --params '{}'`
  — 실행 중인 gateway에서 session fetch
  (remote gateway면 `--url` / `--token` 사용)
- chat에서 `/status`를 standalone message로 보내면,
  agent reachability, session context 사용량, thinking/verbose toggle,
  WhatsApp web credential의 last refresh 시각 등을 볼 수 있습니다
- `/context list` 또는 `/context detail`은 system prompt와 injected workspace file,
  그리고 큰 context contributor를 보여줍니다
- `/stop`
  (또는 `stop`, `stop action`, `stop run`, `stop openclaw`)은 현재 run을 abort하고,
  queued followup과 그 session에서 spawned된 sub-agent run도 멈춥니다
- `/compact`
  (optional instruction 포함 가능)는 오래된 context를 summarize해 window 공간을
  확보합니다. [/concepts/compaction](/concepts/compaction)을 참고하세요
- JSONL transcript는 직접 열어 full turn을 검토할 수 있습니다

## Tips

- primary key는 1:1 traffic에만 쓰고, group은 각자의 key를 유지하게 두세요
- cleanup 자동화 시에는 전체 store를 지우지 말고 개별 key만 삭제해 다른 context를
  보존하세요

## Session origin metadata

각 session entry는 `origin`에 best-effort source metadata를 기록합니다.

- `label`:
  human label
  (conversation label + group subject/channel에서 resolve)
- `provider`:
  normalized channel id
  (extension 포함)
- `from` / `to`:
  inbound envelope의 raw routing id
- `accountId`:
  multi-account일 때 provider account id
- `threadId`:
  channel이 지원할 때 thread/topic id

origin field는 direct message, channel, group에 대해 채워집니다.
connector가 delivery routing만 갱신하는 경우라도
(예: DM main session을 신선하게 유지하기 위해), session이 설명용 metadata를 유지할 수
있도록 inbound context를 제공해야 합니다.
extension은 inbound context에 `ConversationLabel`, `GroupSubject`, `GroupChannel`,
`GroupSpace`, `SenderName`을 넣고 `recordSessionMetaFromInbound`를 호출하거나,
같은 context를 `updateLastRoute`에 전달해 이를 달성할 수 있습니다.
