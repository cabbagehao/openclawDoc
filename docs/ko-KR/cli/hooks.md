---
summary: "CLI 참고: `openclaw hooks` (agent hooks)"
read_when:
  - agent hook을 관리하고 싶을 때
  - hook을 설치하거나 업데이트하고 싶을 때
title: "hooks"
---

# `openclaw hooks`

agent hook을 관리합니다. hook은 `/new`, `/reset`, gateway startup 같은 이벤트에 반응하는 자동화입니다.

관련 문서:

- Hooks: [Hooks](/automation/hooks)
- Plugin hooks: [Plugins](/tools/plugin#plugin-hooks)

## List All Hooks

```bash
openclaw hooks list
```

workspace, managed, bundled 디렉터리에서 발견된 hook을 모두 나열합니다.

**옵션:**

- `--eligible`: 조건을 만족하는 hook만 표시
- `--json`: JSON으로 출력
- `-v, --verbose`: 누락된 requirement를 포함한 상세 정보 표시

**예시 출력:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new command is issued
```

**예시(verbose):**

```bash
openclaw hooks list --verbose
```

eligible하지 않은 hook의 missing requirement를 보여줍니다.

**예시(JSON):**

```bash
openclaw hooks list --json
```

프로그램에서 사용하기 위한 구조화된 JSON을 반환합니다.

## Get Hook Information

```bash
openclaw hooks info <name>
```

특정 hook의 상세 정보를 보여줍니다.

**인자:**

- `<name>`: hook 이름(예: `session-memory`)

**옵션:**

- `--json`: JSON으로 출력

**예시:**

```bash
openclaw hooks info session-memory
```

**출력:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new

Requirements:
  Config: ✓ workspace.dir
```

## Check Hooks Eligibility

```bash
openclaw hooks check
```

hook eligibility 상태 요약(준비된 hook 수와 미준비 hook 수)을 보여줍니다.

**옵션:**

- `--json`: JSON으로 출력

**예시 출력:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## Enable a Hook

```bash
openclaw hooks enable <name>
```

특정 hook을 config(`~/.openclaw/config.json`)에 추가해 활성화합니다.

**참고:** plugin이 관리하는 hook은 `openclaw hooks list`에 `plugin:<id>`로 표시되며 여기서 enable/disable 할 수 없습니다. 대신 plugin 자체를 enable/disable 해야 합니다.

**인자:**

- `<name>`: hook 이름(예: `session-memory`)

**예시:**

```bash
openclaw hooks enable session-memory
```

**출력:**

```
✓ Enabled hook: 💾 session-memory
```

**동작:**

- hook 존재 여부와 eligibility를 확인
- config의 `hooks.internal.entries.<name>.enabled = true` 갱신
- config를 디스크에 저장

**활성화 후:**

- hook이 다시 로드되도록 gateway를 재시작하세요(macOS에서는 menu bar app 재시작, dev 환경에서는 gateway process 재시작).

## Disable a Hook

```bash
openclaw hooks disable <name>
```

config를 갱신해 특정 hook을 비활성화합니다.

**인자:**

- `<name>`: hook 이름(예: `command-logger`)

**예시:**

```bash
openclaw hooks disable command-logger
```

**출력:**

```
⏸ Disabled hook: 📝 command-logger
```

**비활성화 후:**

- hook이 다시 로드되도록 gateway를 재시작하세요.

## Install Hooks

```bash
openclaw hooks install <path-or-spec>
openclaw hooks install <npm-spec> --pin
```

로컬 폴더/아카이브 또는 npm에서 hook pack을 설치합니다.

npm spec은 **registry 전용**입니다. package name + 선택적 **정확한 version** 또는 **dist-tag**만 허용합니다. Git/URL/file spec과 semver range는 거부됩니다. 의존성 설치는 안전을 위해 `--ignore-scripts`로 실행됩니다.

bare spec과 `@latest`는 stable track을 유지합니다. npm이 이 둘을 prerelease로 해석하면, OpenClaw는 명시적 prerelease opt-in(`@beta`/`@rc` 또는 정확한 prerelease version)을 요구하며 중단합니다.

**동작:**

- hook pack을 `~/.openclaw/hooks/<id>`로 복사
- 설치된 hook을 `hooks.internal.entries.*`에 활성화
- 설치 기록을 `hooks.internal.installs`에 저장

**옵션:**

- `-l, --link`: 로컬 디렉터리를 복사하지 않고 링크( `hooks.internal.load.extraDirs`에 추가)
- `--pin`: npm 설치를 정확한 해석 결과 `name@version`으로 `hooks.internal.installs`에 기록

**지원 아카이브:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**예시:**

```bash
# 로컬 디렉터리
openclaw hooks install ./my-hook-pack

# 로컬 아카이브
openclaw hooks install ./my-hook-pack.zip

# NPM 패키지
openclaw hooks install @openclaw/my-hook-pack

# 복사하지 않고 로컬 디렉터리 링크
openclaw hooks install -l ./my-hook-pack
```

## Update Hooks

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

설치된 hook pack(npm 설치만 해당)을 업데이트합니다.

**옵션:**

- `--all`: 추적 중인 모든 hook pack 업데이트
- `--dry-run`: 쓰지 않고 변경 예정 내용만 표시

저장된 integrity hash가 있고, 새로 가져온 artifact hash가 달라졌다면 OpenClaw는 경고를 출력하고 진행 확인을 요구합니다. CI/non-interactive 환경에서는 전역 `--yes`로 프롬프트를 건너뛸 수 있습니다.

## Bundled Hooks

### session-memory

`/new`를 실행할 때 session context를 memory에 저장합니다.

**Enable:**

```bash
openclaw hooks enable session-memory
```
