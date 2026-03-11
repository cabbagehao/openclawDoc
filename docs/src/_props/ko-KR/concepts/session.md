---
summary: "채팅을 위한 session 관리 규칙, 키, 영속성"
read_when:
  - session 처리나 저장소를 수정할 때
title: "Session Management"
---

# 세션 관리 (Session Management)

OpenClaw는 **에이전트당 하나의 개별 채팅(Direct-chat) 세션**을 기본으로 처리합니다. 개별 채팅은 설정된 메인 키(기본값: `main`)를 사용하여 `agent:<agentId>:<mainKey>` 형식으로 통합되는 반면, 그룹이나 채널 채팅은 각각 고유한 키를 가집니다.

메시지가 어떻게 그룹화될지는 `session.dmScope` 설정을 통해 제어할 수 있습니다.

* `main` (기본값): 대화의 연속성을 위해 모든 DM이 메인 세션을 공유합니다.
* `per-peer`: 모든 채널에 걸쳐 발신자 ID별로 세션을 분리합니다.
* `per-channel-peer`: 채널과 발신자 조합별로 세션을 분리합니다 (다중 사용자 환경에 권장).
* `per-account-channel-peer`: 계정, 채널, 발신자 조합별로 세션을 분리합니다 (다중 계정 환경에 권장).
  `per-peer`, `per-channel-peer`, `per-account-channel-peer` 모드를 사용할 때 `session.identityLinks`를 설정하면, 여러 채널에서 들어오는 동일 인물의 ID를 하나의 공통 ID로 매핑하여 세션을 공유하게 할 수 있습니다.

## 보안 DM 모드 (다중 사용자 환경 권장)

> **보안 주의사항:** 에이전트가 **여러 명**으로부터 DM을 받을 수 있는 환경이라면 보안 DM 모드 사용을 강력히 권장합니다. 이 모드를 사용하지 않으면 모든 사용자가 동일한 대화 문맥(Context)을 공유하게 되어, 사용자 간에 개인 정보가 유출될 위험이 있습니다.

**기본 설정 시 발생할 수 있는 문제 예시:**

1. Alice가 에이전트에게 개인적인 내용(예: 병원 예약 정보)을 메시지로 보냅니다.
2. 이후 Bob이 에이전트에게 "우리가 방금 무슨 이야기를 했지?"라고 묻습니다.
3. 두 사람의 DM이 동일한 세션을 공유하므로, 에이전트가 Alice의 대화 내용을 바탕으로 Bob에게 답변할 수 있습니다.

