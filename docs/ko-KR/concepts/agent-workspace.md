---
summary: "Agent workspace: location, layout, and backup strategy"
description: "OpenClaw agent workspace의 기본 위치, 파일 구조, 백업 전략, 이전 시 주의사항을 설명합니다."
read_when:
  - agent workspace의 개념이나 파일 구성을 설명해야 할 때
  - agent workspace를 백업하거나 다른 장치로 이전하려고 할 때
title: "Agent Workspace"
x-i18n:
  source_path: "concepts/agent-workspace.md"
---

# Agent workspace

workspace는 agent의 홈입니다. 파일 도구와 workspace context가 사용하는 유일한
working directory이며, memory처럼 다뤄야 하는 private 공간입니다.

이 경로는 config, credentials, session을 저장하는 `~/.openclaw/`와는 별개입니다.

**Important:** workspace는 **default cwd**이지, 강제적인 sandbox는 아닙니다. 도구는
relative path를 workspace 기준으로 해석하지만, sandbox가 꺼져 있으면 absolute path로
host의 다른 위치에도 접근할 수 있습니다. 격리가 필요하면
[`agents.defaults.sandbox`](/gateway/sandboxing)와 필요 시 agent별 sandbox 설정을
사용하세요. sandbox가 켜져 있고 `workspaceAccess`가 `"rw"`가 아니면, 도구는 host
workspace가 아니라 `~/.openclaw/sandboxes` 아래의 sandbox workspace에서 동작합니다.

## Default location

- 기본값: `~/.openclaw/workspace`
- `OPENCLAW_PROFILE`이 설정되어 있고 `"default"`가 아니면 기본값은
  `~/.openclaw/workspace-<profile>`이 됩니다.
