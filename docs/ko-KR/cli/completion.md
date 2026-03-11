---
summary: "CLI reference for `openclaw completion` (셸 completion 스크립트 생성/설치)"
read_when:
  - zsh/bash/fish/PowerShell 용 셸 completion 을 원할 때
  - OpenClaw 상태 디렉터리 아래에 completion 스크립트를 캐시해야 할 때
title: "completion"
---

# `openclaw completion`

셸 completion 스크립트를 생성하고, 선택적으로 셸 프로필에 설치합니다.

## Usage

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## Options

- `-s, --shell <shell>`: 셸 대상 (`zsh`, `bash`, `powershell`, `fish`; 기본값: `zsh`)
- `-i, --install`: 셸 프로필에 source 줄을 추가해 completion 을 설치
- `--write-state`: 스크립트를 stdout 에 출력하지 않고 `$OPENCLAW_STATE_DIR/completions` 에 기록
- `-y, --yes`: 설치 확인 프롬프트 건너뛰기

## 메모

- `--install` 은 셸 프로필에 작은 "OpenClaw Completion" 블록을 쓰고, 이를 캐시된 스크립트로 연결합니다.
- `--install` 이나 `--write-state` 가 없으면 명령은 스크립트를 stdout 에 출력합니다.
- completion 생성은 명령 트리를 미리 로드하므로 중첩 하위 명령까지 포함됩니다.
