---
summary: "스킬 설정 스키마와 예시"
description: "`skills` 설정 스키마, bundled allowlist, install/load 동작, sandbox 환경 변수 처리 규칙을 설명합니다."
read_when:
  - "스킬 설정을 추가하거나 수정할 때"
  - "bundled allowlist 또는 설치 동작을 조정할 때"
title: "Skills Config"
x-i18n:
  source_path: "tools/skills-config.md"
---

# 스킬 설정

모든 스킬 관련 설정은 `~/.openclaw/openclaw.json`의 `skills` 아래에 있습니다.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

## 필드

- `allowBundled`: **bundled** skills에만 적용되는 선택적 allowlist입니다. 설정하면 목록에 있는 bundled skills만 대상이 됩니다. managed/workspace skills는 영향받지 않습니다.
- `load.extraDirs`: 추가로 스캔할 skill directories입니다. 우선순위는 가장 낮습니다.
- `load.watch`: skill folders를 감시하고 skills snapshot을 새로 고칩니다. 기본값은 true입니다.
- `load.watchDebounceMs`: skill watcher events에 대한 debounce 시간(밀리초)입니다. 기본값은 250입니다.
- `install.preferBrew`: 가능한 경우 brew installers를 우선 사용합니다. 기본값은 true입니다.
- `install.nodeManager`: node installer preference입니다(`npm` | `pnpm` | `yarn` | `bun`, 기본값: npm).
  이 설정은 **skill installs**에만 영향을 주며, Gateway runtime은 여전히 Node를 사용해야 합니다. WhatsApp/Telegram에서는 Bun을 권장하지 않습니다.
- `entries.<skillKey>`: 스킬별 재정의 설정입니다.

Per-skill fields:

- `enabled`: skill이 bundled/installed 상태여도 `false`로 설정하면 비활성화합니다.
- `env`: agent run에 주입되는 environment variables입니다. 이미 설정된 값은 덮어쓰지 않습니다.
- `apiKey`: 기본 env var를 선언하는 skills를 위한 선택적 편의 설정입니다.
  plaintext string 또는 SecretRef object(`{ source, provider, id }`)를 지원합니다.

## 참고

- `entries` 아래의 key는 기본적으로 skill name에 매핑됩니다. skill이 `metadata.openclaw.skillKey`를 정의하면 그 key를 대신 사용합니다.
- watcher가 활성화되어 있으면 skill 변경 사항은 다음 agent turn에서 반영됩니다.

### 샌드박스된 스킬 + 환경 변수

세션이 **sandboxed** 상태이면 skill processes는 Docker 안에서 실행됩니다. sandbox는 호스트 `process.env`를 **상속하지 않습니다**.

다음 중 하나를 사용하세요:

- `agents.defaults.sandbox.docker.env`(또는 에이전트별 `agents.list[].sandbox.docker.env`)
- custom sandbox image에 env를 bake

전역 `env`와 `skills.entries.<skill>.env/apiKey`는 **host** 실행에만 적용됩니다.
