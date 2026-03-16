---
title: Security
description: OpenClaw Gateway의 신뢰 모델, 보안 감사 항목, 하드닝 설정, 프롬프트 인젝션 대응을 정리한 보안 가이드입니다.
summary: 셸 접근 권한이 있는 AI Gateway를 운영할 때의 보안 고려 사항과 위협 모델
read_when:
  - 접근 범위를 넓히거나 자동화 기능을 추가할 때
  - Gateway 보안 태세와 하드닝 기본값을 점검할 때
x-i18n:
  source_path: "gateway/security/index.md"
---

# Security

> [!WARNING]
> **개인 비서 신뢰 모델:** 이 문서는 gateway 하나당 신뢰할 수 있는 운영자 경계가 하나라는 가정을 전제로 합니다.
> OpenClaw는 여러 적대적 사용자가 하나의 agent/gateway를 공유하는 hostile multi-tenant 보안 경계를 제공하지 않습니다.
> 상호 비신뢰 사용자를 다뤄야 한다면 신뢰 경계를 분리하세요. 가능하면 gateway, 자격 증명, OS 사용자, 호스트를 각각 나누는 것이 좋습니다.

## Scope first: personal assistant security model

OpenClaw 보안 가이드는 **개인 비서 모델**을 전제로 합니다. 신뢰 경계는 하나이고, 그 안에 여러 agent가 있을 수 있습니다.

- 권장 보안 태세: gateway 하나당 사용자/신뢰 경계 하나
- 지원하지 않는 경계: 서로 신뢰하지 않는 여러 사용자가 하나의 gateway나 agent를 공유하는 구성
- 적대적 사용자 격리가 필요하면 신뢰 경계별로 gateway를 분리하고, 가능하면 OS 사용자/호스트도 분리
- 여러 비신뢰 사용자가 하나의 도구 활성 agent에 메시지를 보낼 수 있다면, 그 agent의 위임된 도구 권한을 사실상 공유한다고 봐야 함

이 문서는 **그 모델 안에서** 하드닝하는 방법을 설명합니다. 하나의 공유 gateway 위에서 hostile multi-tenant isolation을 보장한다고 주장하지 않습니다.

## Quick check: `openclaw security audit`

참고: [Formal Verification (Security Models)](/security/formal-verification/)

config를 바꾸거나 network surface를 노출했다면 다음 명령을 정기적으로 실행하세요.

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

이 명령은 Gateway 인증 노출, browser control 노출, elevated allowlist, filesystem permission 같은 흔한 실수를 점검합니다.

OpenClaw는 제품이면서 동시에 실험입니다. frontier model의 행동을 실제 메시징 표면과 실제 도구에 연결하고 있기 때문에 **완벽하게 안전한 구성은 없습니다.**
핵심은 다음 세 가지를 명확히 정하는 것입니다.

- 누가 봇과 대화할 수 있는가
- 봇이 어디에서 행동할 수 있는가
- 봇이 무엇에 접근할 수 있는가

작동하는 최소 권한부터 시작하고, 충분히 신뢰가 쌓일 때만 조금씩 넓히세요.

## Deployment assumption (important)

OpenClaw는 호스트와 config 경계가 신뢰된다고 가정합니다.

- `~/.openclaw`와 `openclaw.json`을 포함한 gateway host 상태를 수정할 수 있는 사람은 신뢰된 운영자로 취급합니다.
- 여러 상호 비신뢰 운영자가 하나의 gateway를 공유하는 것은 권장하지 않습니다.
- mixed-trust 팀이라면 gateway를 분리하고, 가능하면 OS 사용자/호스트도 나누세요.
- 기술적으로 한 머신에서 여러 gateway를 띄울 수는 있지만, 권장 운영 기본값은 아닙니다.
- 권장 기본값: 사용자당 머신/호스트(VPS) 하나, 그 사용자용 gateway 하나, 그 안에 하나 이상의 agent

### Practical consequence (operator trust boundary)

하나의 gateway 안에서 인증된 operator access는 사용자별 tenant 역할이 아니라 **신뢰된 control-plane 역할**입니다.

- 읽기/제어-plane 접근이 있는 운영자는 설계상 gateway session metadata와 history를 볼 수 있습니다.
- `sessionKey`, session ID, label은 라우팅 선택자이지 인증 토큰이 아닙니다.
- `sessions.list`, `sessions.preview`, `chat.history` 같은 메서드에서 운영자별 완전 격리를 기대하는 것은 이 모델 밖의 요구입니다.
- hostile-user isolation이 필요하면 trust boundary별로 별도 gateway를 사용하세요.

## Personal assistant model (not a multi-tenant bus)

OpenClaw는 개인 비서 모델용입니다. 신뢰 경계는 하나이고, 여러 agent가 있을 수 있습니다.

