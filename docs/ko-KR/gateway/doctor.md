---
summary: "Doctor 명령: health check, config migration, repair step"
read_when:
  - doctor migration을 추가하거나 수정할 때
  - breaking config change를 도입할 때
title: "Doctor"
---

# Doctor

`openclaw doctor`는 OpenClaw의 repair + migration 도구입니다. 오래된 config/state를 수정하고, health를 점검하며, 실행 가능한 repair step을 제시합니다.

## Quick start

```bash
openclaw doctor
```

### Headless / automation

```bash
openclaw doctor --yes
```

프롬프트 없이 기본값을 수락합니다. 적용 가능한 경우 restart/service/sandbox repair step도 포함됩니다.

```bash
openclaw doctor --repair
```

권장 repair를 프롬프트 없이 적용합니다. 안전한 범위의 repair + restart를 포함합니다.

```bash
openclaw doctor --repair --force
```

더 공격적인 repair도 적용합니다. 커스텀 supervisor config를 덮어쓸 수 있습니다.

```bash
openclaw doctor --non-interactive
```

프롬프트 없이 실행하고, 안전한 migration(config normalization + 디스크 상태 이동)만 적용합니다. 사람 확인이 필요한 restart/service/sandbox action은 건너뜁니다.
레거시 state migration은 감지되면 자동 실행됩니다.

```bash
openclaw doctor --deep
```

시스템 서비스에서 추가 gateway install(launchd/systemd/schtasks)을 스캔합니다.

쓰기 전에 변경 내용을 검토하고 싶다면 먼저 config 파일을 여세요.

```bash
cat ~/.openclaw/openclaw.json
```

## What it does (summary)

- git install에 대한 선택적 pre-flight update(대화형일 때만)
- UI protocol freshness check(protocol schema가 더 새로우면 Control UI 재빌드)
- Health check + restart prompt
- Skills 상태 요약(eligible/missing/blocked)
- 레거시 값을 현재 형식으로 config normalization
- OpenCode Zen provider override 경고(`models.providers.opencode`)
- 레거시 디스크 상태 migration(sessions/agent dir/WhatsApp auth)
- 레거시 cron store migration(`jobId`, `schedule.cron`, 최상위 delivery/payload field, payload `provider`, 단순 `notify: true` webhook fallback job)
- State 무결성 및 권한 점검(session, transcript, state dir)
- 로컬 실행 시 config file 권한 점검(chmod 600)
- 모델 인증 상태: OAuth 만료 확인, 만료 임박 token refresh 가능, auth-profile cooldown/disabled 상태 보고
- 추가 workspace dir 감지(`~/openclaw`)
- sandboxing이 활성화된 경우 sandbox image repair
- 레거시 서비스 migration 및 추가 gateway 감지
- Gateway 런타임 점검(서비스는 설치됐지만 실행 중이 아님, cached launchd label 등)
- Channel 상태 경고(실행 중 gateway를 probe해서 확인)
- Supervisor config audit(launchd/systemd/schtasks) 및 선택적 repair
- Gateway 런타임 best-practice 점검(Node vs Bun, version-manager 경로)
- Gateway 포트 충돌 진단(기본값 `18789`)
- open DM policy 보안 경고
- 로컬 token mode에서 Gateway auth 점검(token source가 없으면 token 생성 제안, token SecretRef 설정은 덮어쓰지 않음)
- Linux의 systemd linger check
- 소스 설치 점검(pnpm workspace mismatch, UI asset 누락, tsx binary 누락)
- 업데이트된 config + wizard metadata 기록

## Detailed behavior and rationale

### 0) Optional update (git installs)

git checkout이고 doctor가 대화형으로 실행 중이면, doctor 전에 update(fetch/rebase/build)를 할지 묻습니다.

### 1) Config normalization

config에 레거시 값 형식이 있으면(예: 채널별 override 없이 `messages.ackReaction`만 존재), doctor가 이를 현재 schema로 정규화합니다.

### 2) Legacy config key migrations

config에 더 이상 쓰지 않는 key가 있으면, 다른 명령은 실행을 거부하고 `openclaw doctor`를 실행하라고 안내합니다.

Doctor는 다음을 수행합니다.

- 어떤 legacy key가 발견되었는지 설명
- 적용한 migration 표시
- `~/.openclaw/openclaw.json`을 현재 schema로 다시 기록

Gateway도 startup 시 legacy config format을 감지하면 doctor migration을 자동 실행하므로, 오래된 config는 수동 개입 없이 복구됩니다.

현재 migration:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 최상위 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- named `accounts`가 있지만 `accounts.default`가 없는 채널에서는, top-level 단일 account 값을 `channels.<channel>.accounts.default`로 이동
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

Doctor 경고에는 multi-account channel의 account-default 가이드도 포함됩니다.

