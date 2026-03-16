---
summary: "macOS app에서 Apple device model identifier를 friendly name으로 매핑하는 방식을 설명합니다."
description: "OpenClaw macOS app이 Apple device model identifier JSON을 어디에 벤더링하고, 어떤 upstream source와 NOTICE file로 관리하는지 설명합니다."
read_when:
  - device model identifier mapping이나 NOTICE/license file을 업데이트할 때
  - Instances UI의 device name 표시 방식을 바꿀 때
title: "기기 모델 데이터베이스"
x-i18n:
  source_path: "reference/device-models.md"
---

# 기기 모델 데이터베이스 (friendly names)

macOS companion app은 Apple model identifier(예: `iPad16,6`, `Mac16,6`)를 사람이 읽기 쉬운 이름으로 매핑해 **Instances** UI에 friendly Apple device name을 표시합니다.

매핑은 다음 위치 아래 JSON으로 vendoring됩니다.

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## 데이터 소스

현재는 다음 MIT 라이선스 저장소에서 이 매핑을 vendoring합니다.

- `kyle-seongwoo-jun/apple-device-identifiers`

build를 deterministic하게 유지하기 위해 JSON file은 특정 upstream commit에 고정되어 있습니다. 이 값은 `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`에 기록됩니다.

## 데이터베이스 업데이트

1. pin할 upstream commit을 선택합니다. iOS용 하나, macOS용 하나가 필요합니다.
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md`의 commit hash를 업데이트합니다.
3. 해당 commit에 pin된 JSON file을 다시 다운로드합니다.

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt`가 여전히 upstream과 일치하는지 확인합니다. upstream license가 바뀌었으면 이 파일도 교체하세요.
5. macOS app이 warning 없이 clean build되는지 확인합니다.

```bash
swift build --package-path apps/macos
```
