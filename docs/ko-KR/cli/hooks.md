---
summary: "에이전트 훅(Hooks) 관리, 설치 및 업데이트를 위한 `openclaw hooks` 명령어 레퍼런스"
read_when:
  - 에이전트 훅을 조회, 활성화 또는 비활성화하고자 할 때
  - 새로운 훅 팩을 설치하거나 최신 버전으로 업데이트해야 할 때
title: "hooks"
x-i18n:
  source_path: "cli/hooks.md"
---

# `openclaw hooks`

에이전트 훅(Agent Hooks)을 관리함. 훅은 `/new`, `/reset` 명령어 발생 시 또는 Gateway 시작 시와 같은 특정 이벤트에 반응하여 실행되는 자동화 스크립트임.

**관련 문서:**
- 훅 개요 및 설정 가이드: [Hooks](/automation/hooks)
- 플러그인 훅 가이드: [Plugins](/tools/plugin#plugin-hooks)

## 전체 훅 목록 조회

```bash
openclaw hooks list
```

워크스페이스, 관리형(Managed) 및 내장(Bundled) 디렉터리에서 감지된 모든 훅을 나열함.

**주요 옵션:**
- **`--eligible`**: 실행 요구 사항을 충족하는 훅만 표시.
- **`--json`**: 결과를 JSON 형식으로 출력.
- **`-v, --verbose`**: 미충족 요구 사항을 포함한 상세 정보 표시.

## 훅 상세 정보 조회

```bash
openclaw hooks info <name>
```

특정 훅의 소스 위치, 핸들러 경로, 트리거 이벤트 및 요구 사항 정보를 확인함.

**인자:**
- **`<name>`**: 조회할 훅의 이름 (예: `session-memory`).

## 훅 준비 상태 점검

```bash
openclaw hooks check
```

현재 시스템에서 사용 가능한 훅과 설정 오류 등으로 인해 준비되지 않은 훅의 수량을 요약하여 표시함.

## 훅 활성화 (Enable)

```bash
openclaw hooks enable <name>
```

지정된 훅을 설정 파일(`~/.openclaw/openclaw.json`)에 등록하고 활성화함.

<Note>
플러그인에 의해 관리되는 훅(`plugin:<id>`)은 여기서 직접 활성화/비활성화할 수 없음. 해당 플러그인을 활성화하거나 비활성화해야 함.
</Note>

**수행 작업:**
- 훅의 존재 여부 및 요구 사항 충족 여부 확인.
- 설정 파일의 `hooks.internal.entries.<name>.enabled` 값을 `true`로 업데이트.
- 설정을 디스크에 저장.

**활성화 이후**: 변경 사항을 적용하려면 **Gateway 서버를 재시작**해야 함.

## 훅 비활성화 (Disable)

```bash
openclaw hooks disable <name>
```

설정 파일을 업데이트하여 특정 훅의 실행을 중단함.

## 훅 설치 (Install)

```bash
openclaw hooks install <path-or-spec>
openclaw hooks install <npm-spec> --pin
```

로컬 폴더, 압축 파일(`.zip`, `.tar.gz` 등) 또는 npm 패키지로부터 훅 팩(Hook Pack)을 설치함.

**보안 및 규칙:**
- **npm 설치**: 패키지 이름과 정확한 버전 또는 태그만 허용하며, 보안을 위해 `--ignore-scripts` 옵션으로 실행됨.
- **복사 및 기록**: 설치된 팩은 `~/.openclaw/hooks/<id>` 경로로 복사되며, 설치 이력은 설정 파일에 기록됨.

**주요 옵션:**
- **`-l, --link`**: 파일을 복사하지 않고 로컬 디렉터리를 심볼릭 링크로 연결함.
- **`--pin`**: npm 설치 시 현재 해석된 정확한 버전을 고정하여 기록함.

## 훅 업데이트 (Update)

```bash
openclaw hooks update <id>
openclaw hooks update --all
```

설치된 훅 팩(주로 npm 기반)을 최신 버전으로 업데이트함. `--dry-run` 옵션을 사용하여 실제 변경 전 내역을 미리 확인할 수 있음.

---

## 주요 내장 훅 (Bundled Hooks)

### `session-memory`
`/new` 명령어 실행 시 현재 세션의 맥락을 워크스페이스의 일일 기억 파일(`memory/YYYY-MM-DD-slug.md`)에 자동으로 저장함.

### `bootstrap-extra-files`
에이전트 부트스트랩 단계에서 추가적인 워크스페이스 지침 파일(예: 모노레포 전용 `AGENTS.md`)을 동적으로 주입함.

### `command-logger`
발생하는 모든 명령어 이벤트를 중앙 로그 파일(`~/.openclaw/logs/commands.log`)에 기록함. 감사(Audit) 목적으로 활용 가능함.

### `boot-md`
Gateway 서버가 시작될 때 워크스페이스 루트의 `BOOT.md` 파일을 읽어 지정된 작업을 자동으로 수행함.
