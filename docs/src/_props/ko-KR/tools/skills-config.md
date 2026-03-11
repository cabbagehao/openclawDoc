---
summary: "스킬 설정 스키마와 예시"
read_when:
  - 스킬 설정을 추가하거나 수정하고 있습니다
  - 번들 allowlist 또는 설치 동작을 조정하고 있습니다
title: "스킬 설정"
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

* `allowBundled`: **번들된** 스킬에만 적용되는 선택적 allowlist입니다. 설정하면
  목록에 있는 번들 스킬만 대상이 됩니다(관리형/워크스페이스 스킬은 영향 없음).
* `load.extraDirs`: 추가로 스캔할 스킬 디렉터리입니다(가장 낮은 우선순위).
* `load.watch`: 스킬 폴더를 감시하고 스킬 스냅샷을 새로 고칩니다(기본값: true).
* `load.watchDebounceMs`: 스킬 감시 이벤트에 대한 디바운스 시간(밀리초)입니다(기본값: 250).
* `install.preferBrew`: 가능한 경우 brew 설치 프로그램을 우선 사용합니다(기본값: true).
* `install.nodeManager`: Node 설치 관리자 선호도입니다(`npm` | `pnpm` | `yarn` | `bun`, 기본값: npm).
  이 설정은 **스킬 설치**에만 영향을 주며, Gateway 런타임은 여전히 Node를 사용해야 합니다
  (WhatsApp/Telegram에서는 Bun을 권장하지 않음).
* `entries.<skillKey>`: 스킬별 재정의 설정입니다.

스킬별 필드:

* `enabled`: 스킬이 번들되었거나 설치되어 있어도 `false`로 설정하면 비활성화합니다.
* `env`: 에이전트 실행에 주입되는 환경 변수입니다(이미 설정된 경우는 제외).
* `apiKey`: 기본 환경 변수를 선언하는 스킬을 위한 선택적 편의 설정입니다.
  일반 텍스트 문자열 또는 SecretRef 객체(`{ source, provider, id }`)를 지원합니다.

## 참고

* `entries` 아래의 키는 기본적으로 스킬 이름에 매핑됩니다. 스킬이
  `metadata.openclaw.skillKey`를 정의한 경우에는 대신 그 키를 사용합니다.
* 감시 기능이 활성화되어 있으면 스킬 변경 사항은 다음 에이전트 턴에서 반영됩니다.

### 샌드박스된 스킬 + 환경 변수

세션이 **샌드박스** 상태이면 스킬 프로세스는 Docker 내부에서 실행됩니다. 샌드박스는
호스트의 `process.env`를 **상속하지 않습니다**.

다음 중 하나를 사용하세요:

* `agents.defaults.sandbox.docker.env`(또는 에이전트별 `agents.list[].sandbox.docker.env`)
* 사용자 정의 샌드박스 이미지에 환경 변수를 bake

전역 `env`와 `skills.entries.<skill>.env/apiKey`는 **호스트** 실행에만 적용됩니다.
