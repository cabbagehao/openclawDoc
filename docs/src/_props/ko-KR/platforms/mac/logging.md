---
summary: "OpenClaw 로깅: 롤링 진단 파일 로그 + 통합 로그 개인정보 플래그"
read_when:
  - macOS 로그를 캡처하거나 개인 데이터 로깅을 조사할 때
  - 음성 깨우기/세션 수명 주기 문제를 디버깅할 때
title: "macOS 로깅"
---

# 로깅 (macOS)

## 롤링 진단 파일 로그 (디버그 창)

OpenClaw 는 macOS 앱 로그를 swift-log(기본적으로 통합 로깅) 를 통해 라우팅하며, 지속적으로 보관할 캡처가 필요할 때는 디스크에 로컬 순환 파일 로그를 쓸 수 있습니다.

* 상세도: **디버그 창 → 로그 → 앱 로깅 → 상세도**
* 활성화: **디버그 창 → 로그 → 앱 로깅 → "롤링 진단 로그 쓰기 (JSONL)"**
* 위치: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (자동으로 순환되며, 이전 파일에는 `.1`, `.2`, … 접미사가 붙습니다)
* 지우기: **디버그 창 → 로그 → 앱 로깅 → "지우기"**

참고:

* 이 기능은 **기본적으로 꺼져 있습니다**. 실제로 디버깅하는 동안에만 켜세요.
* 이 파일은 민감한 데이터로 취급하세요. 검토 없이 공유하지 마세요.

## macOS 에서의 통합 로깅 개인 데이터

통합 로깅은 하위 시스템이 `privacy -off` 에 옵트인하지 않는 한 대부분의 페이로드를 가립니다. Peter 의 macOS [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) 글에 따르면 이는 하위 시스템 이름을 키로 사용하는 `/Library/Preferences/Logging/Subsystems/` 의 plist 로 제어됩니다. 플래그는 새 로그 항목에만 적용되므로, 문제를 재현하기 전에 미리 활성화하세요.

## OpenClaw (`ai.openclaw`) 에 대해 활성화

* 먼저 plist 를 임시 파일에 쓴 다음, root 권한으로 원자적으로 설치합니다:

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

* 재부팅은 필요하지 않습니다. logd 가 이 파일을 빠르게 감지하지만, 개인 페이로드가 포함되는 것은 새 로그 줄뿐입니다.
* 예를 들어 `./scripts/clawlog.sh --category WebChat --last 5m` 처럼 기존 헬퍼를 사용해 더 풍부한 출력을 확인하세요.

## 디버깅 후 비활성화

* 오버라이드를 제거합니다: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
* 필요하다면 `sudo log config --reload` 를 실행해 logd 가 오버라이드를 즉시 버리도록 강제할 수 있습니다.
* 이 표면에는 전화번호와 메시지 본문이 포함될 수 있다는 점을 기억하세요. 추가 세부 정보가 실제로 필요할 때만 plist 를 그대로 두세요.
