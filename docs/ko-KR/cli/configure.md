---
summary: "자격 증명, 기기 및 에이전트 기본값 설정을 위한 `openclaw configure` 대화형 명령어 레퍼런스"
read_when:
  - 대화형 프롬프트를 통해 인증 정보, 기기 페어링 또는 에이전트 설정을 조정하고자 할 때
title: "configure"
x-i18n:
  source_path: "cli/configure.md"
---

# `openclaw configure`

자격 증명, 페어링된 기기, 에이전트 기본값 등을 설정하기 위한 대화형 마법사를 실행함.

**참고**: **Model** 섹션에는 이제 `/model` 명령어 및 모델 선택기에 표시될 `agents.defaults.models` 허용 목록(Allowlist)을 위한 다중 선택 항목이 포함됨.

**팁**: 하위 명령어 없이 `openclaw config`를 실행해도 동일한 마법사가 열림. 비대화형 방식의 빠른 수정이 필요한 경우 [`openclaw config get|set|unset`](/cli/config) 명령어를 사용함.

**관련 문서:**
- Gateway 설정 전체 레퍼런스: [Configuration](/gateway/configuration)
- 설정 관리 CLI 가이드: [Config](/cli/config)

## 참고 사항

- Gateway 실행 위치(로컬/원격)를 선택하면 항상 `gateway.mode` 설정이 업데이트됨. 다른 설정 변경 없이 모드만 바꾸고 싶다면 "Continue"를 선택하여 단계를 마칠 수 있음.
- 채널 중심 서비스(Slack, Discord, Matrix, MS Teams 등) 설정 시 채널/룸 허용 목록(Allowlist) 입력을 요청함. 이름이나 ID를 입력할 수 있으며, 시스템은 가능한 경우 이름을 실제 ID로 자동 해석함.
- 데몬(Daemon) 설치 단계 진행 시:
  - 토큰 인증을 사용하고 `gateway.auth.token`이 시크릿 참조(SecretRef)로 관리되는 경우, 마법사는 참조의 유효성을 검증하지만 실제 평문 토큰 값을 서비스 환경 메타데이터에 기록하지는 않음.
  - 토큰 인증이 필요한 상황에서 설정된 SecretRef를 해석할 수 없는 경우, 설치를 중단하고 해결 방법을 안내함.
  - `token`과 `password`가 모두 설정되어 있으나 `gateway.auth.mode`가 명시되지 않은 경우, 모드가 확실히 지정될 때까지 설치 과정을 차단함.

## 사용 예시

```bash
# 전체 설정 마법사 시작
openclaw configure

# 특정 섹션(모델, 채널)만 지정하여 마법사 실행
openclaw configure --section model --section channels
```
