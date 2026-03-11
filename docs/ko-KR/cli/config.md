---
summary: "`openclaw config`용 CLI 레퍼런스(get/set/unset/file/validate)"
read_when:
  - 비대화형으로 설정을 읽거나 수정하려고 할 때
title: "config"
---

# `openclaw config`

설정 도우미입니다. 경로 기준으로 값을 get/set/unset/validate하고 현재 활성 설정 파일도 출력합니다. 하위 명령 없이 실행하면 configure 마법사(`openclaw configure`와 동일)를 엽니다.

## 예시

```bash
openclaw config file
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config unset tools.web.search.apiKey
openclaw config validate
openclaw config validate --json
```

## 경로

경로는 점 표기법 또는 대괄호 표기법을 사용합니다.

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

특정 에이전트를 대상으로 하려면 에이전트 목록 인덱스를 사용하세요.

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 값

값은 가능하면 JSON5로 파싱하고, 그렇지 않으면 문자열로 처리합니다. JSON5 파싱을 강제하려면 `--strict-json`을 사용하세요. `--json`은 레거시 별칭으로 계속 지원됩니다.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

## 하위 명령

- `config file`: 활성 설정 파일 경로를 출력합니다(`OPENCLAW_CONFIG_PATH` 또는 기본 위치에서 해석).

수정 후에는 gateway를 재시작하세요.

## 검증

gateway를 시작하지 않고 현재 설정을 활성 스키마에 대조해 검증합니다.

```bash
openclaw config validate
openclaw config validate --json
```
