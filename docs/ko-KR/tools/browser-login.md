---
summary: "브라우저 자동화를 위한 수동 로그인 + X/Twitter 게시"
read_when:
  - 브라우저 자동화를 위해 사이트에 로그인해야 할 때
  - X/Twitter에 업데이트를 게시하고 싶을 때
title: "브라우저 로그인"
---

# 브라우저 로그인 + X/Twitter 게시

## 수동 로그인(권장)

사이트에서 로그인이 필요하면 **호스트** 브라우저 프로필(openclaw 브라우저)에서 **직접 로그인**하세요.

모델에 자격 증명을 제공하지 마세요. 자동 로그인은 종종 봇 방지 대책을 유발해 계정을 잠글 수 있습니다.

기본 브라우저 문서로 돌아가기: [Browser](/tools/browser).

## 어떤 Chrome 프로필이 사용되나요?

OpenClaw는 **전용 Chrome 프로필**(`openclaw`, 주황색 톤 UI)을 제어합니다. 이 프로필은 평소에 사용하는 브라우저 프로필과 분리되어 있습니다.

접속하는 쉬운 방법은 두 가지입니다.

1. **에이전트에게 브라우저를 열어 달라고 요청한 다음** 직접 로그인합니다.
2. **CLI로 엽니다**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

프로필이 여러 개라면 `--browser-profile <name>`을 전달하세요(기본값은 `openclaw`).

## X/Twitter: 권장 흐름

- **읽기/검색/스레드:** **호스트** 브라우저를 사용합니다(수동 로그인).
- **업데이트 게시:** **호스트** 브라우저를 사용합니다(수동 로그인).

## 샌드박싱 + 호스트 브라우저 접근

샌드박스된 브라우저 세션은 봇 감지에 걸릴 가능성이 **더 높습니다**. X/Twitter(및 다른 엄격한 사이트)에서는 **호스트** 브라우저를 우선 사용하세요.

에이전트가 샌드박스에서 실행 중이면 브라우저 도구는 기본적으로 샌드박스를 사용합니다. 호스트 제어를 허용하려면 다음을 설정하세요.

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

그런 다음 호스트 브라우저를 대상으로 지정합니다.

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

또는 업데이트를 게시하는 에이전트의 샌드박싱을 비활성화하세요.
