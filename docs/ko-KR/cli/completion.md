---
summary: "CLI reference for `openclaw completion` (generate/install shell completion scripts)"
description: "zsh, bash, fish, PowerShell용 completion script를 생성하거나 shell profile에 설치하는 `openclaw completion` 명령의 옵션을 정리합니다."
read_when:
  - zsh/bash/fish/PowerShell completion을 쓰고 싶을 때
  - completion script를 OpenClaw state 아래에 캐시해야 할 때
title: "completion"
x-i18n:
  source_path: "cli/completion.md"
---

# `openclaw completion`

shell completion script를 생성하고, 원하면 shell profile에 설치합니다.

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

- `-s, --shell <shell>`: 대상 shell (`zsh`, `bash`, `powershell`, `fish`; 기본값: `zsh`)
- `-i, --install`: shell profile에 source line을 추가해 completion을 설치
- `--write-state`: script를 stdout에 출력하지 않고 `$OPENCLAW_STATE_DIR/completions`에 기록
- `-y, --yes`: install confirmation prompt를 건너뜀

## Notes

- `--install`은 shell profile에 작은 "OpenClaw Completion" block을 쓰고, cached script를 가리키게 합니다.
- `--install`과 `--write-state` 둘 다 없으면 command는 script를 stdout으로 출력합니다.
- completion generation은 command tree를 eager하게 로드하므로 nested subcommand도 포함됩니다.
