---
summary: "exec 승인, allowlist, 샌드박스 탈출 프롬프트"
read_when:
  - exec 승인 또는 allowlist를 구성할 때
  - macOS 앱에서 exec 승인 UX를 구현할 때
  - sandbox escape 프롬프트와 그 영향을 검토할 때
title: "Exec Approvals"
---

# Exec approvals

Exec approvals는 샌드박스 안의 에이전트가 실제 호스트(`gateway` 또는 `node`)에서 명령을 실행할 수 있게 할 때 사용하는 **companion app / node host 가드레일**입니다. 안전 인터락으로 생각하면 됩니다. 정책, allowlist, 그리고 필요하다면 사용자 승인까지 모두 동의할 때만 명령이 허용됩니다. Exec approvals는 tool policy 및 elevated gating에 **추가로** 적용됩니다. 단, elevated가 `full`이면 승인을 건너뜁니다. 실제 적용 정책은 `tools.exec.*`와 approvals 기본값 중 **더 엄격한 쪽**이며, approvals 필드가 생략되면 `tools.exec` 값이 사용됩니다.

Companion app UI를 **사용할 수 없는 경우**, 프롬프트가 필요한 모든 요청은 **ask fallback**으로 처리됩니다. 기본값은 `deny`입니다.

## 적용 위치

Exec approvals는 실행 호스트 로컬에서 적용됩니다.

* **gateway host** → gateway 머신에서 실행되는 `openclaw` 프로세스
* **node host** → node runner(macOS companion app 또는 headless node host)

신뢰 모델 참고:

* Gateway 인증을 통과한 호출자는 해당 Gateway의 신뢰된 운영자입니다.
* 페어링된 노드는 그 신뢰된 운영자 권한을 node host까지 확장합니다.
* Exec approvals는 실수로 인한 실행 위험을 줄여 주지만, 사용자별 인증 경계는 아닙니다.
* 승인된 node-host 실행은 canonical cwd, 필요한 경우 고정된 실행 파일 경로, interpreter 스타일 스크립트 피연산자까지 포함한 canonical execution context도 함께 바인딩합니다. 승인 이후 실행 전에 바인딩된 스크립트가 바뀌면, 변경된 내용을 실행하지 않고 요청을 거부합니다.

macOS 분리 구조:

* **node host service** 는 로컬 IPC를 통해 `system.run`을 **macOS app**으로 전달합니다.
* **macOS app** 은 UI 컨텍스트에서 승인 판단과 실제 명령 실행을 담당합니다.

## 설정 및 저장 위치

승인 정보는 실행 호스트의 로컬 JSON 파일에 저장됩니다.

`~/.openclaw/exec-approvals.json`

예시 스키마:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 정책 노브

### Security (`exec.security`)

* **deny**: 호스트 exec 요청을 모두 차단합니다.
* **allowlist**: allowlist에 포함된 명령만 허용합니다.
* **full**: 모든 것을 허용합니다. `elevated`와 동일합니다.

### Ask (`exec.ask`)

* **off**: 프롬프트를 띄우지 않습니다.
* **on-miss**: allowlist가 일치하지 않을 때만 프롬프트를 띄웁니다.
* **always**: 모든 명령에 대해 프롬프트를 띄웁니다.

### Ask fallback (`askFallback`)

프롬프트가 필요하지만 UI에 연결할 수 없을 때 사용할 동작입니다.

* **deny**: 차단
* **allowlist**: allowlist가 일치하는 경우에만 허용
* **full**: 허용

## Allowlist(에이전트별)

Allowlist는 **에이전트별**로 관리됩니다. 여러 에이전트가 있으면 macOS 앱에서 편집할 에이전트를 전환하세요. 패턴은 **대소문자를 구분하지 않는 glob 매칭**입니다. 패턴은 **바이너리 경로**로 해석되어야 하며, basename만 적은 항목은 무시됩니다. 레거시 `agents.default` 항목은 로드 시 `agents.main`으로 마이그레이션됩니다.

예시:

* `~/Projects/**/bin/peekaboo`
* `~/.local/bin/*`
* `/opt/homebrew/bin/rg`

각 allowlist 항목은 다음을 추적합니다.

* **id**: UI 식별에 사용하는 안정 UUID(선택)
* **last used**: 마지막 사용 시각
* **last used command**: 마지막으로 사용한 명령
* **last resolved path**: 마지막으로 해석된 경로

## Skill CLI 자동 허용

