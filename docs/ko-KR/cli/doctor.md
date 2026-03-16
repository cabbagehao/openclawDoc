---
summary: "CLI reference for `openclaw doctor` (health checks + guided repairs)"
description: "Gateway와 channel 상태를 점검하고 guided repair를 수행하는 `openclaw doctor` 명령의 핵심 점검 항목과 macOS 환경 변수 주의점을 정리합니다."
read_when:
  - connectivity/auth 문제가 있어 guided fix가 필요할 때
  - 업데이트 후 sanity check를 하고 싶을 때
title: "doctor"
x-i18n:
  source_path: "cli/doctor.md"
---

# `openclaw doctor`

gateway와 channel을 위한 health check + quick fix 명령입니다.

Related:

- Troubleshooting: [Troubleshooting](/gateway/troubleshooting)
- Security audit: [Security](/gateway/security)

## Examples

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
```

Notes:

- keychain/OAuth fix 같은 interactive prompt는 stdin이 TTY이고 `--non-interactive`가 **아닌** 경우에만 동작합니다. headless run(cron, Telegram, no terminal)에서는 prompt를 건너뜁니다.
- `--fix` (`--repair`의 alias)는 `~/.openclaw/openclaw.json.bak`에 backup을 쓰고, unknown config key를 제거하면서 각 제거 항목을 출력합니다.
- state integrity check는 이제 sessions directory의 orphan transcript file도 감지하며, 공간 회수를 위해 `.deleted.<timestamp>`로 archive할 수 있습니다.
- doctor는 `~/.openclaw/cron/jobs.json` (또는 `cron.store`)도 검사해 legacy cron job shape를 찾아 scheduler가 runtime에서 auto-normalize하기 전에 in-place rewrite할 수 있습니다.
- memory-search readiness check도 포함하며, embedding credential이 없으면 `openclaw configure --section model`을 권장할 수 있습니다.
- sandbox mode가 켜져 있는데 Docker를 사용할 수 없으면, doctor는 high-signal warning과 함께 remediation (`install Docker` 또는 `openclaw config set agents.defaults.sandbox.mode off`)를 제시합니다.

## macOS: `launchctl` env overrides

예전에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (또는 `...PASSWORD`)를 실행했다면, 이 값이 config file보다 우선되어 지속적인 “unauthorized” 오류를 만들 수 있습니다.

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
