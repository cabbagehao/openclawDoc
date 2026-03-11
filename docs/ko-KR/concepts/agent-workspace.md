---
summary: "Agent workspace: 위치, 레이아웃, 백업 전략"
read_when:
  - agent workspace 또는 그 파일 레이아웃을 설명해야 할 때
  - agent workspace를 백업하거나 마이그레이션하려고 할 때
title: "Agent Workspace"
---

# Agent workspace

Workspace는 에이전트의 집입니다. 파일 도구와 workspace 컨텍스트에 사용되는 유일한
작업 디렉터리입니다. 비공개로 유지하고 메모리처럼 다루세요.

이것은 config, credentials, sessions를 저장하는 `~/.openclaw/`와는 별개입니다.

**중요:** workspace는 하드 샌드박스가 아니라 **기본 cwd**입니다. 도구는 상대
경로를 workspace 기준으로 해석하지만, 샌드박싱이 활성화되지 않으면 절대 경로는
여전히 호스트의 다른 위치에 접근할 수 있습니다. 격리가 필요하다면
[`agents.defaults.sandbox`](/gateway/sandboxing)(및/또는 에이전트별 sandbox
config)를 사용하세요. 샌드박싱이 활성화되어 있고 `workspaceAccess`가 `"rw"`가
아니면, 도구는 호스트 workspace가 아니라 `~/.openclaw/sandboxes` 아래의
sandbox workspace 내부에서 동작합니다.

## 기본 위치

- 기본값: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE`이 설정되어 있고 `"default"`가 아니면, 기본값은
  `~/.openclaw/workspace-<profile>`가 됩니다.
- `~/.openclaw/openclaw.json`에서 재정의:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure`, 또는 `openclaw setup`은 workspace가
없을 경우 이를 생성하고 bootstrap 파일을 시드합니다. Sandbox seed 복사는
workspace 내부의 일반 파일만 허용하며, 원본 workspace 밖을 가리키는
symlink/hardlink alias는 무시됩니다.

이미 workspace 파일을 직접 관리하고 있다면 bootstrap 파일 생성 기능을 끌 수
있습니다.

```json5
{ agent: { skipBootstrap: true } }
```

## 추가 workspace 폴더

이전 설치에서는 `~/openclaw`가 생성되었을 수 있습니다. 여러 workspace
디렉터리를 동시에 두면 한 번에 하나의 workspace만 활성화되기 때문에 auth 또는
state drift가 혼란스럽게 발생할 수 있습니다.

**권장 사항:** 활성 workspace는 하나만 유지하세요. 더 이상 추가 폴더를 사용하지
않는다면 보관하거나 휴지통으로 옮기세요(예: `trash ~/openclaw`). 의도적으로
여러 workspace를 유지한다면 `agents.defaults.workspace`가 활성 workspace를
가리키는지 확인하세요.

`openclaw doctor`는 추가 workspace 디렉터리를 감지하면 경고합니다.

## Workspace 파일 맵 (각 파일의 의미)

다음은 OpenClaw가 workspace 내부에서 기대하는 표준 파일들입니다.

- `AGENTS.md`
  - 에이전트에 대한 운영 지침과 메모리 사용 방법
  - 모든 세션 시작 시 로드됨
  - 규칙, 우선순위, "어떻게 행동할지"에 대한 세부 사항을 두기 좋은 위치

- `SOUL.md`
  - Persona, 톤, 경계
  - 모든 세션에서 로드됨

- `USER.md`
  - 사용자가 누구인지, 그리고 어떻게 호칭할지
  - 모든 세션에서 로드됨

- `IDENTITY.md`
  - 에이전트의 이름, vibe, emoji
  - bootstrap ritual 중 생성/업데이트됨

- `TOOLS.md`
  - 로컬 도구와 관례에 대한 메모
  - 도구 사용 가능 여부를 제어하지 않으며, 오직 가이드 역할만 함

- `HEARTBEAT.md`
  - heartbeat 실행을 위한 선택적인 작은 체크리스트
  - 토큰 낭비를 피하려면 짧게 유지

- `BOOT.md`
  - 내부 hook이 활성화되어 있을 때 gateway 재시작 시 실행되는 선택적 시작 체크리스트
  - 짧게 유지하고, outbound send에는 message tool을 사용

- `BOOTSTRAP.md`
  - 최초 1회 실행 ritual
  - 완전히 새로운 workspace에만 생성됨
  - ritual이 완료되면 삭제

