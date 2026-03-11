---
summary: "gogcli를 통해 OpenClaw webhook과 연결되는 Gmail Pub/Sub push"
read_when:
  - Gmail 받은편지함 트리거를 OpenClaw에 연결할 때
  - 에이전트 wake용 Pub/Sub push를 설정할 때
title: "Gmail PubSub"
x-i18n:
  source_path: "automation/gmail-pubsub.md"
---

# Gmail Pub/Sub -> OpenClaw

목표: Gmail watch -> Pub/Sub push -> `gog gmail watch serve` -> OpenClaw webhook

## 사전 준비

- `gcloud` 설치 및 로그인 완료([설치 가이드](https://docs.cloud.google.com/sdk/docs/install-sdk))
- Gmail 계정에 대해 `gog`(gogcli) 설치 및 인증 완료([gogcli.sh](https://gogcli.sh/))
- OpenClaw hooks 활성화([Webhooks](/automation/webhook) 참고)
- `tailscale` 로그인 완료([tailscale.com](https://tailscale.com/)). 지원되는 구성은 공개 HTTPS 엔드포인트로 Tailscale Funnel을 사용하는 방식입니다.
  다른 터널 서비스도 동작할 수는 있지만, 직접 구성해야 하고 공식 지원 대상은 아닙니다.
  현재 지원하는 것은 Tailscale입니다.

예시 hook 설정(Gmail preset mapping 활성화):

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    path: "/hooks",
    presets: ["gmail"],
  },
}
```

Gmail 요약을 채팅 인터페이스로 전달하려면, `deliver`와 선택적 `channel`/`to`를 지정하는 mapping으로 preset을 덮어쓰면 됩니다.

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    presets: ["gmail"],
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "New email from {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}\n{{messages[0].body}}",
        model: "openai/gpt-5.2-mini",
        deliver: true,
        channel: "last",
        // to: "+15551234567"
      },
    ],
  },
}
```

고정 채널로 보내고 싶다면 `channel`과 `to`를 모두 지정하세요. 그렇지 않으면 `channel: "last"`가 마지막 전달 경로를 사용하며(없으면 WhatsApp으로 폴백) 동작합니다.

Gmail 실행에 더 저렴한 모델을 강제하고 싶다면 mapping에 `model`을 지정하세요(`provider/model` 또는 alias). `agents.defaults.models`를 강제한다면 그 allowlist에 해당 모델이 포함돼 있어야 합니다.

Gmail hook 전용 기본 모델과 thinking level을 설정하려면 config에 `hooks.gmail.model` / `hooks.gmail.thinking`을 추가하세요.

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

참고:

- mapping의 hook별 `model`/`thinking`이 여전히 이 기본값보다 우선합니다.
- 폴백 순서: `hooks.gmail.model` → `agents.defaults.model.fallbacks` → 기본 모델(auth/rate-limit/timeouts 처리용)
- `agents.defaults.models`가 설정돼 있다면 Gmail 모델은 해당 allowlist에 있어야 합니다.
- Gmail hook 콘텐츠는 기본적으로 외부 콘텐츠 안전 경계로 감싸집니다.
  이를 끄려면(위험) `hooks.gmail.allowUnsafeExternalContent: true`를 설정하세요.

payload 처리를 더 세밀하게 바꾸고 싶다면 `hooks.mappings` 또는 `~/.openclaw/hooks/transforms` 아래의 JS/TS transform module을 추가하세요([Webhooks](/automation/webhook) 참고).

## 마법사(권장)

OpenClaw helper를 사용하면 전체 구성을 한 번에 연결할 수 있습니다(macOS에서는 brew로 의존성 자동 설치).

```bash
openclaw webhooks gmail setup \
  --account openclaw@gmail.com
```

기본 동작:

- 공개 push 엔드포인트에 Tailscale Funnel 사용
- `openclaw webhooks gmail run`용 `hooks.gmail` config 작성
- Gmail hook preset 활성화(`hooks.presets: ["gmail"]`)

경로 관련 참고: `tailscale.mode`가 활성화되면 OpenClaw는 `hooks.gmail.serve.path`를 자동으로 `/`로 설정하고, 공개 경로는 `hooks.gmail.tailscale.path`(기본값 `/gmail-pubsub`)에 유지합니다. 이는 Tailscale이 프록시 전에 set-path 접두사를 제거하기 때문입니다.
백엔드가 접두사 포함 경로를 그대로 받아야 한다면 `hooks.gmail.tailscale.target`(또는 `--tailscale-target`)을 `http://127.0.0.1:8788/gmail-pubsub` 같은 전체 URL로 지정하고 `hooks.gmail.serve.path`와 맞추세요.

커스텀 엔드포인트가 필요하다면 `--push-endpoint <url>` 또는 `--tailscale off`를 사용하세요.

플랫폼 참고: macOS에서는 마법사가 Homebrew를 통해 `gcloud`, `gogcli`, `tailscale`을 설치합니다. Linux에서는 먼저 수동으로 설치해야 합니다.

Gateway 자동 시작(권장):

- `hooks.enabled=true`이고 `hooks.gmail.account`가 설정돼 있으면, Gateway는 부팅 시 `gog gmail watch serve`를 시작하고 watch를 자동 갱신합니다.
- 이를 비활성화하려면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정하세요(직접 데몬을 운용할 때 유용).
- 수동 데몬과 동시에 실행하지 마세요. `listen tcp 127.0.0.1:8788: bind: address already in use` 오류가 발생합니다.

수동 데몬(`gog gmail watch serve` 시작 + watch 자동 갱신):

```bash
openclaw webhooks gmail run
```

## 1회성 설정

1. `gog`가 사용하는 OAuth client를 소유한 GCP 프로젝트를 선택합니다.

```bash
gcloud auth login
gcloud config set project <project-id>
```

참고: Gmail watch를 사용하려면 Pub/Sub topic이 OAuth client와 같은 프로젝트 안에 있어야 합니다.

2. API 활성화:

```bash
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

3. topic 생성:

```bash
gcloud pubsub topics create gog-gmail-watch
```

4. Gmail push가 publish할 수 있도록 권한 부여:

```bash
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

## watch 시작

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

출력되는 `history_id`를 저장해 두세요(디버깅 시 필요).

## push handler 실행

로컬 예시(shared token auth):

```bash
gog gmail watch serve \
  --account openclaw@gmail.com \
  --bind 127.0.0.1 \
  --port 8788 \
  --path /gmail-pubsub \
  --token <shared> \
  --hook-url http://127.0.0.1:18789/hooks/gmail \
  --hook-token OPENCLAW_HOOK_TOKEN \
  --include-body \
  --max-bytes 20000
```

참고:

- `--token`은 push 엔드포인트를 보호합니다(`x-gog-token` 또는 `?token=`).
- `--hook-url`은 OpenClaw의 `/hooks/gmail`을 가리킵니다(mapping된 경로, isolated run + main 요약).
- `--include-body`와 `--max-bytes`는 OpenClaw로 전달할 본문 스니펫 범위를 제어합니다.

권장: `openclaw webhooks gmail run`은 같은 흐름을 감싸고 watch를 자동 갱신합니다.

## handler 노출(고급, 비지원)

Tailscale이 아닌 터널을 써야 한다면, 공개 URL을 push subscription에 직접 연결해야 합니다(공식 지원/가드레일 없음).

```bash
cloudflared tunnel --url http://127.0.0.1:8788 --no-autoupdate
```

생성된 URL을 push 엔드포인트로 사용:

```bash
gcloud pubsub subscriptions create gog-gmail-watch-push \
  --topic gog-gmail-watch \
  --push-endpoint "https://<public-url>/gmail-pubsub?token=<shared>"
```

운영 환경에서는 안정적인 HTTPS 엔드포인트와 Pub/Sub OIDC JWT를 사용한 뒤 다음처럼 실행하세요.

```bash
gog gmail watch serve --verify-oidc --oidc-email <svc@...>
```

## 테스트

감시 대상 inbox로 메시지를 보냅니다.

```bash
gog gmail send \
  --account openclaw@gmail.com \
  --to openclaw@gmail.com \
  --subject "watch test" \
  --body "ping"
```

watch 상태와 history 확인:

```bash
gog gmail watch status --account openclaw@gmail.com
gog gmail history --account openclaw@gmail.com --since <historyId>
```

## 문제 해결

- `Invalid topicName`: 프로젝트 불일치(topic이 OAuth client 프로젝트에 없음)
- `User not authorized`: topic에 `roles/pubsub.publisher` 권한이 없음
- 메시지가 비어 있음: Gmail push는 `historyId`만 제공하므로 `gog gmail history`로 조회해야 함

## 정리

```bash
gog gmail watch stop --account openclaw@gmail.com
gcloud pubsub subscriptions delete gog-gmail-watch-push
gcloud pubsub topics delete gog-gmail-watch
```