- 여러 사람이 하나의 tool-enabled agent와 대화할 수 있다면, 모두가 같은 권한 세트를 사실상 조종할 수 있습니다.
- 사용자별 session/memory 격리는 privacy에는 도움이 되지만, 공유 agent를 사용자별 host authorization 경계로 바꾸지는 않습니다.
- 상호 적대적일 수 있는 사용자라면 trust boundary별로 gateway를 분리해야 합니다.

### Shared Slack workspace: real risk

Slack 전체가 봇에게 메시지를 보낼 수 있다면 핵심 위험은 **위임된 도구 권한**입니다.

- 허용된 발신자는 agent policy 안에서 `exec`, browser, network/file tool을 유도할 수 있습니다.
- 한 사용자의 prompt/content injection이 shared state, device, output에 영향을 줄 수 있습니다.
- 공유 agent가 민감한 credential/file에 접근 가능하다면, 허용된 발신자가 tool 사용을 통해 유출을 유도할 수 있습니다.

팀 워크플로용 agent는 별도 구성하고, 개인 데이터용 agent는 private하게 유지하세요.

### Company-shared agent: acceptable pattern

같은 trust boundary 안의 팀이 업무 전용 범위로만 사용하는 agent라면 허용 가능합니다.

- 전용 머신/VM/컨테이너에서 실행
- 전용 OS 사용자 + 전용 browser/profile/account 사용
- 개인 Apple/Google 계정이나 개인 password-manager/browser profile에 로그인하지 않기

개인 정체성과 회사 정체성을 같은 runtime에 섞으면 분리가 무너지고 개인 데이터 노출 위험이 커집니다.

## Gateway and node trust concept

Gateway와 node는 역할은 다르지만 같은 operator trust domain으로 봐야 합니다.

- **Gateway**는 control plane과 policy surface(`gateway.auth`, tool policy, routing)
- **Node**는 paired device 위의 remote execution surface(command, device action, host-local capability)
- gateway에 인증된 호출자는 gateway 범위에서 신뢰됩니다.
- pairing 이후의 node action은 해당 node에서의 trusted operator action입니다.
- `sessionKey`는 routing/context selector이지 per-user auth가 아닙니다.
- exec approval은 operator intent를 확인하는 guardrail이지 hostile multi-tenant isolation 메커니즘이 아닙니다.

강한 격리가 필요하면 OS 사용자/호스트 단위로 trust boundary를 나누세요.

## Trust boundary matrix

| Boundary or control | What it means | Common misread |
| --- | --- | --- |
| `gateway.auth` | gateway API 호출자를 인증 | "매 프레임마다 서명이 있어야 안전하다" |
| `sessionKey` | context/session 선택용 routing key | "session key가 user auth boundary다" |
| Prompt/content guardrails | 모델 오용 위험 완화 | "prompt injection만으로 auth bypass가 증명된다" |
| `canvas.eval` / browser evaluate | 의도적으로 켠 operator capability | "JS eval primitive가 있으면 무조건 취약점이다" |
| Local TUI `!` shell | operator가 직접 트리거한 로컬 실행 | "로컬 shell convenience가 곧 remote injection이다" |
| Node pairing / node commands | paired device에서의 operator-level remote execution | "기본적으로 비신뢰 사용자 접근으로 봐야 한다" |

## Not vulnerabilities by design

다음 패턴은 실제 경계 우회가 증명되지 않으면 보통 취약점으로 보지 않습니다.

- policy/auth/sandbox bypass가 없는 prompt-injection-only chain
- hostile multi-tenant 환경을 가정한 주장
- 공유 gateway에서 정상적인 operator read path를 IDOR로 분류하는 주장
- localhost-only 배포의 HSTS 같은 지적
- 이 저장소에 존재하지 않는 inbound webhook path의 서명 문제
- `sessionKey`를 auth token처럼 해석한 주장

## Researcher preflight checklist

보안 이슈를 올리기 전에 다음을 확인하세요.

1. 최신 `main` 또는 최신 릴리스에서 재현되는가
2. 정확한 code path(file, function, line range)와 테스트한 version/commit이 있는가
3. 영향이 문서화된 trust boundary를 실제로 넘는가
4. [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope)에 이미 해당하지 않는가
5. 기존 advisory와 중복되지 않는가
6. deployment assumption(local/loopback vs exposed, trusted vs untrusted operator)을 명시했는가

## Hardened baseline in 60 seconds

먼저 이 기본선부터 적용하고, 그다음 신뢰된 agent별로 필요한 도구만 다시 열어 주세요.

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

이 구성은 gateway를 local-only로 유지하고, DM을 분리하며, control-plane/runtime 도구를 기본 차단합니다.

## Shared inbox quick rule

여러 사용자가 봇에게 DM을 보낼 수 있다면:

- `session.dmScope`를 `"per-channel-peer"`로 설정
- `dmPolicy`는 `"pairing"` 또는 엄격한 allowlist로 유지
- 이것은 협업용 inbox hardening이지 hostile host isolation이 아님을 기억

## What the audit checks (high level)

`openclaw security audit`는 보통 다음 영역을 살핍니다.

- gateway bind/auth 노출
- control UI/browser 원격 제어 surface
- elevated, runtime, filesystem tool exposure
- sandboxing과 workspace scope
- credential/config/state file permission
- plugin/extension 노출
- model/tool 조합이 너무 위험한지 여부

## Credential storage map

주요 자격 증명 저장 위치:

- WhatsApp account state: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- Allowlist/pairing state:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`
- Model auth profiles: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Optional file-backed secrets payload: `~/.openclaw/secrets.json`
- Legacy OAuth import: `~/.openclaw/credentials/oauth.json`

## Security Audit Checklist

audit 결과를 볼 때 우선순위는 보통 다음 순서입니다.

1. `open` + tools enabled: DM/group 노출부터 줄이고 tool policy와 sandboxing을 조정
2. public network exposure: LAN bind, Funnel, missing auth는 즉시 수정
3. browser control remote exposure: operator access처럼 취급
4. permissions: state/config/credential/auth가 group/world-readable인지 확인
5. plugins/extensions: 신뢰하는 것만 로드
6. model choice: tools가 있는 bot에는 최신 지시 추종성이 강한 모델 사용

## Security audit glossary

실운영에서 자주 보게 되는 `checkId` 예시:

| `checkId` | Severity | Why it matters | Primary fix key/path | Auto-fix |
| --- | --- | --- | --- | --- |
| `fs.state_dir.perms_world_writable` | critical | 다른 사용자/프로세스가 전체 OpenClaw 상태를 수정 가능 | `~/.openclaw` permission | yes |
| `fs.config.perms_writable` | critical | 타인이 auth/tool policy/config를 바꿀 수 있음 | `~/.openclaw/openclaw.json` permission | yes |
| `fs.config.perms_world_readable` | critical | config 안의 token/setting 노출 | config file permission | yes |
| `gateway.bind_no_auth` | critical | shared secret 없이 외부 bind | `gateway.bind`, `gateway.auth.*` | no |
| `gateway.loopback_no_auth` | critical | reverse proxy된 loopback이 무인증으로 노출될 수 있음 | `gateway.auth.*`, proxy setup | no |
| `gateway.http.no_auth` | warn/critical | `auth.mode="none"`으로 HTTP API 노출 | `gateway.auth.mode`, `gateway.http.endpoints.*` | no |
| `gateway.tools_invoke_http.dangerous_allow` | warn/critical | HTTP API에서 위험한 도구를 다시 허용 | `gateway.tools.allow` | no |
| `gateway.nodes.allow_commands_dangerous` | warn/critical | 고위험 node command 허용 | `gateway.nodes.allowCommands` | no |
| `gateway.tailscale_funnel` | critical | 공용 인터넷 노출 | `gateway.tailscale.mode` | no |
| `gateway.control_ui.allowed_origins_required` | critical | non-loopback Control UI에 origin allowlist가 없음 | `gateway.controlUi.allowedOrigins` | no |
| `gateway.control_ui.host_header_origin_fallback` | warn/critical | Host header fallback으로 DNS rebinding hardening 약화 | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | no |
| `gateway.control_ui.insecure_auth` | warn | insecure auth compatibility가 켜짐 | `gateway.controlUi.allowInsecureAuth` | no |
| `gateway.control_ui.device_auth_disabled` | critical | device identity check 비활성화 | `gateway.controlUi.dangerouslyDisableDeviceAuth` | no |
| `gateway.real_ip_fallback_enabled` | warn/critical | `X-Real-IP` fallback 신뢰로 source-IP spoofing 가능 | `gateway.allowRealIpFallback`, `gateway.trustedProxies` | no |
| `discovery.mdns_full_mode` | warn/critical | mDNS full mode가 `cliPath`/`sshPort` metadata를 광고 | `discovery.mdns.mode`, `gateway.bind` | no |
| `config.insecure_or_dangerous_flags` | warn | insecure/dangerous debug flag 활성화 | finding detail 참고 | no |
| `hooks.token_too_short` | warn | hook ingress brute force가 쉬워짐 | `hooks.token` | no |
| `hooks.request_session_key_enabled` | warn/critical | 외부 호출자가 sessionKey를 직접 선택 가능 | `hooks.allowRequestSessionKey` | no |
| `hooks.request_session_key_prefixes_missing` | warn/critical | 외부 session key 형식 제한이 없음 | `hooks.allowedSessionKeyPrefixes` | no |
| `logging.redact_off` | warn | 민감 정보가 로그/status로 샐 수 있음 | `logging.redactSensitive` | yes |
| `sandbox.docker_config_mode_off` | warn | sandbox Docker config가 있지만 비활성 | `agents.*.sandbox.mode` | no |
| `sandbox.dangerous_network_mode` | critical | sandbox Docker network가 `host` 또는 `container:*` 사용 | `agents.*.sandbox.docker.network` | no |
| `tools.exec.host_sandbox_no_sandbox_defaults` | warn | sandbox가 꺼져 있을 때 `exec host=sandbox`가 host exec로 풀림 | `tools.exec.host`, `agents.defaults.sandbox.mode` | no |
| `tools.exec.host_sandbox_no_sandbox_agents` | warn | agent별 `exec host=sandbox`도 sandbox가 꺼지면 host exec로 풀림 | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode` | no |
| `tools.exec.safe_bins_interpreter_unprofiled` | warn | interpreter/runtime bin이 `safeBins`에 profile 없이 있으면 exec risk 확장 | `tools.exec.safeBins`, `tools.exec.safeBinProfiles` | no |
| `skills.workspace.symlink_escape` | warn | workspace `skills/**/SKILL.md`가 workspace 밖으로 resolve됨 | workspace `skills/**` filesystem state | no |
| `security.exposure.open_groups_with_elevated` | critical | open group + elevated tool은 고위험 injection 경로 | `channels.*.groupPolicy`, `tools.elevated.*` | no |
| `security.exposure.open_groups_with_runtime_or_fs` | critical/warn | open group이 command/file tool에 접근 가능 | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | no |
| `security.trust_model.multi_user_heuristic` | warn | config가 personal-assistant trust model과 어긋나 보임 | gateway 분리 또는 sandbox/tool deny/workspace scoping | no |
| `tools.profile_minimal_overridden` | warn | agent override가 global minimal profile을 우회 | `agents.list[].tools.profile` | no |
| `plugins.tools_reachable_permissive_policy` | warn | extension tool이 permissive context에서 도달 가능 | `tools.profile`, tool allow/deny | no |
| `models.small_params` | critical/info | 작은 모델 + 위험한 tool surface는 injection risk를 키움 | model choice + sandbox/tool policy | no |