**Auto-allow skill CLIs**를 켜면, 알려진 skill이 참조하는 실행 파일은 node(macOS node 또는 headless node host)에서 allowlisted 된 것으로 취급됩니다. 이 기능은 Gateway RPC의 `skills.bins`를 사용해 skill bin 목록을 가져옵니다. 엄격하게 수동 allowlist만 쓰고 싶다면 이 기능을 끄세요.

중요한 신뢰 관련 주의점:

* 이것은 수동 경로 allowlist와 별개인 **암묵적 편의 allowlist**입니다.
* Gateway와 node가 같은 신뢰 경계 안에 있는 운영 환경을 전제로 합니다.
* 엄격한 명시적 신뢰가 필요하면 `autoAllowSkills: false`를 유지하고 수동 경로 allowlist만 사용하세요.

## Safe bins(stdin 전용)

`tools.exec.safeBins`는 `jq` 같은 **stdin 전용** 바이너리의 작은 목록을 정의합니다. 이 목록의 바이너리는 allowlist 모드에서도 명시적 allowlist 항목 없이 실행할 수 있습니다. Safe bins는 위치 인수 파일 경로와 경로처럼 보이는 토큰을 거부하므로, 들어오는 스트림만 처리할 수 있습니다. 일반적인 신뢰 목록이 아니라 스트림 필터를 위한 좁은 빠른 경로로 생각하세요.

`python3`, `node`, `ruby`, `bash`, `sh`, `zsh`처럼 인터프리터나 런타임 바이너리를 `safeBins`에 넣지 마세요. 코드 평가, 서브커맨드 실행, 파일 읽기를 설계상 수행할 수 있는 명령이라면 명시적 allowlist 항목을 사용하고 승인 프롬프트를 유지하는 편이 낫습니다.

커스텀 safe bin은 `tools.exec.safeBinProfiles.<bin>` 아래에 명시적 프로필을 정의해야 합니다. 검증은 argv 형태만으로 결정적으로 수행되며, 호스트 파일 시스템 존재 여부는 검사하지 않습니다. 이를 통해 allow/deny 차이로 파일 존재 여부를 추론하는 오라클 동작을 방지합니다.

기본 safe bin에서는 파일 지향 옵션이 거부됩니다. 예를 들면 `sort -o`, `sort --output`, `sort --files0-from`, `sort --compress-program`, `sort --random-source`, `sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`, `grep -f/--file` 등입니다.

또한 safe bins는 stdin 전용 동작을 깨는 옵션에 대해 바이너리별 플래그 정책을 강제합니다. 예를 들어 `sort -o/--output/--compress-program`과 grep의 재귀 플래그가 여기에 해당합니다.

긴 옵션은 safe-bin 모드에서 fail-closed 방식으로 검증됩니다. 알 수 없는 플래그와 모호한 축약형은 거부됩니다.

safe-bin 프로필별 거부 플래그:

{/_SAFE_BIN_DENIED_FLAGS:START _/}