**해결 방법:** `dmScope`를 설정하여 사용자별로 세션을 격리합니다.

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    // 보안 DM 모드: 채널과 발신자별로 DM 문맥을 격리합니다.
    dmScope: "per-channel-peer",
  },
}
```

**이 기능을 활성화해야 하는 경우:**

* 페어링 승인을 받은 사용자가 두 명 이상인 경우
* 여러 명의 사용자가 포함된 DM 허용 목록(Allowlist)을 사용하는 경우
* `dmPolicy`를 `"open"`으로 설정한 경우
* 여러 개의 전화번호나 계정으로 에이전트와 메시지를 주고받는 경우

참고 사항:

* 기본값인 `dmScope: "main"`은 대화의 연속성을 보장하며, 단일 사용자 환경에서는 문제가 없습니다.
* 로컬 CLI 온보딩 과정에서 별도 설정이 없으면 기본적으로 `session.dmScope: "per-channel-peer"`가 적용됩니다 (기존에 명시적으로 설정된 값은 유지됨).
* 동일 채널 내에서 여러 계정을 관리하는 경우 `per-account-channel-peer` 사용을 권장합니다.
* 동일 인물이 여러 채널을 통해 연락하는 경우 `session.identityLinks`를 활용하여 하나의 공통 세션으로 통합할 수 있습니다.
* 현재의 DM 보안 설정 상태는 `openclaw security audit` 명령어로 확인할 수 있습니다 ([보안 관련 문서](/cli/security) 참조).

## 게이트웨이가 단일 진실 공급원(Source of Truth)입니다

모든 세션 상태 정보의 **소유권은 게이트웨이**(메인 OpenClaw 프로세스)에 있습니다. macOS 앱이나 웹 채팅 등 모든 UI 클라이언트는 로컬 파일을 직접 읽는 대신 게이트웨이에 요청하여 세션 목록과 토큰 사용량을 가져와야 합니다.

* **원격 모드**에서 실행 중인 경우, 실제 세션 저장소는 사용 중인 Mac이 아닌 원격 게이트웨이 호스트에 존재합니다.
* UI에 표시되는 토큰 사용량은 게이트웨이 저장소의 필드(`inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`) 값을 그대로 사용합니다. 클라이언트는 총합을 계산하기 위해 JSONL 로그 파일을 직접 파싱하지 않습니다.

## 데이터 저장 위치

* **게이트웨이 호스트** 내부:
  * 상태 저장 파일: `~/.openclaw/agents/<agentId>/sessions/sessions.json` (에이전트별로 관리).
* 대화 로그(Transcripts): `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl` (텔레그램 토픽 세션은 `.../<SessionId>-topic-<threadId>.jsonl` 형식 사용).
* 저장소는 `sessionKey -> { sessionId, updatedAt, ... }` 형태의 맵 구조입니다. 항목을 삭제하더라도 필요 시 자동으로 다시 생성되므로 안전합니다.
* 그룹 채팅 항목에는 UI 표시를 위한 `displayName`, `channel`, `subject`, `room`, `space` 정보가 포함될 수 있습니다.
* 세션 항목에는 해당 세션의 출처를 설명하는 `origin` 메타데이터(라벨 및 라우팅 힌트)가 포함됩니다.
* OpenClaw는 이전 버전(Pi/Tau)의 세션 폴더 형식을 지원하지 않습니다.

## 유지 관리 (Maintenance)

OpenClaw는 `sessions.json` 파일과 로그 데이터가 무한정 커지는 것을 방지하기 위해 세션 저장소 유지 관리 기능을 수행합니다.

### 기본 설정값 (Defaults)

* `session.maintenance.mode`: `warn` (경고 모드)
* `session.maintenance.pruneAfter`: `30d` (30일 경과 시 정리)
* `session.maintenance.maxEntries`: `500` (최대 500개 항목 유지)
* `session.maintenance.rotateBytes`: `10mb` (10MB 초과 시 파일 로테이션)
* `session.maintenance.resetArchiveRetention`: 기본값은 `pruneAfter`와 동일한 `30d`
* `session.maintenance.maxDiskBytes`: 미설정 (비활성화 상태)
* `session.maintenance.highWaterBytes`: 디스크 용량 제한 활성화 시 기본값은 `maxDiskBytes`의 `80%`

### 작동 방식

유지 관리는 세션 저장소에 쓰기 작업이 발생할 때 실행되며, `openclaw sessions cleanup` 명령어로 수동 실행도 가능합니다.

* `mode: "warn"`: 정리 대상 항목을 보고만 하며 실제 파일은 변경하지 않습니다.
* `mode: "enforce"`: 다음 순서에 따라 정리를 수행합니다.
  1. `pruneAfter` 기간보다 오래된 오래된 항목(Stale entries)을 제거합니다.
  2. 세션 수를 `maxEntries` 이내로 제한합니다 (오래된 순서대로 제거).
  3. 더 이상 참조되지 않는 대화 로그 파일을 아카이브합니다.
  4. 보관 정책에 따라 오래된 아카이브 파일(`*.deleted.*`, `*.reset.*`)을 삭제합니다.
  5. `sessions.json` 파일 크기가 설정값을 초과하면 로테이션을 수행합니다.
  6. `maxDiskBytes`가 설정된 경우, `highWaterBytes`를 목표로 전체 디스크 사용량을 조절합니다.

### 대규모 데이터 환경에서의 성능 주의사항

데이터량이 많은 경우 유지 관리 작업이 쓰기 성능에 영향을 줄 수 있습니다.

성능에 영향을 주는 주요 요인:

* 너무 큰 `session.maintenance.maxEntries` 설정값
* 오래된 데이터를 너무 길게 유지하는 `pruneAfter` 설정
* 세션 폴더 내에 너무 많은 로그/아카이브 파일이 쌓인 경우
* 적절한 정리 규칙 없이 디스크 용량 제한(`maxDiskBytes`)만 설정한 경우

권장 조치 사항:

* 운영 환경에서는 `mode: "enforce"`를 사용하여 자동으로 데이터량을 조절하세요.
* 기간 제한(`pruneAfter`)과 개수 제한(`maxEntries`)을 함께 설정하는 것이 좋습니다.
* 대규모 배포 시에는 `maxDiskBytes`와 `highWaterBytes`를 설정하여 물리적인 디스크 한도를 지정하세요.
* 설정 변경 후 `openclaw sessions cleanup --dry-run --json` 명령어로 예상 결과를 먼저 확인해 보세요.

### 설정 예시

보수적인 정리 정책 적용:

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

세션 디렉토리에 엄격한 디스크 용량 제한 적용:

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

CLI에서 유지 관리 미리 보기 또는 강제 실행:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

## 세션 프루닝 (Session Pruning)

OpenClaw는 기본적으로 LLM 호출 직전에 메모리 문맥에서 **오래된 도구 실행 결과**를 자동으로 제거합니다. 이 작업은 원본 로그 파일(JSONL)을 수정하지 않습니다. 자세한 내용은 [세션 프루닝](/concepts/session-pruning) 문서를 참조하세요.

## 압축 전 메모리 플러시 (Pre-compaction memory flush)

세션이 자동 압축(Auto-compaction) 단계에 가까워지면, OpenClaw는 모델에게 중요한 정보를 디스크에 기록하도록 안내하는 **메모리 플러시 턴**을 자동으로 실행할 수 있습니다. 이 기능은 워크스페이스에 쓰기 권한이 있을 때만 작동합니다. [메모리](/concepts/memory) 및 [압축(Compaction)](/concepts/compaction) 문서를 참조하세요.

## 전송 수단별 세션 키 매핑 (Mapping)

* 개별 채팅은 `session.dmScope` 설정(기본값: `main`)을 따릅니다.
  * `main`: `agent:<agentId>:<mainKey>` 형식을 사용하여 기기나 채널이 달라도 대화의 연속성을 유지합니다.
  * `per-peer`: `agent:<agentId>:dm:<peerId>`
  * `per-channel-peer`: `agent:<agentId>:<channel>:dm:<peerId>`
  * `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:dm:<peerId>`
  * `session.identityLinks` 설정을 통해 여러 채널의 ID를 하나의 공통 ID로 통합할 수 있습니다.
* 그룹 채팅은 대화 상태를 분리하여 관리합니다: `agent:<agentId>:<channel>:group:<id>`
  * 텔레그램 포럼 토픽의 경우 그룹 ID 뒤에 `:topic:<threadId>`를 추가하여 구분합니다.
* 기타 출처:
  * 크론 작업: `cron:<job.id>`
  * 웹훅: `hook:<uuid>`
  * 노드 실행: `node-<nodeId>`

## 수명 주기 (Lifecycle)

* 세션 재사용: 세션은 만료될 때까지 계속 사용되며, 만료 여부는 다음 메시지가 수신되는 시점에 평가됩니다.
* 일일 리셋: 기본적으로 **게이트웨이 호스트 현지 시간 기준 오전 4:00**에 수행됩니다. 마지막 업데이트 이후 이 시간이 지나면 세션이 만료된 것으로 간주됩니다.
* 유휴 시간 기반 리셋(선택 사항): `idleMinutes` 설정을 통해 일정 시간 동안 활동이 없을 경우 세션을 리셋할 수 있습니다. 일일 리셋과 함께 설정된 경우 **둘 중 먼저 도달하는 기준**에 따라 세션이 새로 시작됩니다.
* 리셋 트리거: `/new` 또는 `/reset` (및 `resetTriggers`에 정의된 명령어) 입력 시 즉시 새로운 세션 ID가 생성됩니다. `/new <모델명>` 형식을 통해 새 세션에서 사용할 모델을 지정할 수도 있습니다.
* 수동 리셋: 저장소에서 특정 키를 삭제하거나 대화 로그 파일을 제거하면 다음 메시지 수신 시 세션이 새로 생성됩니다.

## 전송 정책 (Send Policy)

특정 세션 유형에 대한 메시지 전송을 선택적으로 차단할 수 있습니다.

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // 프리픽스를 포함한 전체 세션 키와 매칭할 수도 있습니다.
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

런타임 시 명령어 제어 (관리자 전용):

* `/send on`: 현재 세션에서 전송 허용
* `/send off`: 현재 세션에서 전송 차단
* `/send inherit`: 개별 설정을 지우고 전송 정책 설정을 따름

## 세션 정보 확인 및 제어

* `openclaw status`: 세션 저장소 경로와 최근 세션 정보를 보여줍니다.
* `/status` (채팅창 입력): 에이전트 연결 상태, 컨텍스트 사용량, 현재 설정 모드 등을 확인합니다.
* `/context list` / `/context detail`: 시스템 프롬프트 내용과 현재 컨텍스트에 포함된 파일 정보를 보여줍니다.
* `/stop`: 현재 진행 중인 에이전트 동작 및 대기 중인 후속 작업을 즉시 중단합니다.
* `/compact`: 오래된 대화 내용을 요약하여 컨텍스트 공간을 확보합니다.
* 로그 확인: JSONL 파일을 직접 열어 전체 대화 턴을 상세히 검토할 수 있습니다.

## 세션 출처 메타데이터 (Origin)

각 세션 항목은 `origin` 필드에 다음과 같은 출처 정보를 기록합니다.

* `label`: 사람이 읽기 쉬운 세션 이름
* `provider`: 정규화된 채널 ID
* `from` / `to`: 메시지 봉투(Envelope)의 원시 라우팅 ID
* `accountId`: 제공업체 계정 ID
* `threadId`: 스레드 또는 토픽 ID (지원되는 경우)
  이 정보는 UI에서 세션이 어디서 시작되었는지 설명하는 데 사용됩니다.