## Control UI over HTTP

Control UI가 device identity를 생성하려면 **secure context**(HTTPS 또는 localhost)가 필요합니다.
`gateway.controlUi.allowInsecureAuth`는 로컬 호환성용 토글입니다.

- localhost에서는 non-secure HTTP로 페이지를 열었을 때도 device identity 없이 Control UI auth를 허용합니다.
- pairing check를 우회하지는 않습니다.
- remote(non-localhost) device identity 요구사항을 완화하지도 않습니다.

가능하면 HTTPS(Tailscale Serve)나 `127.0.0.1`을 사용하세요.

정말 break-glass 상황에서만 `gateway.controlUi.dangerouslyDisableDeviceAuth`를 쓰세요.
device identity check를 완전히 끄는 것으로, 심각한 보안 저하입니다.

이 값이 켜지면 `openclaw security audit`가 경고합니다.

## Insecure or dangerous flags summary

`openclaw security audit`는 알려진 insecure/dangerous debug switch가 켜져 있으면 `config.insecure_or_dangerous_flags`를 보고합니다.
현재 이 항목에는 다음이 모입니다.

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`

관련 `dangerous*` / `dangerously*` key 예시:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.irc.dangerouslyAllowNameMatching`
- `channels.mattermost.dangerouslyAllowNameMatching`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- 같은 key의 agent별 override들

## Reverse Proxy Configuration

gateway를 reverse proxy(nginx, Caddy, Traefik 등) 뒤에 둘 때는 client IP를 올바르게 판별하도록 `gateway.trustedProxies`를 설정해야 합니다.

proxy header가 `trustedProxies`에 없는 주소에서 오면, gateway는 그 연결을 local client로 취급하지 않습니다.
gateway auth가 꺼져 있으면 그런 연결은 거부됩니다.
이렇게 해야 proxy를 거친 연결이 localhost에서 온 것처럼 보이면서 자동 신뢰를 얻는 우회를 막을 수 있습니다.

```yaml
gateway:
  trustedProxies:
    - "127.0.0.1" # proxy가 localhost에서 실행될 때
  # Optional. Default false.
  # proxy가 X-Forwarded-For를 제공할 수 없을 때만 켜세요.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies`가 설정되면 gateway는 `X-Forwarded-For`를 사용해 client IP를 판별합니다.
`X-Real-IP`는 `gateway.allowRealIpFallback: true`를 명시적으로 켜지 않는 한 무시됩니다.

좋은 reverse proxy 동작(들어온 forwarding header를 덮어씀):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

나쁜 reverse proxy 동작(비신뢰 forwarding header를 이어붙이거나 보존):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS and origin notes