* `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
* `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
* `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
* `wc`: `--files0-from`
  {/_SAFE_BIN_DENIED_FLAGS:END _/}

Safe bins는 실행 시 argv 토큰을 **리터럴 텍스트**로 처리하도록 강제합니다. 따라서 stdin-only 세그먼트에서는 glob 확장이나 `$VARS` 확장이 일어나지 않습니다. `*` 또는 `$HOME/...` 같은 패턴으로 파일 읽기를 우회할 수 없습니다.

또한 safe bins는 신뢰된 바이너리 디렉터리에서 해석되어야 합니다. 기본 시스템 디렉터리와 선택적 `tools.exec.safeBinTrustedDirs`만 허용되며 `PATH` 엔트리는 자동 신뢰되지 않습니다. 기본 trusted safe-bin 디렉터리는 매우 보수적입니다. `/bin`, `/usr/bin`만 포함됩니다.

`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`처럼 패키지 매니저 또는 사용자 경로에 safe-bin 실행 파일이 있다면 `tools.exec.safeBinTrustedDirs`에 명시적으로 추가하세요.

쉘 체이닝과 리다이렉션은 allowlist 모드에서 자동 허용되지 않습니다.

쉘 체이닝(`&&`, `||`, `;`)은 각 최상위 세그먼트가 allowlist를 만족할 때만 허용됩니다. safe bins와 skill auto-allow도 여기에 포함됩니다. 리다이렉션은 allowlist 모드에서 여전히 지원되지 않습니다. 명령 치환(`$()` 또는 backticks)은 allowlist 파싱 단계에서 거부되며, 이 검사는 큰따옴표 안에서도 적용됩니다. 문자 그대로 `$()`가 필요하면 작은따옴표를 사용하세요.

macOS companion-app approvals에서는 원시 쉘 텍스트에 `&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)` 같은 쉘 제어 또는 확장 구문이 포함되면, 쉘 바이너리 자체가 allowlist에 없을 경우 allowlist miss로 처리됩니다.

쉘 래퍼(`bash|sh|zsh ... -c/-lc`)에서는 요청 범위 env override가 작은 명시적 allowlist로 축소됩니다. 허용되는 값은 `TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`입니다.

Allow-always 결정을 allowlist 모드에서 저장할 때는 알려진 dispatch wrapper(`env`, `nice`, `nohup`, `stdbuf`, `timeout`)의 경우 wrapper 경로가 아니라 내부 실행 파일 경로를 저장합니다. Shell multiplexer(`busybox`, `toybox`)도 shell applet(`sh`, `ash` 등)에서는 같은 방식으로 풀어서 실제 내부 실행 파일 경로를 저장합니다. wrapper 또는 multiplexer를 안전하게 해석할 수 없으면 allowlist 항목은 자동 저장되지 않습니다.

기본 safe bins: `jq`, `cut`, `uniq`, `head`, `tail`, `tr`, `wc`

`grep`과 `sort`는 기본 목록에 포함되지 않습니다. 이들을 opt-in 하더라도 파일 작업이 포함된 일반적인 워크플로에는 명시적 allowlist 항목을 유지하세요.

`grep`을 safe-bin 모드로 사용할 때는 `-e` 또는 `--regexp`로 패턴을 전달해야 합니다. 위치 인수 형태의 패턴은 허용되지 않으므로 파일 피연산자를 모호한 위치 인수로 숨겨 넣을 수 없습니다.

### Safe bins와 allowlist 비교

| 주제        | `tools.exec.safeBins`               | Allowlist (`exec-approvals.json`)    |
| --------- | ----------------------------------- | ------------------------------------ |
| 목적        | 제한된 stdin 필터를 자동 허용                 | 특정 실행 파일을 명시적으로 신뢰                   |
| 매치 방식     | 실행 파일 이름 + safe-bin argv 정책         | 해석된 실행 파일 경로 glob 패턴                 |
| 인수 범위     | safe-bin 프로필과 literal-token 규칙으로 제한 | 경로 일치만 검사하며, 인수 책임은 사용자가 짐           |
| 전형적 예시    | `jq`, `head`, `tail`, `wc`          | `python3`, `node`, `ffmpeg`, 커스텀 CLI |
| 가장 적합한 용도 | 파이프라인 안의 저위험 텍스트 변환                 | 더 넓은 동작 범위나 부작용이 있는 모든 도구            |

구성 위치:

* `safeBins`는 config(`tools.exec.safeBins` 또는 에이전트별 `agents.list[].tools.exec.safeBins`)에서 가져옵니다.
* `safeBinTrustedDirs`는 config(`tools.exec.safeBinTrustedDirs` 또는 에이전트별 `agents.list[].tools.exec.safeBinTrustedDirs`)에서 가져옵니다.
* `safeBinProfiles`는 config(`tools.exec.safeBinProfiles` 또는 에이전트별 `agents.list[].tools.exec.safeBinProfiles`)에서 가져옵니다. 에이전트별 프로필 키가 전역 키보다 우선합니다.
* allowlist 항목은 호스트 로컬 `~/.openclaw/exec-approvals.json`의 `agents.<id>.allowlist` 아래에 저장됩니다. Control UI나 `openclaw approvals allowlist ...`로도 편집할 수 있습니다.
* `openclaw security audit`는 인터프리터/런타임 바이너리가 명시적 프로필 없이 `safeBins`에 들어 있으면 `tools.exec.safe_bins_interpreter_unprofiled` 경고를 냅니다.
* `openclaw doctor --fix`는 누락된 커스텀 `safeBinProfiles.<bin>` 항목을 `{}` 형태로 스캐폴딩할 수 있습니다. 이후 직접 검토하고 더 엄격하게 조정하세요. 인터프리터/런타임 바이너리는 자동 스캐폴딩 대상이 아닙니다.

커스텀 프로필 예시:

```json5
{
  tools: {
    exec: {
      safeBins: ["jq", "myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Control UI에서 편집

**Control UI → Nodes → Exec approvals** 카드에서 기본값, 에이전트별 override, allowlist를 편집할 수 있습니다. 범위(Defaults 또는 특정 agent)를 고른 뒤 정책을 조정하고 allowlist 패턴을 추가/삭제한 다음 **Save**를 누르세요. UI에는 패턴별 **last used** 메타데이터가 표시되므로 목록을 깔끔하게 유지하기 좋습니다.

대상 선택기에서는 **Gateway**(로컬 approvals) 또는 **Node**를 고를 수 있습니다. Node는 `system.execApprovals.get/set`을 광고해야 합니다. macOS app 또는 headless node host가 해당됩니다. 어떤 node가 아직 exec approvals를 광고하지 않으면 로컬 `~/.openclaw/exec-approvals.json`을 직접 편집하세요.

CLI: `openclaw approvals`는 gateway와 node 양쪽 편집을 지원합니다. 자세한 내용은 [Approvals CLI](/cli/approvals)를 참고하세요.

## 승인 흐름

프롬프트가 필요하면 gateway는 `exec.approval.requested`를 운영자 클라이언트에 브로드캐스트합니다. Control UI와 macOS app은 `exec.approval.resolve`로 이를 처리하고, gateway는 승인된 요청을 node host로 전달합니다.

`host=node`인 경우 승인 요청에는 canonical `systemRunPlan` 페이로드가 포함됩니다. gateway는 승인된 `system.run` 요청을 node host로 전달할 때 이 plan을 명령, cwd, 세션 컨텍스트의 기준으로 사용합니다.

승인이 필요하면 exec tool은 승인 id를 즉시 반환합니다. 이후의 시스템 이벤트(`Exec finished`, `Exec denied`)와 연관시키려면 이 id를 사용하세요. 결정이 시간 제한 안에 도착하지 않으면 approval timeout으로 처리되며 거부 사유로 노출됩니다.

확인 대화상자에는 다음이 포함됩니다.

* command + args
* cwd
* agent id
* resolved executable path
* host + policy metadata

동작:

* **Allow once** → 지금 한 번 실행
* **Always allow** → allowlist에 추가하고 실행
* **Deny** → 차단

## 채팅 채널로 승인 전달

Exec 승인 프롬프트는 모든 채팅 채널(plugin 채널 포함)로 전달할 수 있고 `/approve`로 승인할 수 있습니다. 일반 outbound delivery pipeline을 그대로 사용합니다.

설정:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

채팅에서 응답:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

### macOS IPC 흐름

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + approvals + system.run)
```

보안 참고:

* Unix 소켓 모드 `0600`, 토큰은 `exec-approvals.json`에 저장
* 동일 UID 피어 확인
* challenge/response(논스 + HMAC 토큰 + 요청 해시) + 짧은 TTL

## 시스템 이벤트

Exec 수명 주기는 시스템 메시지로 노출됩니다.

* `Exec running`(명령이 running notice threshold를 초과할 때만)
* `Exec finished`
* `Exec denied`

이 메시지들은 node가 이벤트를 보고한 뒤 에이전트 세션에 게시됩니다. Gateway-host exec approvals도 명령이 끝나면 같은 수명 주기 이벤트를 내보내며, 임계값을 넘겨 오래 실행되면 running 이벤트도 선택적으로 보냅니다. 승인 게이트가 있는 exec에서는 approval id를 이 메시지의 `runId`로 재사용하므로 쉽게 상호 연관시킬 수 있습니다.

## 의미와 영향

* **full**은 강력하므로 가능하면 allowlist를 우선하세요.
* **ask**는 빠른 승인 흐름을 유지하면서도 사용자가 개입할 수 있게 합니다.
* 에이전트별 allowlist를 쓰면 한 에이전트의 승인이 다른 에이전트로 새지 않습니다.
* 승인은 **인증된 발신자**의 호스트 exec 요청에만 적용됩니다. 인증되지 않은 발신자는 `/exec`를 실행할 수 없습니다.
* `/exec security=full`은 인증된 운영자를 위한 세션 수준 편의 기능이며 설계상 approvals를 건너뜁니다.
  호스트 exec를 강제로 막고 싶다면 approvals security를 `deny`로 두거나 tool policy에서 `exec` tool을 거부하세요.

관련 문서:

* [Exec tool](/tools/exec)
* [Elevated mode](/tools/elevated)
* [Skills](/tools/skills)
