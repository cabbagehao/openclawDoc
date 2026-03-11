---
summary: "Zalo Personal 플러그인: native zca-js 기반 QR 로그인 + 메시징(플러그인 설치 + 채널 설정 + 도구)"
read_when:
  - OpenClaw에서 Zalo Personal(비공식) 지원을 쓰고 싶을 때
  - zalouser 플러그인을 설정하거나 개발할 때
title: "Zalo Personal 플러그인"
x-i18n:
  source_path: "plugins/zalouser.md"
---

# Zalo Personal (플러그인)

일반 Zalo 개인 계정을 자동화하는 native `zca-js`를 사용하는 OpenClaw용 Zalo Personal 지원 플러그인입니다.

> **경고:** 비공식 자동화는 계정 정지/차단으로 이어질 수 있습니다. 사용 책임은 본인에게 있습니다.

## 이름 규칙

채널 id는 `zalouser`입니다. 이것이 **개인 Zalo 사용자 계정**(비공식)을 자동화한다는 점을 명확히 하기 위해서입니다. `zalo`는 향후 공식 Zalo API 통합 가능성을 위해 비워 둡니다.

## 실행 위치

이 플러그인은 **Gateway 프로세스 내부**에서 실행됩니다.

원격 Gateway를 사용 중이라면, **Gateway가 실행되는 머신**에 설치하고 설정한 뒤 Gateway를 재시작하세요.

외부 `zca`/`openzca` CLI 바이너리는 필요하지 않습니다.

## 설치

### 옵션 A: npm에서 설치

```bash
openclaw plugins install @openclaw/zalouser
```

이후 Gateway를 재시작하세요.

### 옵션 B: 로컬 폴더에서 설치(dev)

```bash
openclaw plugins install ./extensions/zalouser
cd ./extensions/zalouser && pnpm install
```

이후 Gateway를 재시작하세요.

## 설정

채널 설정은 `plugins.entries.*`가 아니라 `channels.zalouser` 아래에 있습니다.

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## 에이전트 도구

도구 이름: `zalouser`

액션: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

채널 메시지 액션은 메시지 반응용 `react`도 지원합니다.