- `memory/YYYY-MM-DD.md`
  - 일일 메모리 로그(하루당 파일 하나)
  - 세션 시작 시 오늘 + 어제를 읽는 것을 권장

- `MEMORY.md` (선택 사항)
  - 큐레이션된 장기 메모리
  - 메인 비공개 세션에서만 로드(공유/그룹 컨텍스트 제외)

[Memory](/concepts/memory)에서 워크플로와 자동 메모리 플러시에 대해 확인하세요.

- `skills/` (선택 사항)
  - Workspace 전용 skills
  - 이름이 충돌하면 managed/bundled skills를 덮어씀

- `canvas/` (선택 사항)
  - 노드 디스플레이용 Canvas UI 파일(예: `canvas/index.html`)

어떤 bootstrap 파일이든 없으면 OpenClaw는 세션에 "missing file" marker를
주입하고 계속 진행합니다. 큰 bootstrap 파일은 주입 시 잘립니다. 제한을
조정하려면 `agents.defaults.bootstrapMaxChars`(기본값: 20000)와
`agents.defaults.bootstrapTotalMaxChars`(기본값: 150000)를 사용하세요.
`openclaw setup`은 기존 파일을 덮어쓰지 않고 누락된 기본 파일을 다시 만들 수
있습니다.

## Workspace에 없는 것

다음은 `~/.openclaw/` 아래에 있으며 workspace repo에 커밋하면 안 됩니다.

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/credentials/` (OAuth token, API key)
- `~/.openclaw/agents/<agentId>/sessions/` (session transcript + metadata)
- `~/.openclaw/skills/` (managed skills)

Sessions 또는 config를 마이그레이션해야 한다면 별도로 복사하고 version control에는
넣지 마세요.

## Git 백업 (권장, 비공개)

Workspace를 비공개 메모리처럼 다루세요. **비공개** git repo에 넣어 백업 가능하고
복구 가능하도록 유지하세요.

다음 단계는 Gateway가 실행되는 머신에서 수행하세요(workspace는 그곳에 있습니다).

### 1) repo 초기화

git이 설치되어 있다면 완전히 새로운 workspace는 자동으로 초기화됩니다. 이
workspace가 아직 repo가 아니라면 다음을 실행하세요.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) 비공개 remote 추가 (초보자 친화적 옵션)

옵션 A: GitHub 웹 UI

1. GitHub에서 새로운 **비공개** repository를 만드세요.
2. README로 초기화하지 마세요(merge conflict 방지).
3. HTTPS remote URL을 복사하세요.
4. remote를 추가하고 push하세요.

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

옵션 B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

옵션 C: GitLab 웹 UI

1. GitLab에서 새로운 **비공개** repository를 만드세요.
2. README로 초기화하지 마세요(merge conflict 방지).
3. HTTPS remote URL을 복사하세요.
4. remote를 추가하고 push하세요.

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) 이후 업데이트

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## 비밀 정보는 커밋하지 마세요

비공개 repo라 하더라도 workspace에는 비밀 정보를 저장하지 않는 것이 좋습니다.

- API key, OAuth token, password, 또는 비공개 credentials
- `~/.openclaw/` 아래의 어떤 것이든
- 채팅 원본 덤프 또는 민감한 첨부 파일

민감한 참조를 저장해야 한다면 placeholder를 사용하고 실제 secret은 다른 곳에
보관하세요(password manager, environment variables, 또는 `~/.openclaw/`).

권장 `.gitignore` 시작 예시:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Workspace를 새 머신으로 옮기기

1. 원하는 경로(기본값 `~/.openclaw/workspace`)에 repo를 clone합니다.
2. `~/.openclaw/openclaw.json`에서 `agents.defaults.workspace`를 해당 경로로 설정합니다.
3. 누락된 파일을 시드하려면 `openclaw setup --workspace <path>`를 실행합니다.
4. Sessions도 필요하다면, 기존 머신의 `~/.openclaw/agents/<agentId>/sessions/`를 별도로 복사합니다.

## 고급 참고 사항

- 멀티 에이전트 라우팅에서는 에이전트별로 서로 다른 workspace를 사용할 수 있습니다.
  라우팅 구성은 [Channel routing](/channels/channel-routing)을 참고하세요.
- `agents.defaults.sandbox`가 활성화되어 있으면, non-main session은
  `agents.defaults.sandbox.workspaceRoot` 아래의 세션별 sandbox workspace를
  사용할 수 있습니다.
