---
summary: "에이전트 목록 조회, 추가, 삭제 및 바인딩(Bindings), 신원 설정(Identity) 등을 관리하는 `openclaw agents` 명령어 레퍼런스"
read_when:
  - 워크스페이스, 라우팅, 인증 정보가 분리된 여러 에이전트를 운영하고자 할 때
title: "agents"
x-i18n:
  source_path: "cli/agents.md"
---

# `openclaw agents`

워크스페이스, 인증 정보 및 라우팅 설정이 격리된 여러 에이전트 인스턴스를 관리함.

**관련 문서:**
- 멀티 에이전트 라우팅 개요: [Multi-Agent Routing](/concepts/multi-agent)
- 에이전트 워크스페이스 구조: [Agent workspace](/concepts/agent-workspace)

## 사용 예시

```bash
# 전체 에이전트 목록 조회
openclaw agents list

# 특정 경로의 워크스페이스를 사용하는 신규 에이전트 'work' 추가
openclaw agents add work --workspace ~/.openclaw/workspace-work

# 현재 설정된 모든 라우팅 바인딩 확인
openclaw agents bindings

# 에이전트 'work'를 특정 Telegram 계정('ops')에 연결
openclaw agents bind --agent work --bind telegram:ops

# 에이전트 'work'와 Telegram 계정('ops') 간의 연결 해제
openclaw agents unbind --agent work --bind telegram:ops

# 워크스페이스 내 IDENTITY.md 파일을 읽어 신원 정보 업데이트
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity

# 메인 에이전트의 아바타 이미지를 명시적으로 설정
openclaw agents set-identity --agent main --avatar avatars/openclaw.png

# 에이전트 'work' 인스턴스 삭제
openclaw agents delete work
```

## 라우팅 바인딩 (Routing Bindings)

바인딩 설정을 통해 수신되는 채널 트래픽을 특정 에이전트에게 전달하도록 고정할 수 있음.

**바인딩 목록 확인:**
```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

**바인딩 추가:**
```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```
`accountId`를 생략하고 `--bind <channel>` 형식만 입력할 경우, 시스템은 해당 채널의 기본값이나 플러그인 설정 정보를 바탕으로 계정을 자동 해석함.

### 바인딩 범위(Scope) 동작 규칙

- 계정 ID(`accountId`)가 없는 바인딩은 해당 채널의 **기본 계정**에만 적용됨.
- `accountId: "*"` 설정은 채널의 모든 계정에 대한 **폴백(Fallback)** 역할을 수행하며, 명시적 계정 바인딩보다 우선순위가 낮음.
- 기존에 계정 ID 없이 설정된 바인딩이 있는 상태에서, 나중에 동일 채널에 대해 명시적인 계정 ID로 다시 바인딩할 경우 OpenClaw는 중복 생성 대신 기존 설정을 해당 계정 범위로 **업그레이드**함.

**업그레이드 예시:**
```bash
# 1. 초기 채널 단위 바인딩 (계정 미지정)
openclaw agents bind --agent work --bind telegram

# 2. 특정 계정 범위로 업그레이드
openclaw agents bind --agent work --bind telegram:ops
```
업그레이드 완료 후, 해당 바인딩은 오직 `telegram:ops` 계정의 메시지만 처리함. 기본 계정 메시지도 계속 처리하려면 `--bind telegram:default`와 같이 명시적으로 추가해야 함.

**바인딩 해제:**
```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## 신원 정보 파일 (Identity Files)

각 에이전트 워크스페이스 루트에는 신원 정보를 담은 `IDENTITY.md` 파일을 포함할 수 있음:

- 기본 경로 예시: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 옵션 사용 시 워크스페이스 루트(또는 `--identity-file`로 지정된 경로)의 파일을 읽어옴.
- 아바타 이미지 경로는 워크스페이스 루트를 기준으로 해석됨.

## 신원 설정 (Set Identity)

`set-identity` 명령어를 통해 `agents.list[].identity` 하위 필드를 업데이트함:

- **`name`**: 에이전트 이름.
- **`theme`**: 응답 스타일이나 색상 테마.
- **`emoji`**: 에이전트를 상징하는 이모지.
- **`avatar`**: 이미지 경로(워크스페이스 상대 경로), URL 또는 Data URI.

**데이터 로드:**
```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

**필드 개별 오버라이드:**
```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

**설정 파일 예시:**
```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
