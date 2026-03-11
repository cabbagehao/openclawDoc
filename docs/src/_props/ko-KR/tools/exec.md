---
summary: "Exec tool 사용법, stdin mode, TTY 지원"
read_when:
  - exec tool을 사용하거나 수정할 때
  - stdin 또는 TTY 동작을 디버깅할 때
title: "Exec Tool"
---

# Exec tool

workspace에서 shell command를 실행합니다. `process`를 통한 foreground + background 실행을 지원합니다.
`process`가 허용되지 않으면 `exec`는 동기식으로 실행되며 `yieldMs`/`background`를 무시합니다.
background session은 agent별 scope를 가지며, `process`는 같은 agent의 session만 볼 수 있습니다.

## Parameters

* `command` (required)
* `workdir` (기본값 cwd)
* `env` (key/value override)
* `yieldMs` (기본값 10000): 지연 후 자동 background 전환
* `background` (bool): 즉시 background 전환
* `timeout` (초, 기본값 1800): 만료 시 kill
* `pty` (bool): 가능하면 pseudo-terminal에서 실행(TTY-only CLI, coding agent, terminal UI)
* `host` (`sandbox | gateway | node`): 실행 위치
* `security` (`deny | allowlist | full`): `gateway`/`node`용 enforcement mode
* `ask` (`off | on-miss | always`): `gateway`/`node`용 approval prompt
* `node` (string): `host=node`일 때 node id/name
* `elevated` (bool): elevated mode 요청(gateway host). elevated가 `full`로 해석될 때만 `security=full` 강제

참고:

* `host` 기본값은 `sandbox`
* sandboxing이 꺼져 있으면 `elevated`는 무시됩니다(exec가 이미 host에서 실행되기 때문)
* `gateway`/`node` approval은 `~/.openclaw/exec-approvals.json`으로 제어
* `node`에는 pair된 node가 필요합니다(companion app 또는 headless node host)
* 사용 가능한 node가 여러 개라면 `exec.node` 또는 `tools.exec.node`로 선택하세요
* 비-Windows host에서는 `SHELL`이 설정되어 있으면 이를 사용하되, `SHELL`이 `fish`면 fish와 호환되지 않는 script를 피하기 위해 `PATH`의 `bash`(또는 `sh`)를 먼저 시도합니다. 둘 다 없을 때만 `SHELL`로 fallback 합니다.
* Windows host에서는 exec가 먼저 PowerShell 7(`pwsh`)을 찾습니다(Program Files, ProgramW6432, PATH 순). 없으면 Windows PowerShell 5.1로 fallback 합니다.
* Host 실행(`gateway`/`node`)은 binary hijacking 또는 injected code를 막기 위해 `env.PATH`와 loader override(`LD_*`/`DYLD_*`)를 거부합니다.
* OpenClaw는 spawned command 환경(PTY 및 sandbox 포함)에 `OPENCLAW_SHELL=exec`를 설정하므로 shell/profile rule이 exec-tool context를 감지할 수 있습니다.
* 중요: sandboxing은 **기본적으로 꺼져 있습니다**. sandboxing이 꺼진 상태에서 `host=sandbox`가 명시적으로 설정/요청되면, exec는 gateway host에서 조용히 실행되지 않고 fail closed 합니다. sandboxing을 켜거나 `host=gateway`와 approval을 사용하세요.
* 일반적인 Python/Node shell-syntax 실수를 잡는 script preflight check는 effective `workdir` 경계 안의 파일만 검사합니다. script path가 `workdir` 밖으로 해석되면 해당 파일의 preflight는 생략됩니다.

## Config

