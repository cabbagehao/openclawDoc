---
summary: "OpenClaw의 rolling diagnostics file log와 unified log privacy 설정을 설명합니다."
description: "macOS에서 OpenClaw app 로그를 파일로 캡처하는 방법과 `ai.openclaw` subsystem의 private data logging을 켜고 끄는 절차를 정리합니다."
read_when:
  - macOS log를 캡처하거나 private data logging을 조사할 때
  - voice wake나 session lifecycle 문제를 디버깅할 때
title: "macOS 로깅"
x-i18n:
  source_path: "platforms/mac/logging.md"
---

# 로깅 (macOS)

## Rolling diagnostics file log (Debug pane)

OpenClaw는 macOS app log를 `swift-log`로 라우팅합니다. 기본 출력은 unified logging이지만, 오래 보관할 캡처가 필요하면 disk에 local rolling file log를 쓸 수 있습니다.

- verbosity: **디버그 창 -> Logs -> App logging -> Verbosity**
- enable: **디버그 창 -> Logs -> App logging -> "Write rolling diagnostics log (JSONL)"**
- location: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (자동 회전되며 이전 파일은 `.1`, `.2`, ... 접미사를 사용)
- clear: **디버그 창 -> Logs -> App logging -> "Clear"**

메모:

- 이 기능은 **기본적으로 꺼져 있습니다**. 실제 디버깅 중일 때만 켜세요.
- 이 파일은 민감한 정보로 취급해야 합니다. 검토 없이 공유하지 마세요.

## macOS unified logging의 private data

unified logging은 subsystem이 `privacy -off`에 opt in하지 않으면 대부분의 payload를 가립니다. Peter의 macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) 글처럼, 이 설정은 subsystem 이름을 key로 쓰는 `/Library/Preferences/Logging/Subsystems/` 아래 plist로 제어됩니다. 새 log entry에만 적용되므로, 이슈를 재현하기 전에 먼저 켜야 합니다.

## OpenClaw (`ai.openclaw`)에 대해 활성화

- 먼저 plist를 temp file에 쓴 뒤 root로 atomic install을 수행합니다:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- reboot는 필요 없습니다. `logd`가 파일을 빠르게 감지하지만, private payload는 새 log line에만 반영됩니다.
- 더 풍부한 출력은 예를 들어 `./scripts/clawlog.sh --category WebChat --last 5m`처럼 기존 helper로 볼 수 있습니다.

## 디버깅 후 비활성화

- override 제거: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`
- 필요하면 `sudo log config --reload`를 실행해 `logd`가 override를 즉시 버리게 할 수 있습니다.
- 이 surface에는 전화번호와 message body가 포함될 수 있습니다. 추가 세부 정보가 정말 필요할 때만 plist를 유지하세요.
