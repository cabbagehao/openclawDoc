---
summary: "셸 자동 완성(Shell Completion) 스크립트 생성 및 설치를 위한 `openclaw completion` 명령어 레퍼런스"
read_when:
  - zsh, bash, fish, PowerShell 등에서 OpenClaw 명령어 자동 완성 기능을 사용하고 싶을 때
  - 자동 완성 스크립트를 OpenClaw 상태 디렉터리에 캐싱하고자 할 때
title: "completion"
x-i18n:
  source_path: "cli/completion.md"
---

# `openclaw completion`

셸 자동 완성(Completion) 스크립트를 생성하고, 사용 중인 셸 프로필(Profile)에 자동으로 설치함.

## 사용법

```bash
# 기본 실행 (기본값 zsh 스크립트 출력)
openclaw completion

# 특정 셸용 스크립트 출력
openclaw completion --shell zsh

# 셸 프로필에 자동 완성 설정 추가 (권장)
openclaw completion --install

# fish 셸용 자동 완성 설치
openclaw completion --shell fish --install

# 표준 출력 대신 상태 디렉터리에 스크립트 파일 저장
openclaw completion --write-state

# bash용 스크립트를 파일로 저장
openclaw completion --shell bash --write-state
```

## 주요 옵션

- **`-s, --shell <shell>`**: 대상 셸 지정 (`zsh`, `bash`, `powershell`, `fish`). 기본값은 `zsh`임.
- **`-i, --install`**: 셸 프로필 파일에 `source` 구문을 추가하여 자동 완성 기능을 영구적으로 설치함.
- **`--write-state`**: 생성된 스크립트를 화면에 출력하지 않고 `$OPENCLAW_STATE_DIR/completions` 경로에 파일로 저장함.
- **`-y, --yes`**: 설치 시 사용자 확인 프롬프트를 건너뛰고 즉시 실행함.

## 참고 사항

- `--install` 옵션 사용 시, 셸 프로필 파일에 "OpenClaw Completion" 주석 블록과 함께 캐시된 스크립트 경로를 로드하는 코드가 삽입됨.
- `--install` 또는 `--write-state` 옵션을 지정하지 않으면 생성된 스크립트 내용이 터미널 화면(stdout)에 직접 출력됨.
- 자동 완성 스크립트 생성 시 모든 하위 명령어와 옵션 트리를 분석하므로, 중첩된 서브 명령어도 완벽하게 지원함.
