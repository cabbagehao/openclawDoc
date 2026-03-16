---
summary: "gogcli를 사용해 Gmail Pub/Sub push를 OpenClaw webhook에 연결하는 방법을 설명합니다."
description: "Gmail watch, Pub/Sub push, `gog gmail watch serve`, OpenClaw webhook을 연결해 받은편지함 이벤트로 에이전트를 깨우는 설정 절차와 운영 시 주의사항을 안내합니다."
read_when:
  - Gmail 받은편지함 트리거를 OpenClaw에 연결할 때
  - 에이전트 wake를 위한 Pub/Sub push를 설정할 때
title: "Gmail PubSub"
x-i18n:
  source_path: "automation/gmail-pubsub.md"
---

# Gmail Pub/Sub -> OpenClaw

목표: Gmail watch -> Pub/Sub push -> `gog gmail watch serve` -> OpenClaw webhook.

## 사전 요구 사항

- `gcloud`가 설치되어 있고 로그인되어 있어야 함 ([install guide](https://docs.cloud.google.com/sdk/docs/install-sdk)).
- `gog` (gogcli)가 설치되어 있고 해당 Gmail 계정에 대해 인증되어 있어야 함 ([gogcli.sh](https://gogcli.sh/)).
- OpenClaw hooks가 활성화되어 있어야 함 ([Webhooks](/automation/webhook) 참조).
- `tailscale`에 로그인되어 있어야 함 ([tailscale.com](https://tailscale.com/)). 지원되는 구성은 공개 HTTPS endpoint에 Tailscale Funnel을 사용하는 방식임.
  다른 tunnel 서비스도 동작할 수 있지만, 직접 연결해야 하며 공식 지원 범위는 아님.
  현재는 Tailscale만 지원함.

Gmail preset mapping을 활성화하는 hook config 예시:

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

Gmail summary를 chat surface로 전달하려면, `deliver`와 선택적인 `channel`/`to`를 설정하는 mapping으로 preset을 override함:

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

고정 channel을 원하면 `channel`과 `to`를 함께 설정함. 그렇지 않으면 `channel: "last"`가 마지막 delivery route를 사용함 (WhatsApp으로 fallback).

Gmail 실행에 더 저렴한 모델을 강제하려면 mapping에 `model`을 설정함 (`provider/model` 또는 alias). `agents.defaults.models`를 강제하면 해당 목록에 포함되어 있어야 함.

Gmail hook 전용 기본 model과 thinking level을 설정하려면 config에 `hooks.gmail.model` / `hooks.gmail.thinking`을 추가함:

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

- Mapping의 개별 `model`/`thinking`이 여전히 이 기본값보다 우선함.
- Fallback 순서는 `hooks.gmail.model` → `agents.defaults.model.fallbacks` → primary(auth/rate-limit/timeouts)임.
- `agents.defaults.models`가 설정되어 있다면 Gmail model이 allowlist에 있어야 함.
- Gmail hook content는 기본적으로 external-content safety boundary로 감싸짐.
  이를 비활성화하려면(위험함) `hooks.gmail.allowUnsafeExternalContent: true`를 설정함.

Payload handling을 더 커스터마이즈하려면 `hooks.mappings` 또는 `~/.openclaw/hooks/transforms` 아래의 JS/TS transform module을 추가함 ([Webhooks](/automation/webhook) 참조).

## 설정 마법사 (권장)

OpenClaw helper를 사용해 전체 구성을 연결할 수 있음 (macOS에서는 brew로 의존성을 설치함):

```bash
openclaw webhooks gmail setup \
  --account openclaw@gmail.com
```

기본값:

- 공개 push endpoint에 Tailscale Funnel을 사용함.
- `openclaw webhooks gmail run`용 `hooks.gmail` config를 작성함.
- Gmail hook preset(`hooks.presets: ["gmail"]`)을 활성화함.

경로 참고: `tailscale.mode`가 활성화되면 OpenClaw는 자동으로
`hooks.gmail.serve.path`를 `/`로 설정하고 공개 경로는
`hooks.gmail.tailscale.path`(기본값 `/gmail-pubsub`)에 유지함. 이는 Tailscale이
proxy 전에 set-path prefix를 제거하기 때문임.
Backend가 prefixed path를 그대로 받아야 하면
`hooks.gmail.tailscale.target`(또는 `--tailscale-target`)을
`http://127.0.0.1:8788/gmail-pubsub` 같은 전체 URL로 설정하고
`hooks.gmail.serve.path`와 일치시킴.

Custom endpoint가 필요하면 `--push-endpoint <url>` 또는 `--tailscale off`를 사용함.

플랫폼 참고: macOS에서는 마법사가 Homebrew를 통해 `gcloud`, `gogcli`, `tailscale`을 설치함. Linux에서는 먼저 수동 설치가 필요함.

Gateway 자동 시작 (권장):

- `hooks.enabled=true`이고 `hooks.gmail.account`가 설정되어 있으면 Gateway가 부팅 시
  `gog gmail watch serve`를 시작하고 watch를 자동 갱신함.
- 직접 daemon을 실행한다면 `OPENCLAW_SKIP_GMAIL_WATCHER=1`로 opt out할 수 있음.
- 수동 daemon을 동시에 실행하지 말아야 하며, 그렇지 않으면
  `listen tcp 127.0.0.1:8788: bind: address already in use` 오류가 발생함.

수동 daemon(`gog gmail watch serve` 시작 + auto-renew):

```bash
openclaw webhooks gmail run
```

## 1회성 설정

1. `gog`가 사용하는 OAuth client를 **소유한 GCP project**를 선택함.

```bash
gcloud auth login
gcloud config set project <project-id>
```

참고: Gmail watch는 Pub/Sub topic이 OAuth client와 같은 project에 있어야 함.

2. API를 활성화함:

```bash
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

3. Topic을 생성함:

```bash
gcloud pubsub topics create gog-gmail-watch
```

4. Gmail push가 publish할 수 있도록 권한을 부여함:

```bash
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

## Watch 시작

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

출력의 `history_id`를 저장해 두면 디버깅에 유용함.

## Push handler 실행

로컬 예시 (shared token auth):

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

- `--token`은 push endpoint를 보호함 (`x-gog-token` 또는 `?token=`).
- `--hook-url`은 OpenClaw `/hooks/gmail`을 가리킴 (mapped; isolated run + summary to main).
- `--include-body`와 `--max-bytes`는 OpenClaw로 보내는 body snippet을 제어함.

권장: `openclaw webhooks gmail run`은 같은 흐름을 감싸고 watch를 자동 갱신함.

## Handler 노출 (고급, 비권장)

Tailscale이 아닌 tunnel이 필요하면 직접 연결하고 push subscription에 공개 URL을 사용함
(unsupported, no guardrails):

```bash
cloudflared tunnel --url http://127.0.0.1:8788 --no-autoupdate
```

생성된 URL을 push endpoint로 사용함:

```bash
gcloud pubsub subscriptions create gog-gmail-watch-push \
  --topic gog-gmail-watch \
  --push-endpoint "https://<public-url>/gmail-pubsub?token=<shared>"
```

Production에서는 안정적인 HTTPS endpoint를 사용하고 Pub/Sub OIDC JWT를 구성한 뒤 다음처럼 실행함:

```bash
gog gmail watch serve --verify-oidc --oidc-email <svc@...>
```

## 테스트

감시 중인 inbox로 메시지를 보냄:

```bash
gog gmail send \
  --account openclaw@gmail.com \
  --to openclaw@gmail.com \
  --subject "watch test" \
  --body "ping"
```

Watch 상태와 history를 확인함:

```bash
gog gmail watch status --account openclaw@gmail.com
gog gmail history --account openclaw@gmail.com --since <historyId>
```

## 문제 해결

- `Invalid topicName`: project mismatch(topic이 OAuth client project에 없음).
- `User not authorized`: topic에 `roles/pubsub.publisher`가 누락됨.
- Empty messages: Gmail push는 `historyId`만 제공하므로 `gog gmail history`로 가져와야 함.

## 정리

```bash
gog gmail watch stop --account openclaw@gmail.com
gcloud pubsub subscriptions delete gog-gmail-watch-push
gcloud pubsub topics delete gog-gmail-watch
```
