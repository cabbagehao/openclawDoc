---
title: "스킬"
description: "OpenClaw 스킬의 로드 위치, 우선순위, 게이팅, 환경 주입, ClawHub 연동 방식을 설명합니다."
summary: "스킬: 관리형 vs 워크스페이스, 게이팅 규칙, config/env 연결 방식"
read_when:
  - 스킬을 추가하거나 수정할 때
  - 스킬 게이팅 또는 로드 규칙을 변경할 때
x-i18n:
  source_path: "tools/skills.md"
---

# 스킬 (OpenClaw)

OpenClaw는 도구 사용 방법을 에이전트에 가르치기 위해 **[AgentSkills](https://agentskills.io) 호환** 스킬 폴더를 사용합니다. 각 스킬은 YAML frontmatter와 지침이 들어 있는 `SKILL.md`를 포함한 디렉터리입니다. OpenClaw는 **번들 스킬**과 선택적 로컬 오버라이드를 함께 로드하고, 환경, 설정, 바이너리 존재 여부를 기준으로 로드 시점에 필터링합니다.

## 위치와 우선순위

스킬은 **세 곳**에서 로드됩니다.

1. **번들 스킬**: 설치물(npm 패키지 또는 OpenClaw.app)에 포함되어 제공됨
2. **관리형/로컬 스킬**: `~/.openclaw/skills`
3. **워크스페이스 스킬**: `<workspace>/skills`

스킬 이름이 충돌하면 우선순위는 다음과 같습니다.

`<workspace>/skills` (가장 높음) → `~/.openclaw/skills` → 번들 스킬 (가장 낮음)

또한 `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 추가 스킬 폴더를 설정할 수 있습니다(가장 낮은 우선순위).

## 에이전트별 스킬과 공유 스킬

**멀티 에이전트** 구성에서는 각 에이전트가 자체 워크스페이스를 가집니다. 즉 다음과 같습니다.

- **에이전트별 스킬**은 해당 에이전트 전용 `<workspace>/skills`에 있습니다.
- **공유 스킬**은 `~/.openclaw/skills`(관리형/로컬)에 있으며 같은 머신의 **모든 에이전트**에게 보입니다.
- **공유 폴더**도 `skills.load.extraDirs`(가장 낮은 우선순위)를 통해 추가할 수 있으며, 여러 에이전트가 공통으로 쓰는 스킬 팩을 구성할 때 유용합니다.

같은 스킬 이름이 여러 위치에 있으면 일반 우선순위가 적용됩니다. 즉 workspace가 우선이고, 그다음 관리형/로컬, 마지막이 번들입니다.

## 플러그인 + 스킬

플러그인은 `openclaw.plugin.json`에 `skills` 디렉터리(플러그인 루트를 기준으로 한 상대 경로)를 나열해서 자체 스킬을 제공할 수 있습니다. 플러그인 스킬은 플러그인이 활성화되면 로드되며, 일반 스킬 우선순위 규칙에 참여합니다. 플러그인 설정 항목의 `metadata.openclaw.requires.config`를 사용해 게이팅할 수 있습니다. 검색/설정은 [Plugins](/tools/plugin), 그 스킬이 설명하는 도구 표면은 [Tools](/tools)를 참고하세요.

## ClawHub (설치 + 동기화)

ClawHub는 OpenClaw용 공개 스킬 레지스트리입니다. [https://clawhub.com](https://clawhub.com)에서 둘러볼 수 있습니다. 스킬을 검색, 설치, 업데이트, 백업하는 데 사용합니다.
전체 가이드는 [ClawHub](/tools/clawhub)를 참고하세요.

일반적인 흐름:

- 워크스페이스에 스킬 설치:
  - `clawhub install <skill-slug>`
- 설치된 모든 스킬 업데이트:
  - `clawhub update --all`
- 동기화(스캔 + 업데이트 게시):
  - `clawhub sync --all`

기본적으로 `clawhub`는 현재 작업 디렉터리 아래의 `./skills`에 설치합니다(또는 설정된 OpenClaw 워크스페이스로 폴백합니다). OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 인식합니다.

## 보안 참고 사항

- 서드파티 스킬은 **신뢰할 수 없는 코드**로 취급하세요. 활성화하기 전에 읽어보세요.
- 신뢰할 수 없는 입력과 위험한 도구에는 샌드박스 실행을 우선하세요. [Sandboxing](/gateway/sandboxing)을 참고하세요.
- 워크스페이스 및 extra-dir 스킬 검색은 해석된 realpath가 설정된 루트 내부에 머무르는 skill root와 `SKILL.md` 파일만 허용합니다.
- `skills.entries.*.env`와 `skills.entries.*.apiKey`는 해당 에이전트 턴 동안 비밀 값을 **호스트** 프로세스에 주입합니다(샌드박스가 아님). 비밀 값이 프롬프트나 로그에 들어가지 않도록 하세요.
- 더 넓은 범위의 위협 모델과 체크리스트는 [Security](/gateway/security)를 참고하세요.

## 형식 (AgentSkills + Pi 호환)

`SKILL.md`에는 최소한 다음이 포함되어야 합니다.

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
---
```

참고:

- 레이아웃/의도는 AgentSkills 사양을 따릅니다.
- 임베디드 에이전트가 사용하는 파서는 frontmatter 키에서 **한 줄짜리** 값만 지원합니다.
- `metadata`는 **한 줄짜리 JSON 객체**여야 합니다.
- 지침 안에서 `{baseDir}`를 사용하면 스킬 폴더 경로를 참조할 수 있습니다.
- 선택적 frontmatter 키:
  - `homepage` — macOS Skills UI에서 “Website”로 표시되는 URL(`metadata.openclaw.homepage`로도 지원됨)
  - `user-invocable` — `true|false`(기본값: `true`). `true`이면 이 스킬은 사용자 슬래시 명령으로 노출됩니다.
  - `disable-model-invocation` — `true|false`(기본값: `false`). `true`이면 모델 프롬프트에서는 제외되지만 사용자 호출은 계속 가능합니다.
  - `command-dispatch` — `tool`(선택 사항). `tool`로 설정하면 슬래시 명령이 모델을 우회하고 도구로 직접 디스패치됩니다.
  - `command-tool` — `command-dispatch: tool`이 설정됐을 때 호출할 도구 이름.
  - `command-arg-mode` — `raw`(기본값). 도구 디스패치 시 원시 인자 문자열을 도구에 그대로 전달합니다(core 파싱 없음).

    이 경우 도구는 다음 params로 호출됩니다.
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## 게이팅(로드 시 필터)

OpenClaw는 `metadata`(한 줄짜리 JSON)를 사용해 **로드 시점에 스킬을 필터링**합니다.

```markdown
---
name: nano-banana-pro
description: Generate or edit images via Gemini 3 Pro Image
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

`metadata.openclaw` 아래의 필드:

- `always: true` — 항상 스킬을 포함합니다(다른 게이트는 건너뜀).
- `emoji` — macOS Skills UI에서 사용하는 선택적 이모지.
- `homepage` — macOS Skills UI에서 “Website”로 표시되는 선택적 URL.
- `os` — 선택적 플랫폼 목록(`darwin`, `linux`, `win32`). 설정하면 해당 OS에서만 스킬을 사용할 수 있습니다.
- `requires.bins` — 목록; 각 항목이 `PATH`에 있어야 합니다.
- `requires.anyBins` — 목록; 최소 하나가 `PATH`에 있어야 합니다.
- `requires.env` — 목록; 환경 변수가 존재해야 하며, 설정에서 제공된 경우도 인정됩니다.
- `requires.config` — truthy여야 하는 `openclaw.json` 경로 목록.
- `primaryEnv` — `skills.entries.<name>.apiKey`와 연결되는 환경 변수 이름.
- `install` — macOS Skills UI에서 사용하는 설치 스펙 배열(brew/node/go/uv/download), 선택 사항.

샌드박싱 관련 참고:

- `requires.bins`는 스킬 로드 시점에 **호스트**에서 검사됩니다.
- 에이전트가 샌드박스 안에서 실행된다면, 해당 바이너리는 **컨테이너 내부에도** 있어야 합니다.
  `agents.defaults.sandbox.docker.setupCommand`(또는 커스텀 이미지)로 설치하세요.
  `setupCommand`는 컨테이너가 생성된 뒤 한 번 실행됩니다.
  패키지 설치에는 네트워크 egress, 쓰기 가능한 루트 파일시스템, 그리고 샌드박스 안의 root 사용자도 필요합니다.
  예를 들어 `summarize` 스킬(`skills/summarize/SKILL.md`)은 샌드박스 컨테이너 안에 `summarize` CLI가 있어야 그 안에서 실행할 수 있습니다.

설치기 예시:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

참고:

- 설치기가 여러 개면 gateway는 **하나의** 선호 옵션만 선택합니다(brew가 가능하면 brew, 아니면 node).
- 모든 설치기가 `download`이면 OpenClaw는 각 항목을 모두 나열해 사용 가능한 아티팩트를 볼 수 있게 합니다.
- 설치 스펙에는 `os: ["darwin"|"linux"|"win32"]`를 포함해서 플랫폼별 옵션을 필터링할 수 있습니다.
- Node 설치는 `openclaw.json`의 `skills.install.nodeManager`를 따릅니다(기본값: npm, 옵션: npm/pnpm/yarn/bun).
  이것은 **스킬 설치**에만 영향을 줍니다. Gateway 런타임은 여전히 Node여야 합니다
  (Bun은 WhatsApp/Telegram에는 권장되지 않습니다).
- Go 설치: `go`가 없고 `brew`를 사용할 수 있으면 gateway는 먼저 Homebrew로 Go를 설치하고, 가능하면 `GOBIN`을 Homebrew의 `bin`으로 설정합니다.
- Download 설치: `url`(필수), `archive`(`tar.gz` | `tar.bz2` | `zip`), `extract`(기본값: 아카이브가 감지되면 자동), `stripComponents`, `targetDir`(기본값: `~/.openclaw/tools/<skillKey>`).

`metadata.openclaw`가 없으면 해당 스킬은 항상 사용 가능 대상으로 간주됩니다(설정에서 비활성화됐거나 번들 스킬에 대해 `skills.allowBundled`로 차단된 경우는 제외).

## 설정 오버라이드 (`~/.openclaw/openclaw.json`)

번들/관리형 스킬은 켜고 끌 수 있으며 env 값도 제공할 수 있습니다.

```json5
{
  skills: {
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

참고: 스킬 이름에 하이픈이 들어가면 키를 따옴표로 감싸세요(JSON5는 따옴표가 있는 키를 허용합니다).

설정 키는 기본적으로 **스킬 이름**과 일치합니다. 스킬이 `metadata.openclaw.skillKey`를 정의하면 `skills.entries` 아래에서는 그 키를 사용하세요.

규칙:

- `enabled: false`는 번들/설치 여부와 무관하게 스킬을 비활성화합니다.
- `env`: 해당 변수가 프로세스에 아직 설정되지 않았을 때에만 주입됩니다.
- `apiKey`: `metadata.openclaw.primaryEnv`를 선언한 스킬을 위한 편의 기능입니다.
  평문 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.
- `config`: 스킬별 커스텀 필드를 담는 선택적 bag입니다. 사용자 정의 키는 반드시 여기에 있어야 합니다.
- `allowBundled`: **번들** 스킬에만 적용되는 선택적 허용 목록입니다. 설정하면 목록에 있는 번들 스킬만 사용할 수 있습니다(관리형/워크스페이스 스킬은 영향 없음).

## 환경 주입(에이전트 실행별)

에이전트 실행이 시작되면 OpenClaw는 다음을 수행합니다.

1. 스킬 메타데이터를 읽습니다.
2. `skills.entries.<key>.env` 또는 `skills.entries.<key>.apiKey`를 `process.env`에 적용합니다.
3. **사용 가능한** 스킬로 시스템 프롬프트를 구성합니다.
4. 실행이 끝나면 원래 환경을 복원합니다.

이는 전역 셸 환경이 아니라 **에이전트 실행 범위로 제한**됩니다.

## 세션 스냅샷(성능)

OpenClaw는 세션이 시작될 때 사용 가능한 스킬을 스냅샷으로 저장하고, 같은 세션의 이후 턴에서는 그 목록을 재사용합니다. 스킬이나 설정 변경 사항은 다음 새 세션에서 적용됩니다.

스킬 watcher가 활성화되어 있거나 새로 사용 가능한 원격 노드가 나타나면 세션 중간에도 스킬이 새로고침될 수 있습니다(아래 참고). 이를 **hot reload**처럼 생각하면 됩니다. 새로고침된 목록은 다음 에이전트 턴부터 반영됩니다.

## 원격 macOS 노드(Linux gateway)

Gateway가 Linux에서 실행 중이지만 **macOS 노드**가 연결되어 있고 **`system.run`이 허용**된 경우(Exec approvals security가 `deny`로 설정되지 않음), OpenClaw는 필요한 바이너리가 해당 노드에 있을 때 macOS 전용 스킬도 사용 가능 대상으로 취급할 수 있습니다. 에이전트는 보통 `nodes.run`을 포함한 `nodes` 도구를 통해 그런 스킬을 실행해야 합니다.

이 기능은 노드가 명령 지원 정보를 보고하고, `system.run`을 통한 bin probe가 가능하다는 전제에 의존합니다. 나중에 macOS 노드가 오프라인이 되어도 스킬은 계속 표시될 수 있으며, 노드가 다시 연결될 때까지 호출은 실패할 수 있습니다.

## 스킬 watcher(자동 새로고침)

기본적으로 OpenClaw는 스킬 폴더를 감시하며 `SKILL.md` 파일이 바뀌면 스킬 스냅샷을 갱신합니다. 이는 `skills.load` 아래에서 설정합니다.

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## 토큰 영향(스킬 목록)

스킬을 사용할 수 있으면 OpenClaw는 사용 가능한 스킬의 축약된 XML 목록을 시스템 프롬프트에 주입합니다(`pi-coding-agent`의 `formatSkillsForPrompt`를 통해). 비용은 결정적입니다.

- **기본 오버헤드(스킬이 1개 이상일 때만):** 195자
- **스킬당:** 97자 + XML 이스케이프된 `<name>`, `<description>`, `<location>` 값의 길이

공식(문자 수):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

참고:

- XML 이스케이프는 `& < > " '`를 엔터티(`&amp;`, `&lt;` 등)로 확장하므로 길이가 늘어납니다.
- 토큰 수는 모델 토크나이저에 따라 달라집니다. OpenAI 스타일로 대략 추정하면 약 4자/토큰이므로 **97자 ≈ 24토큰**에 실제 필드 길이가 추가됩니다.

## 관리형 스킬 수명주기

OpenClaw는 설치물(npm 패키지 또는 OpenClaw.app)의 일부로 기본 스킬 세트를 **번들 스킬** 형태로 제공합니다. `~/.openclaw/skills`는 로컬 오버라이드를 위해 존재합니다(예: 번들 사본을 바꾸지 않고 특정 스킬을 고정하거나 패치하기). 워크스페이스 스킬은 사용자 소유이며 이름이 충돌할 때 관리형/로컬과 번들 스킬보다 우선합니다.

## 설정 참조

전체 설정 스키마는 [Skills config](/tools/skills-config)를 참고하세요.

## 더 많은 스킬을 찾고 있나요?

[https://clawhub.com](https://clawhub.com)에서 둘러보세요.

---
