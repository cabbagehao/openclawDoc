---
summary: "OpenClaw가 환경 변수를 어디에서 불러오고 어떤 우선순위로 적용하는지"
read_when:
  - 어떤 환경 변수가 어떤 순서로 로드되는지 알아야 할 때
  - Gateway에서 누락된 API 키를 디버깅할 때
  - provider 인증이나 배포 환경을 문서화할 때
title: "환경 변수"
x-i18n:
  source_path: "help/environment.md"
---

# 환경 변수

OpenClaw는 여러 소스에서 환경 변수를 가져옵니다. 규칙은 **기존 값을 절대 덮어쓰지 않는다**입니다.

## 우선순위(높음 → 낮음)

1. **프로세스 환경 변수**: Gateway 프로세스가 이미 부모 셸/daemon으로부터 받은 값
2. **현재 작업 디렉터리의 `.env`**: dotenv 기본 동작, 덮어쓰지 않음
3. `~/.openclaw/.env`의 **전역 `.env`**: 즉 `$OPENCLAW_STATE_DIR/.env`, 덮어쓰지 않음
4. `~/.openclaw/openclaw.json`의 **config `env` 블록**: 값이 없을 때만 적용
5. **선택적 login shell import**: `env.shellEnv.enabled` 또는 `OPENCLAW_LOAD_SHELL_ENV=1`, 예상 키가 빠졌을 때만 적용

config 파일 자체가 없으면 4단계는 건너뜁니다. 셸 import는 활성화되어 있으면 여전히 실행됩니다.

## Config `env` 블록

인라인 환경 변수를 설정하는 두 가지 동등한 방법이 있습니다. 둘 다 덮어쓰지 않습니다.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## 셸 환경 변수 가져오기

`env.shellEnv`는 login shell을 실행하고 **누락된** 예상 키만 가져옵니다.

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

동등한 환경 변수:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## 런타임에 주입되는 환경 변수

OpenClaw는 자식 프로세스를 생성할 때 컨텍스트 표식도 함께 주입합니다.

- `OPENCLAW_SHELL=exec`: `exec` 도구로 실행된 명령에 설정됩니다.
- `OPENCLAW_SHELL=acp`: ACP 런타임 백엔드 프로세스 생성 시 설정됩니다. 예: `acpx`
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client`가 ACP 브리지 프로세스를 생성할 때 설정됩니다.
- `OPENCLAW_SHELL=tui-local`: 로컬 TUI의 `!` 셸 명령에 설정됩니다.

이 값들은 사용자 설정이 아니라 런타임 표식입니다. 셸/프로필 로직에서 컨텍스트별 규칙을 적용할 때 사용할 수 있습니다.

## UI 환경 변수

- `OPENCLAW_THEME=light`: 터미널 배경이 밝을 때 밝은 TUI 팔레트를 강제로 사용합니다.
- `OPENCLAW_THEME=dark`: 어두운 TUI 팔레트를 강제로 사용합니다.
- `COLORFGBG`: 터미널이 이 값을 내보내면 OpenClaw는 배경색 힌트를 사용해 TUI 팔레트를 자동 선택합니다.

## Config에서 환경 변수 치환

config 문자열 값 안에서 `${VAR_NAME}` 문법으로 환경 변수를 직접 참조할 수 있습니다.

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

자세한 내용은 [Configuration: Env var substitution](/gateway/configuration#env-var-substitution-in-config)을 참고하세요.

## Secret ref와 `${ENV}` 문자열

OpenClaw는 환경 변수 기반 패턴 두 가지를 지원합니다.

- config 값에서 `${VAR}` 문자열 치환
- 비밀 참조를 지원하는 필드를 위한 SecretRef 객체: `{ source: "env", provider: "default", id: "VAR" }`

둘 다 활성화 시점에 프로세스 환경 변수에서 해석됩니다. SecretRef 세부 사항은 [Secrets Management](/gateway/secrets)에 문서화되어 있습니다.

## 경로 관련 환경 변수

| Variable               | Purpose                                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | 모든 내부 경로 해석(`~/.openclaw/`, agent 디렉터리, 세션, 자격 증명)에 사용할 홈 디렉터리를 재정의합니다. 전용 서비스 계정으로 OpenClaw를 실행할 때 유용합니다. |
| `OPENCLAW_STATE_DIR`   | 상태 디렉터리를 재정의합니다. 기본값은 `~/.openclaw`입니다.                                                                         |
| `OPENCLAW_CONFIG_PATH` | config 파일 경로를 재정의합니다. 기본값은 `~/.openclaw/openclaw.json`입니다.                                                       |

## 로깅

| Variable             | Purpose                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | 파일과 콘솔 양쪽의 로그 레벨을 재정의합니다. 예: `debug`, `trace`. config의 `logging.level` 및 `logging.consoleLevel`보다 우선합니다. 잘못된 값은 경고 후 무시됩니다. |

### `OPENCLAW_HOME`

설정하면 `OPENCLAW_HOME`이 시스템 홈 디렉터리(`$HOME` / `os.homedir()`)를 대체하여 모든 내부 경로 해석에 사용됩니다. 이를 통해 헤드리스 서비스 계정에 대해 완전한 파일시스템 격리를 구성할 수 있습니다.

**우선순위:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**예시**(macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/kira</string>
</dict>
```

`OPENCLAW_HOME`은 `~/svc` 같은 틸드 경로로도 설정할 수 있으며, 사용 전에 `$HOME`을 기준으로 확장됩니다.

## 관련 문서

- [Gateway configuration](/gateway/configuration)
- [FAQ: env vars and .env loading](/help/faq#env-vars-and-env-loading)
- [Models overview](/concepts/models)
