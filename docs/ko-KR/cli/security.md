---
summary: "CLI reference for `openclaw security` (audit and fix common security footguns)"
description: "config와 state에서 흔한 보안 실수를 점검하고 안전한 자동 수정 범위를 확인하는 `openclaw security` 사용법을 설명합니다."
read_when:
  - config와 state에 대해 빠른 security audit을 수행하고 싶을 때
  - 안전한 fix suggestion을 적용하고 싶을 때
title: "security"
x-i18n:
  source_path: "cli/security.md"
---

# `openclaw security`

security 도구입니다. (audit + 선택적 fix)

Related:

- Security guide: [Security](/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

audit는 여러 DM sender가 main session을 공유할 때 경고하고, shared inbox에는
**secure DM mode**인 `session.dmScope="per-channel-peer"`를 권장합니다.
(multi-account channel은 `per-account-channel-peer`)
이 guidance는 cooperative/shared inbox hardening을 위한 것입니다. 서로 신뢰하지 않는 운영자가 하나의 Gateway를 공유하는 구조는 권장되지 않으며,
그 경우에는 별도 gateway나 별도 OS user/host로 trust boundary를 분리해야 합니다.

또한 config가 shared-user ingress를 시사하면(`security.trust_model.multi_user_heuristic`),
예를 들어 open DM/group policy, configured group target, wildcard sender rule 같은 경우
OpenClaw의 기본 trust model이 personal-assistant 중심이라는 점을 다시 알립니다.
의도적인 shared-user setup이라면 모든 session을 sandbox에 넣고, filesystem access를 workspace 범위로 제한하며,
개인용 identity나 credential을 해당 runtime에서 분리하라고 안내합니다.

또한 작은 model(`<=300B`)을 sandbox 없이 web/browser tool과 함께 쓸 때도 경고합니다.

webhook ingress에 대해서는 `hooks.defaultSessionKey`가 비어 있거나, request `sessionKey` override가 켜져 있거나,
override가 켜져 있는데 `hooks.allowedSessionKeyPrefixes`가 없는 경우를 경고합니다.

또한 sandbox mode가 꺼져 있는데 sandbox Docker setting이 있는 경우,
`gateway.nodes.denyCommands`에 pattern처럼 보이지만 실제로는 효과 없는 항목이 있는 경우,
`gateway.nodes.allowCommands`가 위험한 node command를 명시적으로 허용하는 경우,
global `tools.profile="minimal"`이 agent tool profile에 의해 override되는 경우,
open group이 sandbox/workspace guard 없이 runtime/filesystem tool을 노출하는 경우,
설치된 extension plugin tool이 느슨한 tool policy 아래에서 도달 가능할 수 있는 경우도 경고합니다.

그리고 `gateway.allowRealIpFallback=true`(proxy 오구성 시 header spoofing 위험),
`discovery.mdns.mode="full"`(mDNS TXT record를 통한 metadata leakage),
sandbox browser가 `sandbox.browser.cdpSourceRange` 없이 Docker `bridge` network를 사용하는 경우,
dangerous한 sandbox Docker network mode(`host`, `container:*` namespace join 포함)를 함께 점검합니다.

기존 sandbox browser Docker container에 hash label이 없거나 stale한 경우
(예: `openclaw.browserConfigEpoch`가 없는 pre-migration container)에도 경고하고,
`openclaw sandbox recreate --browser --all`을 권장합니다.

또한 npm 기반 plugin/hook install record가 unpinned 상태이거나 integrity metadata가 없거나,
현재 설치된 package version과 drift가 있는지도 확인합니다.
channel allowlist가 stable ID 대신 mutable name/email/tag에 의존할 때도 경고합니다.
(Discord, Slack, Google Chat, MS Teams, Mattermost, IRC scope 포함)

`gateway.auth.mode="none"` 때문에 shared secret 없이 Gateway HTTP API(`\/tools\/invoke`와 활성화된 모든 `/v1/*` endpoint)에 접근 가능할 때도 플래그를 세웁니다.

`dangerous` 또는 `dangerously` 접두사의 setting은 운영자가 의도적으로 제약을 푸는 break-glass override입니다.
이 값이 켜져 있다는 사실만으로 security vulnerability report가 되지는 않습니다.
전체 dangerous parameter 목록은 [Security](/gateway/security)의 "Insecure or dangerous flags summary"를 참고하세요.

## JSON output

CI나 policy check에는 `--json`을 사용하세요.

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix`와 `--json`을 함께 쓰면 output에는 fix action과 최종 report가 모두 포함됩니다.

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## What `--fix` changes

`--fix`는 안전하고 결정적인 remediation만 적용합니다.

- 흔한 `groupPolicy="open"`을 `groupPolicy="allowlist"`로 바꿉니다. (지원되는 channel의 account variant 포함)
- `logging.redactSensitive`를 `"off"`에서 `"tools"`로 바꿉니다.
- state/config와 일반적인 민감 파일(`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session `*.jsonl`)의 permission을 더 엄격하게 만듭니다.

`--fix`는 다음을 하지 않습니다.

- token, password, API key rotation
- `gateway`, `cron`, `exec` 같은 tool 비활성화
- gateway bind/auth/network exposure 선택 변경
- plugin이나 skill 제거 또는 재작성
