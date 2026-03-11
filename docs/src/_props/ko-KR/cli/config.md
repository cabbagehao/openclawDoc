---
summary: "설정값 조회, 수정, 삭제 및 유효성 검증을 위한 `openclaw config` 명령어 레퍼런스"
read_when:
  - CLI를 통해 비대화형(Non-interactive) 방식으로 설정을 관리하고자 할 때
  - 설정 파일의 경로를 확인하거나 스키마 정합성을 검사할 때
title: "config"
x-i18n:
  source_path: "cli/config.md"
---

# `openclaw config`

설정 관리 도우미: 경로를 기반으로 설정값을 조회(get), 설정(set), 제거(unset)하거나 유효성을 검증(validate)함. 또한 현재 사용 중인 설정 파일의 경로를 확인할 수 있음. 하위 명령어 없이 실행할 경우 대화형 설정 마법사가 시작됨 ([`openclaw configure`](/cli/configure)와 동일).

## 사용 예시

```bash
# 활성화된 설정 파일 경로 출력
openclaw config file

# 특정 경로의 설정값 조회
openclaw config get browser.executablePath

# 특정 경로에 값 설정
openclaw config set browser.executablePath "/usr/bin/google-chrome"

# 하트비트 주기 변경
openclaw config set agents.defaults.heartbeat.every "2h"

# 특정 에이전트의 실행 노드 지정
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"

# 특정 설정 항목 제거
openclaw config unset tools.web.search.apiKey

# 현재 설정의 유효성 검증
openclaw config validate

# 검증 결과를 JSON 형식으로 출력
openclaw config validate --json
```

## 경로 표기법 (Paths)

점(Dot) 또는 대괄호(Bracket) 표기법을 지원함:

```bash
# 점 표기법 사용
openclaw config get agents.defaults.workspace

# 배열 인덱스 접근 (대괄호 표기법)
openclaw config get agents.list[0].id
```

특정 에이전트 인스턴스를 대상으로 설정할 때 유용함:

```bash
# 전체 에이전트 목록 확인
openclaw config get agents.list

# 두 번째 에이전트(인덱스 1)의 설정 수정
openclaw config set agents.list[1].tools.exec.node "my-remote-node"
```

## 값 입력 (Values)

입력된 값은 기본적으로 **JSON5** 형식으로 파싱을 시도하며, 실패할 경우 일반 문자열로 취급함. 엄격한 JSON5 파싱이 필요한 경우 `--strict-json` 플래그를 사용함. (`--json` 플래그는 이전 버전과의 호환을 위해 동일하게 지원됨)

```bash
# 일반 문자열 설정
openclaw config set agents.defaults.heartbeat.every "0m"

# 숫자형 및 배열 설정 (JSON5 파싱 강제)
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## 주요 하위 명령어

* **`config file`**: 현재 활성화된 설정 파일의 절대 경로를 출력함. (`OPENCLAW_CONFIG_PATH` 환경 변수 또는 기본 경로 기준)

<Note>
  설정 변경 사항을 적용하려면 반드시 **Gateway 서버를 재시작**해야 함.
</Note>

## 유효성 검증 (Validate)

Gateway 서버를 실제로 구동하지 않고도 현재 `openclaw.json` 파일이 공식 스키마 규격에 맞는지 즉시 확인함.

```bash
openclaw config validate
openclaw config validate --json
```
