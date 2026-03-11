---
summary: "macOS 권한 유지(TCC) 및 서명 요구 사항"
read_when:
  - macOS 권한 프롬프트가 누락되거나 멈췄을 때 디버깅할 때
  - macOS 앱을 패키징하거나 서명할 때
  - 번들 ID 또는 앱 설치 경로를 변경할 때
title: "macOS 권한"
---

# macOS 권한(TCC)

macOS 권한 부여는 깨지기 쉽습니다. TCC는 권한 부여를 앱의 코드 서명,
번들 식별자, 디스크상의 경로와 연결합니다. 이 중 하나라도 바뀌면
macOS는 앱을 새 앱으로 취급하고 프롬프트를 삭제하거나 숨길 수 있습니다.

## 안정적인 권한을 위한 요구 사항

* 동일한 경로: 앱을 고정된 위치에서 실행하세요(OpenClaw의 경우 `dist/OpenClaw.app`).
* 동일한 번들 식별자: 번들 ID를 바꾸면 새로운 권한 식별자가 생성됩니다.
* 서명된 앱: 서명되지 않았거나 ad-hoc 서명된 빌드는 권한을 유지하지 않습니다.
* 일관된 서명: 실제 Apple Development 또는 Developer ID 인증서를 사용해
  다시 빌드해도 서명이 안정적으로 유지되도록 하세요.

Ad-hoc 서명은 빌드할 때마다 새로운 식별자를 생성합니다. macOS는 이전에
부여된 권한을 잊어버리며, 오래된 항목을 지우기 전까지 프롬프트가 완전히
사라질 수도 있습니다.

## 프롬프트가 사라졌을 때의 복구 체크리스트

1. 앱을 종료합니다.
2. 시스템 설정 -> 개인정보 보호 및 보안에서 앱 항목을 제거합니다.
3. 같은 경로에서 앱을 다시 실행하고 권한을 다시 부여합니다.
4. 그래도 프롬프트가 나타나지 않으면 `tccutil`로 TCC 항목을 초기화한 뒤 다시 시도합니다.
5. 일부 권한은 macOS를 완전히 재시작한 뒤에만 다시 나타납니다.

초기화 예시(필요에 따라 번들 ID 교체):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## 파일 및 폴더 권한(Desktop/Documents/Downloads)

macOS는 터미널/백그라운드 프로세스에 대해 Desktop, Documents, Downloads도
제한할 수 있습니다. 파일 읽기나 디렉터리 목록 조회가 멈춘다면, 파일 작업을
수행하는 동일한 프로세스 컨텍스트(예: Terminal/iTerm, LaunchAgent로 실행된 앱,
또는 SSH 프로세스)에 접근 권한을 부여하세요.

우회 방법: 폴더별 권한 부여를 피하고 싶다면 파일을 OpenClaw workspace
(`~/.openclaw/workspace`)로 옮기세요.

권한을 테스트하는 경우에는 항상 실제 인증서로 서명하세요. Ad-hoc 빌드는
권한이 중요하지 않은 빠른 로컬 실행에만 허용됩니다.
