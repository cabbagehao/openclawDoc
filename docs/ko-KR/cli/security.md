---
summary: "CLI reference for `openclaw security` (자주 발생하는 보안 footgun 점검 및 수정)"
read_when:
  - config/state 에 대한 빠른 보안 점검을 실행하고 싶을 때
  - 안전한 “fix” 제안(chmod, 기본값 강화)을 적용하고 싶을 때
title: "security"
---

# `openclaw security`

보안 도구(audit + 선택적 fixes).

관련:

- Security guide: [Security](/gateway/security)

## Audit

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

이 audit 는 여러 DM 발신자가 main session 을 공유할 때 경고하고, 공유 inbox 를 위한 **secure DM mode** 로 `session.dmScope="per-channel-peer"`(멀티 계정 채널은 `per-account-channel-peer`)를 권장합니다.
이는 협업형/공유 inbox 강화를 위한 것입니다. 상호 불신적이거나 적대적인 운영자가 하나의 Gateway 를 공유하는 구성은 권장되지 않습니다. 별도 gateways(또는 별도 OS 사용자/호스트)로 trust boundary 를 분리하세요.
또한 구성에서 공유 사용자 ingress 가 예상될 때(예: 열린 DM/group 정책, 구성된 group 대상, wildcard sender 규칙) `security.trust_model.multi_user_heuristic` 을 출력하며, OpenClaw 는 기본적으로 개인 비서형 trust model 이라는 점을 상기시킵니다.
의도적으로 여러 사용자가 공유하는 구성이라면, audit 지침은 모든 세션을 sandbox 화하고, 파일시스템 접근을 workspace 범위로 제한하고, 개인/사적 정체성이나 자격 증명을 해당 runtime 에서 제거하라는 것입니다.
또한 작은 모델(`<=300B`)이 sandbox 없이 web/browser tools 와 함께 사용될 때 경고합니다.
Webhook ingress 에 대해서는 `hooks.defaultSessionKey` 가 unset 인 경우, 요청 `sessionKey` override 가 활성화된 경우, override 가 활성화되었지만 `hooks.allowedSessionKeyPrefixes` 가 없는 경우를 경고합니다.
또한 sandbox mode 가 꺼져 있는데 sandbox Docker 설정이 들어간 경우, `gateway.nodes.denyCommands` 가 실질 효과가 없는 pattern-like/unknown 항목을 사용하는 경우(정확한 node command-name 매칭만 가능, 셸 텍스트 필터링 아님), `gateway.nodes.allowCommands` 가 위험한 node command 를 명시적으로 활성화하는 경우, 전역 `tools.profile="minimal"` 이 agent tool profile 에 의해 override 되는 경우, 열린 그룹이 sandbox/workspace 가드 없이 runtime/filesystem tools 를 노출하는 경우, 설치된 extension plugin tools 가 느슨한 tool policy 하에 접근 가능할 수 있는 경우도 경고합니다.
또한 `gateway.allowRealIpFallback=true` (프록시 오구성 시 header-spoofing 위험), `discovery.mdns.mode="full"` (mDNS TXT record 를 통한 메타데이터 유출), sandbox browser 가 Docker `bridge` network 를 사용하면서 `sandbox.browser.cdpSourceRange` 가 없는 경우, 위험한 sandbox Docker network mode(`host`, `container:*` namespace join 포함), 기존 sandbox browser Docker 컨테이너에 해시 라벨이 없거나 stale 한 경우(예: `openclaw.browserConfigEpoch` 누락)도 경고하며 `openclaw sandbox recreate --browser --all` 을 권장합니다.
npm 기반 plugin/hook 설치 기록이 pin 되지 않았거나 integrity metadata 가 없거나 현재 설치된 패키지 버전과 drift 된 경우도 경고합니다.
채널 allowlist 가 안정적인 ID 대신 변경 가능한 이름/이메일/태그에 의존하는 경우(해당되는 Discord, Slack, Google Chat, MS Teams, Mattermost, IRC 범위)를 경고합니다.
`gateway.auth.mode="none"` 으로 인해 공유 비밀 없이 Gateway HTTP APIs(` /tools/invoke` 와 활성화된 모든 `/v1/*` 엔드포인트 포함)가 노출될 때도 경고합니다.
`dangerous`/`dangerously` 접두 설정은 명시적인 break-glass 운영자 override 입니다. 하나를 활성화했다고 해서 그 자체만으로 보안 취약점 리포트가 되는 것은 아닙니다.
완전한 dangerous parameter 목록은 [Security](/gateway/security) 의 "Insecure or dangerous flags summary" 절을 참고하세요.

## JSON output

CI/policy 검사에는 `--json` 을 사용하세요:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix` 와 `--json` 을 함께 쓰면 출력에는 fix action 과 최종 report 가 모두 포함됩니다:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` 가 바꾸는 것

`--fix` 는 안전하고 결정적인 remediation 을 적용합니다:

- 일반적인 `groupPolicy="open"` 을 `groupPolicy="allowlist"` 로 바꿈(지원 채널의 account variant 포함)
- `logging.redactSensitive` 를 `"off"` 에서 `"tools"` 로 변경
- state/config 와 일반적인 민감 파일(`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session `*.jsonl`)의 권한을 강화

`--fix` 는 **다음은 하지 않습니다**:

- 토큰/비밀번호/API key 회전
- 도구 비활성화(`gateway`, `cron`, `exec` 등)
- gateway bind/auth/network 노출 선택 변경
- plugins/skills 제거 또는 재작성
