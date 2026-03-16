---
summary: "macOS TCC permission persistence와 signing requirement를 설명합니다."
description: "macOS에서 권한 프롬프트가 사라지는 이유, stable permission을 유지하려면 무엇이 고정되어야 하는지, `tccutil` 복구 흐름까지 정리합니다."
read_when:
  - macOS permission prompt가 사라지거나 멈췄을 때 디버깅할 때
  - macOS app을 packaging하거나 signing할 때
  - bundle ID 또는 app install path를 바꿀 때
title: "macOS 권한"
x-i18n:
  source_path: "platforms/mac/permissions.md"
---

# macOS 권한 (TCC)

macOS permission grant는 깨지기 쉽습니다. TCC는 권한 부여를 app의 code signature, bundle identifier, on-disk path와 묶어 둡니다. 이 중 하나라도 바뀌면 macOS는 app을 새 app으로 취급하고 prompt를 버리거나 숨길 수 있습니다.

## 안정적인 권한을 위한 요구 사항

- 같은 path: app은 고정된 위치에서 실행해야 합니다. OpenClaw에서는 `dist/OpenClaw.app`이 기준입니다.
- 같은 bundle identifier: bundle ID를 바꾸면 새로운 permission identity가 생깁니다.
- signed app: unsigned build나 ad-hoc signed build는 permission을 유지하지 못합니다.
- 일관된 signature: 실제 Apple Development 또는 Developer ID certificate를 사용해 rebuild 후에도 안정적인 signature를 유지하세요.

ad-hoc signature는 build할 때마다 새로운 identity를 만듭니다. macOS는 이전 grant를 잊어버리고, stale entry를 지우기 전까지 prompt가 완전히 사라질 수도 있습니다.

## prompt가 사라졌을 때의 복구 체크리스트

1. app 종료
2. 시스템 설정 -> 개인정보 보호 및 보안에서 app entry 제거
3. 같은 path에서 app을 다시 실행하고 permission 재부여
4. 그래도 prompt가 안 뜨면 `tccutil`로 TCC entry를 reset한 뒤 다시 시도
5. 일부 permission은 macOS 전체 재시작 뒤에야 다시 나타남

reset 예시(bundle ID는 필요에 맞게 교체):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 파일 및 폴더 권한 (Desktop/Documents/Downloads)

macOS는 terminal/background process에 대해 Desktop, Documents, Downloads 접근도 제한할 수 있습니다. file read나 directory listing이 멈춘다면, 실제 file operation을 수행하는 동일한 process context에 권한을 부여해야 합니다. 예를 들면 Terminal/iTerm, LaunchAgent로 띄운 app, 또는 SSH process가 여기에 해당합니다.

우회 방법으로는 file을 OpenClaw workspace(`~/.openclaw/workspace`)로 옮겨 per-folder grant를 피할 수 있습니다.

permission을 테스트할 때는 항상 실제 certificate로 sign하세요. ad-hoc build는 permission이 중요하지 않은 빠른 local run에만 적합합니다.
