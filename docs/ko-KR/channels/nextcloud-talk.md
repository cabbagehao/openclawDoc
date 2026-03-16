---
summary: "Nextcloud Talk 지원 상태, 기능, 구성 방법"
read_when:
  - Nextcloud Talk 채널 기능을 작업할 때
title: "Nextcloud Talk"
description: "Nextcloud Talk plugin 설치, webhook bot 설정, DM·room 접근 제어, capability와 configuration 옵션을 설명합니다."
x-i18n:
  source_path: "channels/nextcloud-talk.md"
---

# Nextcloud Talk (plugin)

상태: plugin(webhook bot)으로 지원됩니다. direct messages, rooms, reactions,
markdown messages를 지원합니다.

## Plugin 필요

Nextcloud Talk는 plugin으로 제공되며 core install에 번들되어 있지 않습니다.

CLI 설치(npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

로컬 checkout:

```bash
openclaw plugins install ./extensions/nextcloud-talk
```

configure/onboarding 중 Nextcloud Talk를 선택하고 git checkout이 감지되면,
OpenClaw는 로컬 install path를 자동으로 제안합니다.

자세한 내용: [Plugins](/tools/plugin)

## 빠른 설정(beginner)

1. Nextcloud Talk plugin을 설치합니다.
2. Nextcloud server에서 bot을 만듭니다.

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 대상 room 설정에서 bot을 활성화합니다.
4. OpenClaw를 설정합니다.
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 또는 env: `NEXTCLOUD_TALK_BOT_SECRET` (default account only)
5. gateway를 재시작합니다(또는 onboarding을 끝냅니다).

최소 구성:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 참고

- bot은 DM을 먼저 시작할 수 없습니다. 사용자가 먼저 bot에게 메시지를 보내야
  합니다.
- webhook URL은 Gateway에서 도달 가능해야 합니다. proxy 뒤에 있다면
  `webhookPublicUrl`을 설정하세요.
- bot API는 media upload를 지원하지 않으므로 media는 URL로 전송됩니다.
- webhook payload는 DM과 room을 구분하지 못합니다. `apiUser` +
  `apiPassword`를 설정하면 room type lookup을 활성화할 수 있습니다
  (그렇지 않으면 DM도 room으로 취급).

## 접근 제어(DM)

- 기본값: `channels.nextcloud-talk.dmPolicy = "pairing"`. 알 수 없는 sender는
  pairing code를 받습니다.
- 승인 방법:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 공개 DM: `channels.nextcloud-talk.dmPolicy="open"` +
  `channels.nextcloud-talk.allowFrom=["*"]`
- `allowFrom`은 Nextcloud user ID만 매칭합니다. display name은 무시됩니다.

## Rooms(groups)

- 기본값: `channels.nextcloud-talk.groupPolicy = "allowlist"` (mention-gated)
- `channels.nextcloud-talk.rooms`로 room allowlist를 설정합니다.

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- room을 하나도 허용하지 않으려면 allowlist를 비워 두거나
  `channels.nextcloud-talk.groupPolicy="disabled"`를 사용하세요.

## Capabilities

| Feature         | Status        |
| --------------- | ------------- |
| Direct messages | Supported     |
| Rooms           | Supported     |
| Threads         | Not supported |
| Media           | URL-only      |
| Reactions       | Supported     |
| Native commands | Not supported |

## Configuration reference (Nextcloud Talk)

전체 구성: [Configuration](/gateway/configuration)

Provider option:

- `channels.nextcloud-talk.enabled`: 채널 시작 활성화/비활성화
- `channels.nextcloud-talk.baseUrl`: Nextcloud instance URL
- `channels.nextcloud-talk.botSecret`: bot shared secret
- `channels.nextcloud-talk.botSecretFile`: regular-file secret path. symlink는 거부
- `channels.nextcloud-talk.apiUser`: room lookup용 API user(DM detection)
- `channels.nextcloud-talk.apiPassword`: room lookup용 API/app password
- `channels.nextcloud-talk.apiPasswordFile`: API password file path
- `channels.nextcloud-talk.webhookPort`: webhook listener port (기본 8788)
- `channels.nextcloud-talk.webhookHost`: webhook host (기본 0.0.0.0)
- `channels.nextcloud-talk.webhookPath`: webhook path (기본 `/nextcloud-talk-webhook`)
- `channels.nextcloud-talk.webhookPublicUrl`: 외부에서 도달 가능한 webhook URL
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.nextcloud-talk.allowFrom`: DM allowlist(user IDs). `open`에는 `"*"` 필요
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`
- `channels.nextcloud-talk.groupAllowFrom`: group allowlist(user IDs)
- `channels.nextcloud-talk.rooms`: room별 설정과 allowlist
- `channels.nextcloud-talk.historyLimit`: group history limit (`0`이면 비활성화)
- `channels.nextcloud-talk.dmHistoryLimit`: DM history limit (`0`이면 비활성화)
- `channels.nextcloud-talk.dms`: DM별 override (`historyLimit`)
- `channels.nextcloud-talk.textChunkLimit`: outbound text chunk size(chars)
- `channels.nextcloud-talk.chunkMode`: `length`(기본) 또는 `newline`
- `channels.nextcloud-talk.blockStreaming`: 이 채널의 block streaming 비활성화
- `channels.nextcloud-talk.blockStreamingCoalesce`: block streaming coalesce tuning
- `channels.nextcloud-talk.mediaMaxMb`: inbound media cap(MB)