* `tools.exec.notifyOnExit` (기본값: true): true면 background exec session 종료 시 system event를 enqueue하고 heartbeat를 요청
* `tools.exec.approvalRunningNoticeMs` (기본값: 10000): approval이 필요한 exec가 이 시간 이상 실행되면 단일 “running” notice를 보냄(0이면 비활성)
* `tools.exec.host` (기본값: `sandbox`)
* `tools.exec.security` (기본값: sandbox는 `deny`, gateway + node는 unset이면 `allowlist`)
* `tools.exec.ask` (기본값: `on-miss`)
* `tools.exec.node` (기본값: unset)
* `tools.exec.pathPrepend`: exec run 시 `PATH` 앞에 붙일 디렉터리 목록(gateway + sandbox만)
* `tools.exec.safeBins`: 명시적 allowlist entry 없이 실행 가능한 stdin-only 안전 바이너리 목록. 동작 세부는 [Safe bins](/tools/exec-approvals#safe-bins-stdin-only)를 참고
* `tools.exec.safeBinTrustedDirs`: `safeBins` 경로 검사에 사용할 추가 신뢰 디렉터리. `PATH` entry는 자동 신뢰되지 않으며, 기본값은 `/bin`, `/usr/bin`
* `tools.exec.safeBinProfiles`: custom safe bin용 선택적 argv policy (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`)

예시:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH handling

* `host=gateway`: login-shell `PATH`를 exec 환경에 병합합니다. `env.PATH` override는 host 실행에서 거부됩니다. daemon 자체는 여전히 최소 `PATH`로 동작:
  * macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  * Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
* `host=sandbox`: container 내부에서 `sh -lc`(login shell)로 실행되므로 `/etc/profile`이 `PATH`를 재설정할 수 있습니다.
  OpenClaw는 profile sourcing 후 internal env var로 `env.PATH`를 prepend합니다(shell interpolation 없음). `tools.exec.pathPrepend`도 여기에 적용됩니다.
* `host=node`: 전달한 non-blocked env override만 node로 전송됩니다. `env.PATH` override는 host 실행에서 거부되며 node host에서도 무시됩니다. node에 추가 PATH entry가 필요하면 node host service environment(systemd/launchd)를 설정하거나 도구를 표준 위치에 설치하세요.

agent별 node binding(config에서 agent list index 사용):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: Nodes 탭의 작은 “Exec node binding” 패널에서 같은 설정을 할 수 있습니다.

## Session overrides (`/exec`)

`/exec`를 사용하면 `host`, `security`, `ask`, `node`의 **세션별** 기본값을 설정할 수 있습니다.
인자 없이 `/exec`를 보내면 현재 값을 보여줍니다.

예시:

```
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```

## Authorization model

`/exec`는 **승인된 발신자**에게만 적용됩니다(채널 allowlist/pairing + `commands.useAccessGroups`).
이 명령은 **session state만** 갱신하며 config에는 쓰지 않습니다. exec를 완전히 끄려면 tool policy로 deny 하세요(`tools.deny: ["exec"]` 또는 agent별 설정). `security=full`과 `ask=off`를 명시하지 않는 한 host approval은 계속 적용됩니다.

## Exec approvals (companion app / node host)

sandboxed agent는 exec가 gateway 또는 node host에서 실행되기 전에 요청별 approval을 요구할 수 있습니다.
정책, allowlist, UI flow는 [Exec approvals](/tools/exec-approvals)를 참고하세요.

approval이 필요하면 exec tool은 즉시 `status: "approval-pending"`과 approval id를 반환합니다. 이후 승인(또는 거부/timeout)되면 Gateway가 system event(`Exec finished` / `Exec denied`)를 방출합니다. 명령이 `tools.exec.approvalRunningNoticeMs`보다 오래 실행되면 단일 `Exec running` notice도 방출됩니다.

## Allowlist + safe bins

수동 allowlist enforcement는 **해석된 binary path만** 기준으로 매칭합니다(basename 매칭 없음). `security=allowlist`일 때 shell command는 pipeline의 모든 segment가 allowlisted 또는 safe bin이어야만 자동 허용됩니다. chaining(`;`, `&&`, `||`)과 redirection은 allowlist mode에서 거부되며, 모든 top-level segment가 allowlist를 만족할 때만 허용됩니다. redirection은 여전히 지원되지 않습니다.

`autoAllowSkills`는 exec approval의 별도 편의 기능입니다. 수동 path allowlist entry와는 다릅니다. 엄격한 명시적 신뢰가 필요하면 `autoAllowSkills`를 끄세요.

두 제어를 목적에 맞게 구분해 사용하세요.

* `tools.exec.safeBins`: 작은 stdin-only stream filter
* `tools.exec.safeBinTrustedDirs`: safe-bin executable path를 위한 명시적 신뢰 디렉터리
* `tools.exec.safeBinProfiles`: custom safe bin용 명시적 argv policy
* allowlist: executable path에 대한 명시적 신뢰

`safeBins`를 일반 allowlist처럼 쓰지 마세요. 그리고 interpreter/runtime binary(`python3`, `node`, `ruby`, `bash` 등)를 넣지 마세요. 이런 binary가 필요하면 explicit allowlist entry를 쓰고 approval prompt를 켜 두세요.
`openclaw security audit`는 explicit profile이 없는 interpreter/runtime `safeBins`를 경고하고, `openclaw doctor --fix`는 누락된 custom `safeBinProfiles`를 scaffold할 수 있습니다.

전체 정책 세부와 예시는 [Exec approvals](/tools/exec-approvals#safe-bins-stdin-only), [Safe bins versus allowlist](/tools/exec-approvals#safe-bins-versus-allowlist)를 참고하세요.

## Examples

Foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Background + poll:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Send keys (tmux-style):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (CR만 전송):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Paste (기본적으로 bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply\_patch (experimental)

`apply_patch`는 구조화된 multi-file edit를 위한 `exec`의 subtool입니다.
명시적으로 활성화해야 합니다.

```json5
{
  tools: {
    exec: {
      applyPatch: { enabled: true, workspaceOnly: true, allowModels: ["gpt-5.2"] },
    },
  },
}
```

참고:

* OpenAI/OpenAI Codex model에서만 사용 가능
* tool policy는 그대로 적용되며, `allow: ["exec"]`는 암묵적으로 `apply_patch`도 허용
* config 위치는 `tools.exec.applyPatch`
* `tools.exec.applyPatch.workspaceOnly` 기본값은 `true`(workspace 안으로 제한). workspace 밖에서도 `apply_patch`가 write/delete 하도록 의도한 경우에만 `false`로 설정하세요.