- `channels.<channel>.defaultAccount` 또는 `accounts.default` 없이 `channels.<channel>.accounts`가 둘 이상 설정되어 있으면, fallback routing이 예상치 못한 account를 선택할 수 있다고 경고합니다.
- `channels.<channel>.defaultAccount`가 존재하지 않는 account ID를 가리키면, doctor가 configured account ID 목록과 함께 경고합니다.

### 2b) OpenCode Zen provider overrides

`models.providers.opencode`(또는 `opencode-zen`)를 수동으로 추가한 경우, `@mariozechner/pi-ai`의 built-in OpenCode Zen catalog를 덮어쓸 수 있습니다. 그러면 모든 모델이 하나의 API로 강제되거나 비용 정보가 0이 될 수 있습니다. doctor는 override를 제거해 모델별 API routing + 비용을 복원하라고 경고합니다.

### 3) Legacy state migrations (disk layout)

Doctor는 이전 디스크 레이아웃을 현재 구조로 migration할 수 있습니다.

- Sessions store + transcript:
  - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
- Agent dir:
  - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
- WhatsApp auth state (Baileys):
  - 레거시 `~/.openclaw/credentials/*.json`(단 `oauth.json` 제외)에서
  - `~/.openclaw/credentials/whatsapp/<accountId>/...`로 (기본 account id: `default`)

이 migration은 best-effort이고 idempotent합니다. 백업으로 남겨진 legacy folder가 있으면 doctor가 경고를 출력합니다. Gateway/CLI도 startup 시 legacy sessions + agent dir를 자동 migration하므로, history/auth/models가 수동 doctor 실행 없이 agent별 경로로 옮겨집니다. 반면 WhatsApp auth는 의도적으로 `openclaw doctor`를 통해서만 migration됩니다.

### 3b) Legacy cron store migrations

Doctor는 cron job store(기본값 `~/.openclaw/cron/jobs.json`, 또는 `cron.store` override 시 해당 경로)에서 scheduler가 호환성 때문에 아직 수용하는 오래된 job 형식도 점검합니다.

현재 cron 정리 항목:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- 최상위 payload field(`message`, `model`, `thinking`, ...) → `payload`
- 최상위 delivery field(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- payload `provider` delivery alias → 명시적 `delivery.channel`
- 단순 레거시 `notify: true` webhook fallback job → 명시적 `delivery.mode="webhook"` + `delivery.to=cron.webhook`

Doctor는 동작을 바꾸지 않고 변환할 수 있을 때만 `notify: true` job을 자동 migration합니다. 레거시 notify fallback과 기존의 non-webhook delivery mode가 함께 있으면, doctor는 경고만 하고 수동 검토를 위해 그대로 둡니다.

### 4) State integrity checks (session persistence, routing, and safety)

state directory는 운영상의 두뇌줄기와 같습니다. 이 경로가 사라지면 session, credential, log, config를 잃게 됩니다. 다른 백업이 없다면 복구할 수 없습니다.

Doctor가 점검하는 항목:

- **State dir missing**: 심각한 state 손실을 경고하고 디렉터리 재생성을 제안하며, 사라진 데이터는 복구할 수 없음을 알림
- **State dir permissions**: 쓰기 가능 여부 확인, 권한 repair 제안, owner/group mismatch가 있으면 `chown` 힌트 출력
- **macOS cloud-synced state dir**: iCloud Drive(`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는 `~/Library/CloudStorage/...` 아래에 있으면 느린 I/O와 lock/sync race를 경고
- **Linux SD 또는 eMMC state dir**: `mmcblk*` mount source에 있으면 세션/credential 쓰기에서 느리고 마모가 빠를 수 있다고 경고
- **Session dirs missing**: `sessions/`와 session store dir은 history 저장과 `ENOENT` crash 방지에 필수
- **Transcript mismatch**: 최근 session entry에 transcript file이 없으면 경고
- **Main session “1-line JSONL”**: main transcript가 한 줄뿐이면 history가 누적되지 않는 것으로 간주하고 경고
- **Multiple state dirs**: 서로 다른 홈 디렉터리에 여러 `~/.openclaw`가 있거나 `OPENCLAW_STATE_DIR`가 다른 곳을 가리키면 history가 여러 설치에 흩어질 수 있다고 경고
- **Remote mode reminder**: `gateway.mode=remote`이면 실제 state가 remote host에 있으므로 그곳에서 doctor를 실행하라고 안내
- **Config file permissions**: `~/.openclaw/openclaw.json`이 group/world readable이면 경고하고 `600`으로 조이도록 제안

### 5) Model auth health (OAuth expiry)

Doctor는 auth store의 OAuth profile을 검사하고, token이 만료 직전인지 이미 만료됐는지 경고하며, 안전할 때는 refresh도 시도할 수 있습니다. Anthropic Claude Code profile이 오래되었다면 `claude setup-token` 실행 또는 setup-token 붙여넣기를 제안합니다.
refresh 프롬프트는 대화형 TTY일 때만 나타나며, `--non-interactive`는 refresh 시도를 건너뜁니다.
