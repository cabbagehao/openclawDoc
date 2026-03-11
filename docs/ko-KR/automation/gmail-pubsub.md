---
summary: "gogcli를 활용하여 Gmail Pub/Sub 이벤트를 OpenClaw 웹훅으로 연동하는 가이드"
read_when:
  - Gmail 수신 이벤트를 OpenClaw와 연동하고자 할 때
  - 에이전트를 깨우기 위한 Pub/Sub 푸시 설정을 구축할 때
title: "Gmail Pub/Sub 연동"
x-i18n:
  source_path: "automation/gmail-pubsub.md"
---

# Gmail Pub/Sub → OpenClaw 연동

목표: Gmail 감시(Watch) → Pub/Sub 푸시(Push) → `gog gmail watch serve` → OpenClaw 웹훅으로 이어지는 파이프라인 구축.

## 사전 요구 사항

- **`gcloud`**: 설치 및 로그인 완료 ([설치 가이드](https://docs.cloud.google.com/sdk/docs/install-sdk)).
- **`gog` (gogcli)**: 설치 및 대상 Gmail 계정 인증 완료 ([gogcli.sh](https://gogcli.sh/)).
- **OpenClaw 훅(Hooks)**: 활성화 상태여야 함 ([웹훅 가이드](/automation/webhook) 참조).
- **`tailscale`**: 로그인 완료 ([tailscale.com](https://tailscale.com/)). 공식적으로 **Tailscale Funnel**을 통한 공개 HTTPS 엔드포인트 구성을 지원함. (기타 터널 서비스도 가능하나 수동 설정이 필요하며 공식 지원 대상은 아님)

### 훅 설정 예시 (Gmail 프리셋 활성화)

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

Gmail 요약을 특정 채팅 채널로 전달하려면, 프리셋 설정을 덮어쓰는 매핑(Mappings)을 추가하여 `deliver` 속성과 함께 `channel`/`to` 정보를 지정함:

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
        messageTemplate: "새 이메일 수신 (발신: {{messages[0].from}})\n제목: {{messages[0].subject}}\n본문 요약: {{messages[0].snippet}}\n{{messages[0].body}}",
        model: "openai/gpt-4o-mini",
        deliver: true,
        channel: "last",
        // to: "+821012345678"
      },
    ],
  },
}
```

- **`channel: "last"`**: 마지막으로 응답을 보냈던 경로를 사용함 (폴백: WhatsApp). 고정된 채널이 필요한 경우 명시적으로 지정함.
- **모델 설정**: `model` 필드를 통해 더 저렴한 모델을 강제 지정할 수 있음. `agents.defaults.models` 허용 목록을 사용 중이라면 해당 모델이 포함되어 있어야 함.

### Gmail 훅 전용 기본 모델 및 사고 수준 설정

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

**참고 사항:**
- 매핑에 설정된 개별 `model`/`thinking` 값이 이 기본값보다 우선함.
- 우선순위: 매핑 설정 → `hooks.gmail.model` → `agents.defaults.model.fallbacks` → 기본 모델.
- 보안을 위해 Gmail 훅 콘텐츠는 외부 콘텐츠 안전 경계(External-content safety boundaries)로 보호됨. 비활성화 시 위험할 수 있음 (`hooks.gmail.allowUnsafeExternalContent: true`).

## 설정 마법사 활용 (권장)

OpenClaw 헬퍼 명령어를 통해 모든 연동 과정을 한 번에 진행할 수 있음 (macOS는 Homebrew를 통해 의존성 자동 설치):

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

**기본 동작:**
- Tailscale Funnel을 사용하여 공개 푸시 엔드포인트를 구성함.
- `openclaw webhooks gmail run` 실행을 위한 `hooks.gmail` 설정을 기록함.
- Gmail 훅 프리셋을 자동으로 활성화함.

**플랫폼별 참고**: macOS는 마법사가 `gcloud`, `gogcli`, `tailscale`을 자동 설치하나, Linux 환경에서는 수동으로 먼저 설치해야 함.

### Gateway 자동 시작 설정
- `hooks.enabled=true`이고 `hooks.gmail.account`가 설정되어 있으면, Gateway 시작 시 `gog gmail watch serve`가 자동으로 실행되며 감시 주기를 스스로 갱신함.
- 이를 원치 않을 경우(직접 데몬을 관리할 경우) `OPENCLAW_SKIP_GMAIL_WATCHER=1`을 설정함.

### 수동 데몬 실행
```bash
openclaw webhooks gmail run
```

---

## 1회성 초기 설정 (One-time setup)

1. **GCP 프로젝트 선택**: `gog`에서 사용하는 OAuth 클라이언트가 속한 프로젝트를 지정함. (주의: Pub/Sub 토픽은 반드시 동일 프로젝트 내에 위치해야 함)
   ```bash
   gcloud auth login
   gcloud config set project <project-id>
   ```

2. **API 활성화**:
   ```bash
   gcloud services enable gmail.googleapis.com pubsub.googleapis.com
   ```

3. **Pub/Sub 토픽 생성**:
   ```bash
   gcloud pubsub topics create gog-gmail-watch
   ```

4. **권한 부여**: Gmail 푸시 서비스가 토픽에 발행할 수 있도록 허용함.
   ```bash
   gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
     --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
     --role=roles/pubsub.publisher
   ```

## 감시(Watch) 시작

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```
출력 결과의 `history_id`를 디버깅용으로 따로 보관해 두는 것이 좋음.

## 푸시 핸들러(Push Handler) 실행

로컬 실행 예시 (공유 토큰 인증 방식):

```bash
gog gmail watch serve \
  --account openclaw@gmail.com \
  --bind 127.0.0.1 \
  --port 8788 \
  --path /gmail-pubsub \
  --token <shared-token> \
  --hook-url http://127.0.0.1:18789/hooks/gmail \
  --hook-token OPENCLAW_HOOK_TOKEN \
  --include-body \
  --max-bytes 20000
```

- **`--token`**: 푸시 엔드포인트 보안 설정.
- **`--hook-url`**: OpenClaw 웹훅 경로를 지정함.
- **`--include-body` / `--max-bytes`**: OpenClaw로 전달할 본문 스니펫의 양을 제어함.

<Note>
`openclaw webhooks gmail run` 명령어는 위 흐름을 모두 포함하며 감시 주기를 자동으로 관리해주므로 사용을 권장함.
</Note>

## 테스트 및 문제 해결

**전송 테스트:**
```bash
gog gmail send \
  --account openclaw@gmail.com \
  --to openclaw@gmail.com \
  --subject "감시 테스트" \
  --body "테스트 메시지입니다."
```

**상태 및 이력 확인:**
```bash
gog gmail watch status --account openclaw@gmail.com
gog gmail history --account openclaw@gmail.com --since <historyId>
```

**주요 문제 상황:**
- **`Invalid topicName`**: GCP 프로젝트 설정이 일치하지 않는 경우 발생.
- **`User not authorized`**: 토픽에 `roles/pubsub.publisher` 권한이 누락된 경우.
- **메시지 본문 누락**: Gmail 푸시는 `historyId`만 제공하므로, 반드시 `gog gmail history`를 통해 실제 내용을 가져와야 함.

## 정리 (Cleanup)

```bash
gog gmail watch stop --account openclaw@gmail.com
gcloud pubsub subscriptions delete gog-gmail-watch-push
gcloud pubsub topics delete gog-gmail-watch
```
