---
summary: "`openclaw configure`용 CLI 레퍼런스(대화형 설정 프롬프트)"
read_when:
  - 자격 증명, 디바이스 또는 에이전트 기본값을 대화형으로 조정하려고 할 때
title: "configure"
---

# `openclaw configure`

자격 증명, 디바이스, 에이전트 기본값을 설정하는 대화형 프롬프트입니다.

참고: 이제 **Model** 섹션에는 `agents.defaults.models` 허용 목록(즉, `/model`과 모델 선택기에서 표시되는 항목)에 대한 다중 선택이 포함됩니다.

팁: `openclaw config`를 하위 명령 없이 실행하면 같은 마법사가 열립니다. 비대화형 수정에는 `openclaw config get|set|unset`을 사용하세요.

관련 문서:

- Gateway 설정 레퍼런스: [Configuration](/gateway/configuration)
- Config CLI: [Config](/cli/config)

참고:

- Gateway 실행 위치를 선택하면 항상 `gateway.mode`가 업데이트됩니다. 그 항목만 필요하다면 다른 섹션을 건드리지 않고 "Continue"를 선택해도 됩니다.
- 채널 지향 서비스(Slack/Discord/Matrix/Microsoft Teams)는 설정 중 채널/룸 허용 목록을 입력하라고 묻습니다. 이름이나 ID를 입력할 수 있으며, 가능하면 마법사가 이름을 ID로 해석합니다.
- 데몬 설치 단계를 실행할 때 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, configure는 SecretRef를 검증하지만 해석된 평문 토큰 값을 supervisor 서비스 환경 메타데이터에 저장하지는 않습니다.
- 토큰 인증에 토큰이 필요하고 설정된 토큰 SecretRef를 해석할 수 없으면, configure는 데몬 설치를 막고 실행 가능한 해결 가이드를 보여줍니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 설정되어 있는데 `gateway.auth.mode`가 비어 있으면, configure는 모드를 명시적으로 설정할 때까지 데몬 설치를 막습니다.

## 예시

```bash
openclaw configure
openclaw configure --section model --section channels
```
