---
summary: "browser automation에서 수동 로그인과 host browser 사용 원칙을 설명합니다."
description: "OpenClaw browser automation에서 수동 로그인, host browser profile, X/Twitter posting, sandbox host control 설정을 안내합니다."
read_when:
  - browser automation을 위해 사이트에 로그인해야 할 때
  - X/Twitter에 update를 게시하고 싶을 때
title: "브라우저 로그인"
x-i18n:
  source_path: "tools/browser-login.md"
---

# 브라우저 로그인 + X/Twitter 게시

## 수동 로그인(권장)

사이트에서 로그인이 필요하면 **host** browser profile(openclaw browser)에서 **직접 로그인**하세요.

모델에 credential을 제공하지 마세요. 자동 login은 종종 anti-bot 방어를 유발해 계정을 잠글 수 있습니다.

기본 브라우저 문서로 돌아가기: [Browser](/tools/browser).

## 어떤 Chrome 프로필이 사용되나요?

OpenClaw는 **전용 Chrome profile**(`openclaw`, 주황색 톤 UI)을 제어합니다. 이 profile은 평소에 사용하는 browser profile과 분리되어 있습니다.

접속하는 쉬운 방법은 두 가지입니다.

1. **에이전트에게 브라우저를 열어 달라고 요청한 다음** 직접 로그인합니다.
2. **CLI로 엽니다**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

profile이 여러 개라면 `--browser-profile <name>`을 전달하세요(기본값은 `openclaw`).

## X/Twitter: 권장 흐름

- **읽기/검색/스레드:** **host** browser를 사용합니다(수동 로그인).
- **업데이트 게시:** **host** browser를 사용합니다(수동 로그인).

## 샌드박싱 + 호스트 브라우저 접근

sandbox된 browser session은 bot detection에 걸릴 가능성이 **더 높습니다**. X/Twitter(및 다른 엄격한 사이트)에서는 **host** browser를 우선 사용하세요.

agent가 sandbox에서 실행 중이면 browser tool은 기본적으로 sandbox를 사용합니다. host control을 허용하려면 다음을 설정하세요.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

그런 다음 host browser를 대상으로 지정합니다.

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

또는 update를 게시하는 agent의 sandboxing을 비활성화하세요.
