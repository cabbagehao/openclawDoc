---
summary: "멀티 에이전트 라우팅: 격리된 에이전트 환경 구축, 채널 계정 관리 및 바인딩(Bindings) 설정 안내"
title: "멀티 에이전트 라우팅"
read_when: "하나의 Gateway 프로세스 내에서 워크스페이스와 인증 정보가 분리된 여러 에이전트를 운영하고자 할 때"
status: active
x-i18n:
  source_path: "concepts/multi-agent.md"
---

# 멀티 에이전트 라우팅 (Multi-Agent Routing)

OpenClaw는 하나의 실행 중인 Gateway 서버에서 각각 독립적인 워크스페이스, 데이터 디렉터리(`agentDir`), 세션 이력을 가진 여러 개의 **격리된 에이전트**를 구동할 수 있음. 또한, 여러 개의 채널 계정(예: 두 개의 WhatsApp 번호)을 동시에 연결하고 바인딩(Bindings) 설정을 통해 수신 메시지를 적절한 에이전트에게 전달함.

## "하나의 에이전트"의 정의

에이전트는 다음과 같은 독립적인 구성 요소를 가진 하나의 '두뇌' 단위임:

* **워크스페이스 (Workspace)**: 파일, 운영 지침(`AGENTS.md`, `SOUL.md`, `USER.md`), 로컬 메모 및 페르소나 규칙이 저장된 작업 디렉터리.
* **데이터 디렉터리 (`agentDir`)**: 인증 프로필, 모델 레지스트리, 에이전트별 세부 설정이 저장되는 공간.
* **세션 저장소 (Session Store)**: 대화 이력 및 라우팅 상태 정보가 저장되는 경로 (`~/.openclaw/agents/<agentId>/sessions`).

인증 프로필은 **에이전트별로 격리**되어 관리됨:
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`

메인 에이전트의 자격 증명은 다른 에이전트와 자동으로 공유되지 않음. 인증 정보나 세션 충돌을 방지하기 위해 에이전트 간에 동일한 `agentDir`를 재사용해서는 안 됨. 자격 증명을 공유해야 할 경우, 해당 파일을 다른 에이전트의 데이터 디렉터리로 직접 복사하여 사용함.

스킬(Skills)은 워크스페이스 내의 `skills/` 폴더를 통해 에이전트별로 관리되며, `~/.openclaw/skills` 경로의 공용 스킬도 함께 사용 가능함. 상세 내용은 [스킬 관리 가이드](/tools/skills#per-agent-vs-shared-skills) 참조.

**워크스페이스 보안 참고**: 워크스페이스는 기본적으로 도구가 실행되는 **현재 작업 디렉터리(CWD)** 역할을 수행함. 샌드박싱 기능을 활성화하지 않을 경우 절대 경로를 통해 시스템의 다른 위치에 접근할 수 있으므로, 격리가 필요한 환경에서는 [샌드박싱 가이드](/gateway/sandboxing)를 참조하여 설정함.

## 주요 경로 요약 (Path Map)

* **전체 설정**: `~/.openclaw/openclaw.json` (또는 `OPENCLAW_CONFIG_PATH`)
* **상태 디렉터리**: `~/.openclaw` (또는 `OPENCLAW_STATE_DIR`)
* **워크스페이스**: `~/.openclaw/workspace` (또는 `~/.openclaw/workspace-<agentId>`)
* **에이전트 데이터**: `~/.openclaw/agents/<agentId>/agent` (또는 `agents.list[].agentDir`)
* **세션 이력**: `~/.openclaw/agents/<agentId>/sessions`

### 싱글 에이전트 모드 (기본값)

추가 설정이 없을 경우 다음과 같이 단일 에이전트로 동작함:

* `agentId`: **`main`**
* 세션 키: `agent:main:<원본키>`
* 워크스페이스: `~/.openclaw/workspace`
* 데이터 디렉터리: `~/.openclaw/agents/main/agent`

## 에이전트 관리 도구

설정 마법사를 사용하여 새로운 격리 에이전트를 간편하게 추가할 수 있음:

```bash
openclaw agents add work
```

추가 후 `bindings` 설정을 통해 메시지 라우팅 규칙을 지정함. 설정 결과는 다음 명령어로 확인 가능함:

```bash
openclaw agents list --bindings
```

## 빠른 시작 가이드

<Steps>
  <Step title="에이전트 워크스페이스 생성">
    마법사 또는 수동으로 워크스페이스를 생성함:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    각 에이전트는 독립적인 지침 파일과 전용 데이터 디렉터리를 할당받음.
  </Step>

  <Step title="채널 계정 연동">
    각 에이전트에서 사용할 채널 계정을 구성함:

    * **Discord/Telegram**: 에이전트당 하나의 봇을 생성하고 토큰을 발급받음.
    * **WhatsApp**: 계정별로 별도의 전화번호를 연결함.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    [채널별 가이드](/channels)를 참조하여 설정을 완료함.
  </Step>

  <Step title="에이전트, 계정 및 바인딩 등록">
    `openclaw.json` 파일의 `agents.list`에 에이전트를 등록하고, `channels.<channel>.accounts`에 계정 정보를 넣은 뒤 `bindings` 섹션에서 이들을 연결함.
  </Step>

  <Step title="서버 재시작 및 검증">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## 멀티 에이전트 활용 시나리오

여러 에이전트를 운영하면 각 `agentId`는 **완벽히 분리된 인격**으로 동작함:

* **독립된 계정**: 채널별로 서로 다른 전화번호나 계정 사용 가능.
* **차별화된 성격**: 워크스페이스의 지침 파일에 따라 각기 다른 답변 스타일과 행동 강령을 가짐.
* **데이터 격리**: 인증 정보와 대화 이력이 섞이지 않음 (명시적으로 허용하지 않는 한).

이를 통해 **여러 명의 사용자**가 하나의 서버를 공유하면서 각자의 개인용 AI 비서와 데이터를 안전하게 관리할 수 있음.

## 하나의 번호로 여러 명 응대하기 (DM 분할)

**단일 WhatsApp 계정**에서 발신자 번호(E.164 형식, 예: `+8210...`)를 기준으로 서로 다른 에이전트에게 메시지를 전달할 수 있음. `peer.kind: "direct"` 조건을 활용함. 단, 응답은 모두 동일한 원본 번호에서 발송됨.

<Note>
  **주의**: 개인 대화는 에이전트의 **메인 세션**으로 통합되므로, 완전한 데이터 격리를 위해서는 사용자마다 별도의 에이전트를 할당해야 함.
</Note>

**설정 예시:**

```json5
{
  agents: {
    list: [
      { id: "user1", workspace: "~/.openclaw/workspace-user1" },
      { id: "user2", workspace: "~/.openclaw/workspace-user2" },
    ],
  },
  bindings: [
    {
      agentId: "user1",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+821012345678" } },
    },
    {
      agentId: "user2",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+821098765432" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+821012345678", "+821098765432"],
    },
  },
}
```

## 라우팅 규칙 및 우선순위 (Rules)

바인딩은 **결정론적**으로 작동하며, **가장 구체적인 규칙**이 우선적으로 적용됨:

1. `peer` 일치 (정확한 DM/그룹/채널 ID)
2. `parentPeer` 일치 (스레드 상속 관계)
3. `guildId + roles` (Discord 역할 기반 라우팅)
4. `guildId` (Discord 서버 단위)
5. `teamId` (Slack 워크스페이스 단위)
6. 채널별 `accountId` 일치
7. 채널 전체 일치 (`accountId: "*"`)
8. 기본 에이전트로 폴백 (`default` 설정 에이전트 또는 목록의 첫 번째 에이전트)

동일한 우선순위 내에서는 설정 파일에 먼저 정의된 규칙이 승리함. 여러 필드를 조합할 경우(예: `peer` + `guildId`) 모든 조건이 충족되어야 함(`AND` 연산).

**계정 범위 주의 사항**:

* `accountId`를 생략한 바인딩은 기본 계정에만 적용됨.
* 모든 계정에 공통 적용하려면 `accountId: "*"`를 명시함.

## 플랫폼별 설정 사례

### Discord: 에이전트당 개별 봇 운영

각 봇 계정을 고유한 `accountId`로 등록하고, 각 봇별로 허용 목록(Allowlist)을 관리함.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      accounts: {
        default: { token: "TOKEN_1" },
        coding: { token: "TOKEN_2" }
      },
    },
  },
}
```