- `~/.openclaw/openclaw.json`에서 override할 수 있습니다.

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure`, `openclaw setup`은 workspace가 없을 때
workspace를 만들고 bootstrap file을 채워 넣습니다.
sandbox seed copy는 workspace 내부의 일반 파일만 허용하며, source workspace 밖을
가리키는 symlink나 hardlink alias는 무시됩니다.

이미 workspace file을 직접 관리하고 있다면 bootstrap file 생성을 끌 수 있습니다.

```json5
{ agent: { skipBootstrap: true } }
```

## Extra workspace folders

예전 설치에서는 `~/openclaw`가 만들어졌을 수 있습니다. 여러 workspace directory를
동시에 남겨 두면 실제로 어떤 workspace가 active인지 헷갈려 인증 정보나 상태가
엇갈릴 수 있습니다.

**Recommendation:** active workspace는 하나만 유지하세요. 더 이상 쓰지 않는 추가
folder는 archive하거나 Trash로 옮기는 편이 낫습니다
(`trash ~/openclaw` 같은 방식). 여러 workspace를 의도적으로 유지한다면
`agents.defaults.workspace`가 현재 active workspace를 정확히 가리키는지 확인하세요.

`openclaw doctor`는 extra workspace directory를 감지하면 경고를 출력합니다.

## Workspace file map (what each file means)

OpenClaw는 workspace 안에서 아래 standard file을 기대합니다.

- `AGENTS.md`
  - agent 운영 지침과 memory 사용 방식을 정의합니다.
  - 모든 session 시작 시 로드됩니다.
  - rule, priority, behavior detail을 적기에 좋은 곳입니다.

- `SOUL.md`
  - persona, tone, boundary를 정의합니다.
  - 모든 session에서 로드됩니다.

- `USER.md`
  - 사용자가 누구인지와 어떻게 부를지를 정의합니다.
  - 모든 session에서 로드됩니다.

- `IDENTITY.md`
  - agent의 이름, vibe, emoji를 담습니다.
  - bootstrap ritual 중 생성되거나 업데이트됩니다.

- `TOOLS.md`
  - local tool과 convention에 대한 메모입니다.
  - tool availability를 제어하지는 않고 guidance만 제공합니다.

- `HEARTBEAT.md`
  - heartbeat run용의 짧은 checklist입니다.
  - token 낭비를 막기 위해 짧게 유지하는 편이 좋습니다.

- `BOOT.md`
  - internal hook이 켜져 있을 때 gateway restart 시 실행되는 startup checklist입니다.
  - 짧게 유지하고, 외부 전송이 필요하면 message tool을 사용하세요.

- `BOOTSTRAP.md`
  - 처음 한 번만 실행되는 first-run ritual입니다.
  - brand-new workspace에만 생성됩니다.
  - ritual이 끝나면 삭제하세요.

- `memory/YYYY-MM-DD.md`
  - 일별 memory log입니다. 하루에 하나의 파일을 사용합니다.
  - session 시작 시 오늘과 어제 기록을 읽는 흐름을 권장합니다.

- `MEMORY.md` (optional)
  - 정제된 long-term memory입니다.
  - shared/group context가 아닌 private main session에서만 로드하는 편이 좋습니다.

[Memory](/concepts/memory) 문서에서 workflow와 automatic memory flush를 확인할 수
있습니다.

- `skills/` (optional)
  - workspace-specific skill을 둡니다.
  - 이름이 충돌하면 managed/bundled skill보다 우선합니다.

- `canvas/` (optional)
  - node display용 Canvas UI file을 둡니다
    (예: `canvas/index.html`).

bootstrap file이 빠져 있으면 OpenClaw는 session에 "missing file" marker를 inject하고
계속 진행합니다. bootstrap file이 너무 크면 inject 시 잘릴 수 있으며,
`agents.defaults.bootstrapMaxChars`(기본값: 20000)와
`agents.defaults.bootstrapTotalMaxChars`(기본값: 150000)로 제한을 조정할 수 있습니다.
`openclaw setup`은 기존 file을 덮어쓰지 않고 누락된 기본 file만 다시 생성할 수
있습니다.

## What is NOT in the workspace

다음 항목은 `~/.openclaw/` 아래에 있으며 workspace repo에 commit하면 안 됩니다.

- `~/.openclaw/openclaw.json` (config)
- `~/.openclaw/credentials/` (OAuth token, API key)
- `~/.openclaw/agents/<agentId>/sessions/` (session transcript와 metadata)
- `~/.openclaw/skills/` (managed skill)

session이나 config를 이전해야 한다면 별도로 복사하고 version control에서는 제외하세요.

## Git backup (recommended, private)

workspace는 private memory처럼 다루는 것이 좋습니다. 복구할 수 있도록
**private** git repo에 백업해 두세요.

아래 단계는 Gateway가 실행되는 machine에서 수행해야 합니다. workspace도 그곳에
있습니다.

### 1) Initialize the repo

git이 설치되어 있으면 brand-new workspace는 자동으로 git repo로 초기화됩니다.
이 workspace가 아직 repo가 아니라면 아래처럼 실행하세요.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Add a private remote (beginner-friendly options)

Option A: GitHub web UI

1. GitHub에서 새 **private** repository를 만듭니다.
2. README로 초기화하지 마세요. merge conflict를 피하기 쉽습니다.
3. HTTPS remote URL을 복사합니다.
4. remote를 추가하고 push합니다.

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Option B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Option C: GitLab web UI

1. GitLab에서 새 **private** repository를 만듭니다.
2. README로 초기화하지 마세요. merge conflict를 피하기 쉽습니다.
3. HTTPS remote URL을 복사합니다.
4. remote를 추가하고 push합니다.

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Ongoing updates

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Do not commit secrets

private repo라도 secret은 workspace에 넣지 않는 편이 안전합니다.

- API key, OAuth token, password, private credential
- `~/.openclaw/` 아래의 어떤 항목이든
- chat raw dump나 민감한 attachment 원본

민감한 reference를 꼭 남겨야 한다면 placeholder만 두고 실제 secret은 password
manager, environment variable, 또는 `~/.openclaw/`에 보관하세요.

권장 `.gitignore` 예시:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Moving the workspace to a new machine

1. 원하는 path에 repo를 clone합니다
   (기본값은 `~/.openclaw/workspace`).
2. `~/.openclaw/openclaw.json`의 `agents.defaults.workspace`를 해당 path로 설정합니다.
3. `openclaw setup --workspace <path>`를 실행해 누락된 file을 채웁니다.
4. session도 필요하면 예전 machine의 `~/.openclaw/agents/<agentId>/sessions/`를
   별도로 복사합니다.

## Advanced notes

- multi-agent routing에서는 agent마다 다른 workspace를 사용할 수 있습니다.
  설정 방식은 [Channel routing](/channels/channel-routing)을 참고하세요.
- `agents.defaults.sandbox`가 켜져 있으면 non-main session은
  `agents.defaults.sandbox.workspaceRoot` 아래의 per-session sandbox workspace를
  사용할 수 있습니다.
