---
summary: "리팩터링 계획: exec host 라우팅, node 승인, headless runner"
read_when:
  - exec host 라우팅이나 exec 승인을 설계할 때
  - node runner + UI IPC를 구현할 때
  - exec host security mode와 slash command를 추가할 때
title: "Exec Host 리팩터링"
x-i18n:
  source_path: "refactor/exec-host.md"
---

# Exec host 리팩터링 계획

## 목표

- `exec.host` + `exec.security`를 추가해 실행 대상을 **sandbox**, **gateway**, **node** 사이에서 라우팅.
- 기본값은 **안전하게** 유지: 명시적으로 켜지 않으면 host 간 실행 없음.
- 실행을 **headless runner service**로 분리하고, 선택적으로 UI(macOS app)는 로컬 IPC로 연결.
- **agent별** policy, allowlist, ask mode, node binding 제공.
- allowlist 유무와 관계없이 동작하는 **ask mode** 지원.
- 크로스 플랫폼: Unix socket + token auth(macOS/Linux/Windows parity).

## 비목표

- 레거시 allowlist 마이그레이션이나 레거시 schema 지원 없음.
- node exec에 PTY/streaming 없음(집계된 출력만 반환).
- 기존 Bridge + Gateway를 넘어서는 새로운 네트워크 계층 추가 없음.

## 결정 사항 (확정)

- **Config 키:** `exec.host` + `exec.security` (agent별 override 허용).
- **권한 상승:** `/elevated`는 gateway full access 별칭으로 유지.
- **Ask 기본값:** `on-miss`.
- **승인 저장소:** `~/.openclaw/exec-approvals.json` (JSON, 레거시 migration 없음).
- **Runner:** headless system service, UI app은 승인을 위한 Unix socket 호스팅.
- **Node 아이덴티티:** 기존 `nodeId` 사용.
- **Socket auth:** Unix socket + token(크로스 플랫폼), 필요 시 나중에 분리.
- **Node host 상태:** `~/.openclaw/node.json` (node id + pairing token).
- **macOS exec host:** macOS app 내부에서 `system.run` 실행, node host service는 요청을 로컬 IPC로 전달.
- **XPC helper 없음:** Unix socket + token + peer check로 유지.

## 핵심 개념

### Host

- `sandbox`: Docker exec(현재 동작).
- `gateway`: gateway host에서 exec.
- `node`: Bridge를 통한 node runner에서 exec (`system.run`).

### Security mode

- `deny`: 항상 차단.
- `allowlist`: 일치 항목만 허용.
- `full`: 모든 것을 허용(권한 상승과 동일).

### Ask mode

- `off`: 묻지 않음.
- `on-miss`: allowlist가 일치하지 않을 때만 질문.
- `always`: 매번 질문.

Ask는 **allowlist와 독립적**입니다. allowlist는 `always`나 `on-miss`와 함께 사용할 수 있습니다.

### Policy 결정 (exec 단위)

1. `exec.host`를 결정(tool param -> agent override -> global default).
2. `exec.security`와 `exec.ask`를 결정(동일한 우선순위).
3. host가 `sandbox`면 로컬 sandbox exec 진행.
4. host가 `gateway` 또는 `node`면 해당 host에서 security + ask policy 적용.

## 기본 안전성

- 기본 `exec.host = sandbox`.
- `gateway`와 `node`의 기본 `exec.security = deny`.
- 기본 `exec.ask = on-miss` (security가 허용될 때만 의미 있음).
- node binding이 없으면 **agent는 아무 node나 대상으로 삼을 수 있지만**, policy가 허용할 때만 가능합니다.

## Config 표면

### Tool parameter

- `exec.host` (선택): `sandbox | gateway | node`.
- `exec.security` (선택): `deny | allowlist | full`.
- `exec.ask` (선택): `off | on-miss | always`.
- `exec.node` (선택): `host=node`일 때 사용할 node id/name.

### Config 키 (전역)

- `tools.exec.host`
- `tools.exec.security`
- `tools.exec.ask`
- `tools.exec.node` (기본 node binding)

### Config 키 (agent별)

- `agents.list[].tools.exec.host`
- `agents.list[].tools.exec.security`
- `agents.list[].tools.exec.ask`
- `agents.list[].tools.exec.node`

### 별칭

- `/elevated on` = agent session에 `tools.exec.host=gateway`, `tools.exec.security=full` 설정.
- `/elevated off` = agent session의 이전 exec 설정 복원.

## 승인 저장소 (JSON)

경로: `~/.openclaw/exec-approvals.json`

목적:

- **실행 host**(gateway 또는 node runner)용 로컬 policy + allowlist.
- UI를 사용할 수 없을 때의 ask fallback.
- UI client용 IPC 자격 증명.

