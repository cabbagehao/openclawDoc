---
summary: "CLI reference for `openclaw configure` (interactive configuration prompts)"
description: "credential, device, agent default를 interactive prompt로 설정하는 `openclaw configure` 명령의 주요 동작과 daemon install 관련 주의점을 정리합니다."
read_when:
  - credential, device, agent default를 interactive하게 조정할 때
title: "configure"
x-i18n:
  source_path: "cli/configure.md"
---

# `openclaw configure`

credential, device, agent default를 설정하는 interactive prompt입니다.

참고: **Model** section에는 이제 `agents.defaults.models` allowlist를 고르는 multi-select가 포함됩니다. 이 값은 `/model`과 model picker에 표시되는 범위를 결정합니다.

Tip: subcommand 없이 `openclaw config`를 실행해도 같은 wizard가 열립니다. non-interactive edit이 필요하면 `openclaw config get|set|unset`을 사용하세요.

Related:

- Gateway configuration reference: [Configuration](/gateway/configuration)
- Config CLI: [Config](/cli/config)

Notes:

- Gateway 실행 위치를 고르면 항상 `gateway.mode`가 업데이트됩니다. 다른 section은 건드리지 않고 mode만 바꾸고 싶다면 "Continue"만 선택해도 됩니다.
- channel-oriented service(Slack/Discord/Matrix/Microsoft Teams)는 setup 중 channel/room allowlist를 묻습니다. 이름과 ID 모두 입력할 수 있으며, 가능하면 wizard가 이름을 ID로 resolve합니다.
- daemon install step을 실행할 때 token auth에 token이 필요하고 `gateway.auth.token`이 SecretRef-managed이면, configure는 SecretRef를 validate하지만 resolved plaintext token을 supervisor service environment metadata에 저장하지는 않습니다.
- token auth에 token이 필요한데 configured token SecretRef가 unresolved 상태면, configure는 daemon install을 막고 해결 방법을 안내합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 설정되어 있고 `gateway.auth.mode`가 unset이면, configure는 mode를 명시할 때까지 daemon install을 막습니다.

## Examples

```bash
openclaw configure
openclaw configure --section model --section channels
```