- OpenClaw gateway는 local/loopback 우선입니다. TLS를 reverse proxy에서 종료한다면, proxy가 노출하는 HTTPS 도메인에 HSTS를 설정하세요.
- gateway가 직접 HTTPS를 종료한다면 `gateway.http.securityHeaders.strictTransportSecurity`로 HSTS header를 보낼 수 있습니다.
- 자세한 배포 가이드는 [Trusted Proxy Auth](/gateway/trusted-proxy-auth#tls-termination-and-hsts)를 참고하세요.
- non-loopback Control UI 배포에서는 기본적으로 `gateway.controlUi.allowedOrigins`가 필요합니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host-header origin fallback을 켜는 것으로, 위험한 operator-selected policy로 봐야 합니다.
- DNS rebinding과 proxy host-header 동작은 deployment hardening 문제로 다루고, `trustedProxies`를 좁게 유지하며 gateway를 공용 인터넷에 직접 노출하지 마세요.

## Local session logs live on disk

OpenClaw는 session transcript를 `~/.openclaw/agents/<agentId>/sessions/*.jsonl`에 저장합니다.
이는 session continuity와 선택적인 session memory indexing에 필요하지만, 동시에 **filesystem access가 있는 프로세스/사용자는 누구나 그 로그를 읽을 수 있다**는 뜻입니다.
디스크 접근 자체를 trust boundary로 보고 `~/.openclaw` permission을 엄격히 잠그세요.
agent 간 더 강한 격리가 필요하면 별도 OS 사용자 또는 별도 호스트에서 실행하세요.

## Node execution (system.run)

macOS node가 paired 상태라면 gateway는 그 node에서 `system.run`을 호출할 수 있습니다. 즉, **Mac에 대한 remote code execution**입니다.

- node pairing(approval + token)이 필요합니다.
- Mac 쪽에서는 **Settings → Exec approvals**에서 security/ask/allowlist로 제어합니다.
- approval mode는 정확한 request context와, 가능하면 하나의 구체적인 local script/file operand에 바인딩됩니다. interpreter/runtime command에서 정확히 하나의 직접 local file을 식별할 수 없으면, approval-backed execution은 semantic coverage를 약속하는 대신 거부됩니다.
- 원격 실행을 원하지 않으면 security를 **deny**로 두고 해당 Mac의 node pairing을 제거하세요.

## Dynamic skills (watcher / remote nodes)

OpenClaw는 세션 도중에도 skills list를 갱신할 수 있습니다.

- **Skills watcher**: `SKILL.md`가 바뀌면 다음 agent turn에서 skills snapshot이 바뀔 수 있음
- **Remote nodes**: macOS node가 연결되면 macOS 전용 skill이 bin probing 결과에 따라 활성 대상이 될 수 있음

skill folder는 **trusted code**로 취급하고, 수정 권한을 엄격히 제한하세요.

## The Threat Model

AI assistant는 다음을 할 수 있습니다.

- 임의 shell command 실행
- 파일 읽기/쓰기
- network service 접근
- WhatsApp 같은 채널이 연결되어 있으면 사람에게 메시지 전송

사람들은 다음을 시도할 수 있습니다.

- AI를 속여 나쁜 행동을 하게 만들기
- 데이터 접근을 위한 social engineering
- 인프라 정보를 탐색하기

## Core concept: access control before intelligence

여기서의 실패는 대개 정교한 exploit가 아니라, "누군가 봇에게 시켰고, 봇이 그대로 했다"에 가깝습니다.

OpenClaw의 기본 태도는 다음과 같습니다.

- **Identity first:** 누가 봇과 대화할 수 있는지 결정
- **Scope next:** 봇이 어디에서 행동할 수 있는지 결정
- **Model last:** 모델은 조작될 수 있다고 가정하고, 조작되더라도 blast radius가 작도록 설계

## Command authorization model

slash command와 directive는 **authorized sender**에게만 적용됩니다.
인증은 channel allowlist/pairing과 `commands.useAccessGroups`에서 파생됩니다.
channel allowlist가 비어 있거나 `"*"`를 포함하면, 그 채널에서는 command가 사실상 열려 있게 됩니다.

`/exec`는 authorized operator를 위한 session-local 편의 기능일 뿐이며, config를 쓰거나 다른 session을 바꾸지 않습니다.

## Control plane tools risk

두 개의 내장 tool은 persistent control-plane 변경을 만들 수 있습니다.

- `gateway`: `config.apply`, `config.patch`, `update.run` 호출 가능
- `cron`: 원래 chat/task가 끝난 뒤에도 계속 실행되는 scheduled job 생성 가능

비신뢰 콘텐츠를 다루는 agent/surface에서는 기본적으로 이 도구들을 deny하세요.

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false`는 restart action만 막습니다. `gateway`의 config/update action까지 막지는 않습니다.

## Plugins/extensions

plugin은 gateway와 **같은 프로세스 안에서** 실행됩니다. trusted code로 취급하세요.

- 신뢰하는 출처의 plugin만 설치
- 가능하면 명시적 `plugins.allow` allowlist 사용
- 활성화 전에 plugin config를 검토
- plugin 변경 후 gateway 재시작
- npm으로 plugin을 설치할 때(`openclaw plugins install <npm-spec>`)는 untrusted code 실행처럼 취급
  - 설치 경로: `~/.openclaw/extensions/<pluginId>/` 또는 `$OPENCLAW_STATE_DIR/extensions/<pluginId>/`
  - OpenClaw는 `npm pack` 후 해당 디렉터리에서 `npm install --omit=dev`를 실행
  - lifecycle script가 설치 중에 코드를 실행할 수 있음
  - 가능하면 pinned exact version을 쓰고, 활성화 전에 unpacked code를 검토

자세한 내용: [Plugins](/tools/plugin)

## DM access model (pairing / allowlist / open / disabled)

현재 DM을 받을 수 있는 모든 channel은 inbound DM을 처리하기 전에 `dmPolicy`(또는 `*.dm.policy`)로 먼저 막습니다.

- `pairing` (기본값): 모르는 발신자에게 짧은 pairing code를 보내고, 승인 전까지 메시지를 무시
- `allowlist`: 모르는 발신자를 즉시 차단
- `open`: 누구나 DM 가능. **반드시** channel allowlist에 `"*"`가 있어야 함
- `disabled`: inbound DM 전체 무시

CLI 승인:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

세부 파일 경로와 동작: [Pairing](/channels/pairing)

## DM session isolation (multi-user mode)

기본적으로 OpenClaw는 **모든 DM을 main session으로 라우팅**해 device와 channel을 넘나드는 대화 연속성을 유지합니다.
하지만 여러 사람이 DM할 수 있다면 DM session을 분리하는 것이 좋습니다.

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

이렇게 하면 사용자 간 context leakage를 막을 수 있습니다.
다만 이것은 messaging-context boundary이지 host-admin boundary가 아닙니다.
host/config를 공유하는 hostile user라면 trust boundary별로 gateway를 나누세요.

### Secure DM mode (recommended)

위 설정을 **secure DM mode**로 보면 됩니다.

- 기본값: `session.dmScope: "main"` (모든 DM이 하나의 session 공유)
- local CLI onboarding 기본값: 값이 비어 있으면 `session.dmScope: "per-channel-peer"`를 기록
- secure DM mode: `session.dmScope: "per-channel-peer"` (채널+발신자별로 분리된 DM context)

같은 채널에서 여러 account를 쓰면 `per-account-channel-peer`를 고려하세요.
같은 사람이 여러 채널로 연락하면 `session.identityLinks`로 하나의 canonical identity로 묶을 수 있습니다.

## Allowlists (DM + groups) — terminology

OpenClaw에는 "누가 나를 트리거할 수 있는가"에 대한 두 층이 있습니다.

- **DM allowlist**: direct message에서 누가 말할 수 있는지
  - `dmPolicy="pairing"`이면 승인 결과가 `~/.openclaw/credentials/`의 account-scoped pairing allowlist store에 기록되고 config allowlist와 병합됩니다.
- **Group allowlist**: 어떤 group/channel/guild의 메시지를 받을지
  - 예: `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.discord.guilds`, `channels.slack.channels`
  - `groupPolicy="allowlist"`와 `groupAllowFrom`으로 group 내부 발신자도 따로 제한 가능
  - group check는 먼저 allowlist/policy, 그다음 mention/reply activation 순서
  - bot 메시지에 대한 reply(암묵적 mention)도 `groupAllowFrom` 같은 sender allowlist를 우회하지 않음
  - `dmPolicy="open"`, `groupPolicy="open"`은 마지막 수단으로만 사용

자세한 내용: [Configuration](/gateway/configuration), [Groups](/channels/groups)

## Prompt injection (what it is, why it matters)

Prompt injection은 공격자가 "지시를 무시해라", "파일시스템을 덤프해라", "링크를 열고 명령을 실행해라" 같은 메시지로 모델을 위험하게 조종하는 것입니다.

강한 system prompt가 있어도 **prompt injection은 해결된 문제가 아닙니다.**
실제 강제력은 tool policy, exec approval, sandboxing, channel allowlist에서 나옵니다.
실전에서 도움이 되는 조치는 다음과 같습니다.

- inbound DM을 pairing/allowlist로 잠그기
- group에서는 mention gating 사용
- untrusted content를 읽는 agent에서 runtime/fs/control-plane tool을 기본 deny
- 가능한 한 sandbox와 좁은 workspace scope 사용
- 강한 instruction-following model 사용

## Unsafe external content bypass flags

외부 콘텐츠를 더 넓게 읽도록 하는 우회 플래그는 정말 필요한 경우에만 쓰세요.

- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`

이 값들은 external content trust 경계를 넓히므로 audit에서 위험 플래그로 묶입니다.

## Prompt injection does not require public DMs

DM이 공개되지 않아도 prompt injection은 발생할 수 있습니다.

- group allowlist 안의 사람이 악성 콘텐츠를 보낼 수 있음
- email, web page, attached doc, pasted transcript 모두 injection surface가 될 수 있음
- trusted sender라도 계정 탈취나 혼동된 지시를 통해 위험 입력을 보낼 수 있음

따라서 핵심은 "누가 보냈는가"보다 "무슨 surface를 agent에게 열어 두었는가"입니다.

## Model strength (security note)

tool이 있는 agent에는 instruction-following이 약한 작은 모델을 기본 선택으로 두지 않는 것이 좋습니다.

- 작은 모델은 악성 프롬프트와 role confusion에 더 쉽게 흔들릴 수 있음
- 위험한 tool surface가 열려 있으면 그 약점이 실질적 행동으로 이어질 수 있음
- 강한 모델도 안전하지는 않지만, 더 나은 방어선이 됨

## Reasoning & verbose output in groups

group에서는 과도한 reasoning trace나 verbose output이 민감한 context와 운영 정보를 새기 쉽습니다.

- reply는 필요한 최소한으로 유지
- 민감한 config/path/token은 로그와 transcript에서 redaction
- 비신뢰 group에서는 control-plane 정보와 infra detail을 자세히 말하지 않게 설계

## Configuration Hardening (examples)

### 0) File permissions

- `~/.openclaw`는 보통 `700`
- `openclaw.json`, auth profile, credential file은 보통 `600`
- 다른 사용자나 프로세스가 읽거나 쓸 수 없도록 유지

### 0.4) Network exposure (bind + port + firewall)

- 가능하면 `gateway.bind: "loopback"` 유지
- LAN, tailnet, custom bind를 쓴다면 auth를 반드시 설정
- 공개 포트 노출보다 reverse proxy + auth + firewall 조합 선호

### 0.4.1) Docker port publishing + UFW (`DOCKER-USER`)

Docker는 호스트 firewall 규칙을 우회할 수 있으므로 `DOCKER-USER` 체인 정책을 확인하세요.

- 필요하지 않은 port publish 금지
- UFW를 쓴다면 Docker와 함께 실제로 차단되는지 확인
- container bind와 published port를 최소화

### 0.4.2) mDNS/Bonjour discovery (information disclosure)

mDNS full mode는 로컬 네트워크에 metadata(`cliPath`, `sshPort` 등)를 광고할 수 있습니다.

- 일반적으로 최소 모드 사용
- 불필요하면 discovery 자체를 끄기
- LAN 전체가 신뢰되지 않는다면 full mode는 피하기

### 0.5) Lock down the Gateway WebSocket (local auth)

loopback-only라도 WS client가 쉽게 붙지 않도록 token auth를 유지하는 것이 좋습니다.

- local process도 인증을 요구
- dashboard나 Control UI도 같은 auth 경계를 사용
- "로컬이니까 auth를 끈다"는 습관을 피할 것

### 0.6) Tailscale Serve identity headers

Tailscale Serve를 쓴다면 identity header와 trusted proxy 설정을 올바르게 맞춰야 합니다.

- proxy header를 어디까지 신뢰할지 명확히 설정
- tailnet 노출과 public exposure를 혼동하지 않기
- Serve/Funnel은 운영자 접근 경계의 일부로 다루기

### 0.6.1) Browser control via node host (recommended)

browser control이 필요하면 gateway host의 개인 브라우저보다 전용 node host/전용 browser profile을 권장합니다.

- 개인 세션/쿠키와 분리
- 업무 전용 계정만 로그인
- 가능한 경우 sandboxed browser와 별도 device 사용

### 0.7) Secrets on disk (what’s sensitive)

민감한 항목:

- gateway token/password
- model provider API key
- OAuth credential material
- auth profile
- plugin이나 helper가 추가로 쓰는 local secret file

가능하면 SecretRef와 별도 secret store를 사용하고, disk permission을 엄격히 유지하세요.

### 0.8) Logs + transcripts (redaction + retention)

로그와 transcript는 유출 표면입니다.

- `logging.redactSensitive`를 켜기
- 보존 기간을 필요한 만큼만 유지
- transcript가 disk에 남는다는 점을 운영자와 팀이 이해하도록 하기

### 1) DMs: pairing by default

DM 기본값은 pairing으로 두세요. open DMs는 특별한 이유가 있을 때만 사용합니다.

### 2) Groups: require mention everywhere

group에서는 기본적으로 mention required를 권장합니다.
agent가 모든 대화를 자동으로 처리하게 두지 마세요.

### 3) Separate Numbers

개인용 채널 계정과 회사/공유용 채널 계정을 섞지 마세요.
가능하면 전화번호, 앱 계정, 브라우저 프로필을 분리하세요.

### 4) Read-Only Mode (Today, via sandbox + tools)

강한 write 차단이 필요하면:

- filesystem tool deny
- sandbox 활성화
- `workspaceAccess: "ro"` 또는 `"none"`
- runtime/control-plane tool deny

### 5) Secure baseline (copy/paste)

```json5
{
  session: { dmScope: "per-channel-peer" },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "gateway", "cron", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    elevated: { enabled: false },
  },
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Sandboxing (recommended)

샌드박싱은 완벽한 경계는 아니지만, tool-enabled agent의 blast radius를 줄이는 데 가장 실용적인 방어선입니다.

- non-main 또는 all 모드 고려
- write가 필요 없으면 workspace를 read-only 또는 none으로
- bind mount는 최소화
- elevated는 예외 상황에서만

### Sub-agent delegation guardrail

sub-agent를 쓸 때도 같은 원칙이 적용됩니다.

- 비신뢰 콘텐츠를 다루는 agent에는 runtime/fs/control-plane tool을 기본 제한
- delegation이 늘수록 session 수, tool path, memory path가 함께 늘어난다는 점 고려
- group/session spawn 권한은 쉽게 열지 않기

## Browser control risks

브라우저 제어는 단순 스크린샷 도구가 아니라 operator capability에 가깝습니다.

- 로그인된 세션, intranet, local admin panel에 접근할 수 있음
- browser automation은 SSRF-like pivot이 될 수 있음
- 개인 브라우저 프로필을 재사용하지 않는 것이 좋음

### Browser SSRF policy (trusted-network default)

기본값은 trusted-network에 가깝게 두고, private network 접근 허용 여부를 신중히 결정하세요.

- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 정말 필요할 때만 사용
- 내부 admin panel이나 metadata endpoint에 agent가 닿지 않도록 설계

## Per-agent access profiles (multi-agent)

agent마다 서로 다른 access profile을 주는 것이 가장 현실적인 하드닝 방법 중 하나입니다.

- 대화 전용 agent
- 읽기 전용 도구 agent
- 강한 coding/runtime agent
- 브라우저 전용 agent

### Example: full access (no sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "trusted-work",
        tools: { profile: "coding" },
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Example: read-only tools + read-only workspace

```json5
{
  agents: {
    list: [
      {
        id: "readonly-review",
        tools: {
          allow: ["read", "browser"],
        },
        sandbox: {
          mode: "all",
          workspaceAccess: "ro",
        },
      },
    ],
  },
}
```

### Example: no filesystem/shell access (provider messaging allowed)

```json5
{
  agents: {
    list: [
      {
        id: "chat-only",
        tools: {
          profile: "messaging",
          deny: ["group:runtime", "group:fs", "gateway", "cron"],
        },
      },
    ],
  },
}
```

## What to Tell Your AI

모델에게도 운영 규칙을 분명히 알려 주세요.

- 낯선 사람에게 filesystem이나 secret를 노출하지 말 것
- permission boundary를 넘지 말 것
- group에서는 최소 권한으로 행동할 것
- 확실하지 않으면 실행보다 질문을 선택할 것

## Security Rules

- 먼저 사람과 surface를 제한하고, 나중에 도구를 연다
- open group과 powerful tool 조합을 피한다
- 개인 계정과 공유 계정을 섞지 않는다
- plugin, skill, browser profile은 trusted code / trusted state로 본다
- auth, sandbox, allowlist는 "있으면 좋은 것"이 아니라 기본선이다

## Incident Response

### Contain

- gateway 프로세스를 즉시 중지
- network exposure 차단
- 관련 node/browser session 분리

### Rotate (assume compromise if secrets leaked)

- gateway token/password 교체
- model API key/OAuth credential 회전
- 채널 bot token과 기타 secret도 교체

### Audit

- `openclaw security audit --deep` 실행
- session log, transcript, command history를 검토
- 어떤 surface가 열려 있었는지 재구성

### Collect for a report

- 재현 절차
- 관련 config
- 영향 범위와 노출된 secret 목록
- 수정 후 재검증 결과

## Secret Scanning (detect-secrets)

저장소와 설정 파일에서 secret scanning을 습관화하는 것이 좋습니다.

- commit 전에 secret scanner 실행
- plaintext credential이 auth profile이나 `.env`에 남지 않았는지 확인
- generated file도 함께 점검

### If CI fails

- 노출된 secret를 즉시 revoke
- 파일에서 제거 후 새 값으로 교체
- 필요한 경우 이력 정리와 추가 보고 수행

## Reporting Security Issues

실제 보안 이슈를 발견했다면 공개 이슈보다 보안 제보 경로를 우선 사용하세요.
재현 방법, 신뢰 경계, 배포 가정, 실제 영향 범위를 함께 정리하는 것이 좋습니다.