제안 schema (v1):

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64-opaque-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny"
  },
  "agents": {
    "agent-id-1": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [
        {
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 0,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

메모:

- 레거시 allowlist 형식 없음.
- `askFallback`은 `ask`가 필요하지만 UI에 연결할 수 없을 때만 적용.
- 파일 권한: `0600`.

## Runner service (headless)

### 역할

- 로컬에서 `exec.security` + `exec.ask`를 강제.
- system command를 실행하고 출력을 반환.
- exec lifecycle에 대한 Bridge 이벤트를 발생(optional but recommended).

### 서비스 lifecycle

- macOS에서는 Launchd/daemon, Linux/Windows에서는 system service.
- 승인 JSON은 실행 host 로컬에 존재.
- UI는 로컬 Unix socket을 호스팅하고, runner는 필요 시 연결.

## UI 통합 (macOS app)

### IPC

- `~/.openclaw/exec-approvals.sock`의 Unix socket (`0600`).
- token은 `exec-approvals.json`에 저장 (`0600`).
- Peer check: 동일 UID만 허용.
- challenge/response: nonce + `HMAC(token, request-hash)`로 replay 방지.
- 짧은 TTL(예: 10초) + 최대 payload + rate limit.

### Ask 흐름 (macOS app exec host)

1. Node service가 gateway로부터 `system.run`을 수신.
2. Node service가 로컬 socket에 연결해 prompt/exec 요청을 보냄.
3. App이 peer + token + HMAC + TTL을 검증하고, 필요하면 dialog를 표시.
4. App이 UI 컨텍스트에서 command를 실행하고 출력을 반환.
5. Node service가 출력을 gateway로 반환.

UI가 없으면:

- `askFallback` 적용 (`deny|allowlist|full`).

### 다이어그램 (SCI)

```
Agent -> Gateway -> Bridge -> Node Service (TS)
                         |  IPC (UDS + token + HMAC + TTL)
                         v
                     Mac App (UI + TCC + system.run)
```

## Node 아이덴티티 + binding

- Bridge pairing의 기존 `nodeId` 사용.
- Binding 모델:
  - `tools.exec.node`는 agent를 특정 node로 제한.
  - 설정하지 않으면 agent는 아무 node나 선택할 수 있음(policy 기본값은 계속 적용).
- Node 선택 결정:
  - `nodeId` 정확히 일치
  - `displayName` (정규화)
  - `remoteIp`
  - `nodeId` prefix (6자 이상)

## 이벤트

### 누가 이벤트를 보는가

- System event는 **session별**이며 다음 prompt 때 agent에게 표시됩니다.
- gateway의 in-memory queue(`enqueueSystemEvent`)에 저장됩니다.

### 이벤트 텍스트

- `Exec started (node=<id>, id=<runId>)`
- `Exec finished (node=<id>, id=<runId>, code=<code>)` + 선택적 output tail
- `Exec denied (node=<id>, id=<runId>, <reason>)`

### 전송

옵션 A (권장):

- Runner가 Bridge `event` frame `exec.started` / `exec.finished`를 전송.
- Gateway `handleBridgeEvent`가 이를 `enqueueSystemEvent`로 매핑.

옵션 B:

- Gateway `exec` tool이 lifecycle을 직접 처리(동기식 전용).

## Exec 흐름

### Sandbox host

- 기존 `exec` 동작(Docker 또는 unsandboxed host).
- PTY는 비-sandbox 모드에서만 지원.

### Gateway host

- Gateway process가 자신의 머신에서 실행.
- 로컬 `exec-approvals.json`(security/ask/allowlist)을 강제.

### Node host

- Gateway가 `system.run`으로 `node.invoke` 호출.
- Runner가 로컬 승인을 강제.
- Runner가 집계된 stdout/stderr 반환.
- 선택적으로 start/finish/deny에 대한 Bridge 이벤트 전송.

## 출력 제한

- 합산 stdout+stderr를 **200k**로 제한, event용으로 **tail 20k** 유지.
- 잘린 경우 명확한 접미사 추가(예: `"… (truncated)"`).

## Slash command

- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`
- agent별, session별 override이며 config에 저장하지 않으면 비영속.
- `/elevated on|off|ask|full`은 `host=gateway security=full`의 shortcut으로 유지(`full`은 승인 생략).

## 크로스 플랫폼 스토리

- runner service가 이식 가능한 실행 대상입니다.
- UI는 선택 사항이며, 없으면 `askFallback`이 적용됩니다.
- Windows/Linux도 동일한 approvals JSON + socket protocol을 지원합니다.

## 구현 단계

### Phase 1: config + exec routing

- `exec.host`, `exec.security`, `exec.ask`, `exec.node`용 config schema 추가.
- `exec.host`를 존중하도록 tool plumbing 업데이트.
- `/exec` slash command 추가, `/elevated` alias 유지.

### Phase 2: approvals store + gateway enforcement

- `exec-approvals.json` reader/writer 구현.
- `gateway` host에 대해 allowlist + ask mode 강제.
- output cap 추가.

### Phase 3: node runner enforcement

- node runner가 allowlist + ask를 강제하도록 업데이트.
- macOS app UI에 Unix socket prompt bridge 추가.
- `askFallback` 연결.

### Phase 4: event

- exec lifecycle에 대한 node -> gateway Bridge event 추가.
- agent prompt용 `enqueueSystemEvent`에 매핑.

### Phase 5: UI polish

- Mac app: allowlist editor, agent별 switcher, ask policy UI.
- node binding 제어(선택).

## 테스트 계획

- Unit test: allowlist 매칭(glob + case-insensitive).
- Unit test: policy 결정 우선순위(tool param -> agent override -> global).
- Integration test: node runner deny/allow/ask 흐름.
- Bridge event test: node event -> system event 라우팅.

## 열린 리스크

- UI를 사용할 수 없을 때: `askFallback` 준수 보장 필요.
- 장시간 실행 command: timeout + output cap에 의존.
- multi-node 모호성: node binding 또는 명시적 node param이 없으면 오류.

## 관련 문서

- [Exec tool](/tools/exec)
- [Exec approvals](/tools/exec-approvals)
- [Nodes](/nodes)
- [Elevated mode](/tools/elevated)