### WhatsApp: 멀티 계정(멀티 번호) 운영

서버 구동 전 각 계정별로 로그인을 수행함:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

설정 파일에서 각 `accountId`를 에이전트와 연결함:

```js
{
  agents: {
    list: [
      { id: "home", workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

## 에이전트별 샌드박스 및 도구 설정

각 에이전트는 독립적인 보안 정책과 도구 제한을 가질 수 있음 (v2026.1.6 이상):

```js
{
  agents: {
    list: [
      {
        id: "private",
        workspace: "~/.openclaw/workspace-private",
        sandbox: { mode: "off" }, // 샌드박스 미사용 (호스트 권한)
      },
      {
        id: "guest",
        workspace: "~/.openclaw/workspace-guest",
        sandbox: {
          mode: "all",
          scope: "agent", // 에이전트당 하나의 독립된 컨테이너 할당
          docker: {
            setupCommand: "apt-get update && apt-get install -y git", // 컨테이너 초기화 명령어
          },
        },
        tools: {
          allow: ["read"], // 파일 읽기만 허용
          deny: ["exec", "write", "edit"], // 명령어 실행 및 수정 차단
        },
      },
    ],
  },
}
```

**주요 이점:**

* **보안 강화**: 신뢰할 수 없는 에이전트의 도구 접근을 제한함.
* **자원 제어**: 특정 에이전트만 격리된 환경에서 구동하여 시스템을 보호함.
* **유연한 정책**: 사용자나 에이전트의 역할에 따라 세밀한 권한 부여 가능.

<Note>
  **참고**: `tools.elevated` 설정은 발신자 기반의 **전역 설정**이므로 에이전트별로 다르게 지정할 수 없음. 에이전트별 경계가 필요한 경우 위 예시와 같이 `agents.list[].tools`의 `deny` 목록을 활용함.
</Note>

상세 예시는 [멀티 에이전트 샌드박스 및 도구 설정](/tools/multi-agent-sandbox-tools) 참조.
