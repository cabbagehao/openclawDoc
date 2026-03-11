---
summary: "Nextcloud Talk 지원 상태, 기능, 설정"
read_when:
  - Nextcloud Talk 채널 기능을 다룰 때
title: "Nextcloud Talk"
---

# Nextcloud Talk (plugin)

상태: plugin(webhook bot)으로 지원됩니다. direct message, room, reaction, markdown 메시지를 지원합니다.

## Plugin required

Nextcloud Talk는 plugin 형태로 제공되며 core install에는 포함되지 않습니다.

CLI로 설치(npm registry):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

로컬 체크아웃(git repo에서 실행 중일 때):

```bash
openclaw plugins install ./extensions/nextcloud-talk
```

configure/onboarding 중 Nextcloud Talk를 선택했고 git checkout이 감지되면, OpenClaw는 로컬 설치 경로를 자동으로 제안합니다.

자세한 내용: [Plugins](/tools/plugin)

## Quick setup (beginner)

1. Nextcloud Talk plugin을 설치합니다.
2. Nextcloud 서버에서 bot을 생성합니다.

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 대상 room 설정에서 bot을 활성화합니다.
4. OpenClaw를 설정합니다.
   - Config: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 또는 env: `NEXTCLOUD_TALK_BOT_SECRET` (기본 account 전용)
5. gateway를 재시작합니다(또는 onboarding을 마칩니다).

최소 설정:

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

## Notes

- bot은 먼저 DM을 시작할 수 없습니다. 사용자가 먼저 bot에 메시지를 보내야 합니다.
- webhook URL은 Gateway에서 접근 가능해야 합니다. 프록시 뒤에 있다면 `webhookPublicUrl`을 설정하세요.
- bot API는 media upload를 지원하지 않으므로 media는 URL로 전송됩니다.
- webhook payload는 DM과 room을 구분하지 못합니다. `apiUser` + `apiPassword`를 설정하면 room type lookup을 활성화할 수 있습니다. 그렇지 않으면 DM도 room처럼 처리됩니다.

## Access control (DMs)

- 기본값: `channels.nextcloud-talk.dmPolicy = "pairing"`. 알 수 없는 발신자에게 pairing code를 보냅니다.
- 승인 명령:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 공개 DM: `channels.nextcloud-talk.dmPolicy="open"` + `channels.nextcloud-talk.allowFrom=["*"]`
- `allowFrom`은 Nextcloud user ID만 매칭합니다. display name은 무시됩니다.

## Rooms (groups)

- 기본값: `channels.nextcloud-talk.groupPolicy = "allowlist"`(mention-gated)
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

- room을 전부 막으려면 allowlist를 비워 두거나 `channels.nextcloud-talk.groupPolicy="disabled"`를 설정하세요.

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

전체 설정: [Configuration](/gateway/configuration)

provider 옵션:

- `channels.nextcloud-talk.enabled`: 채널 시작 활성화/비활성화
- `channels.nextcloud-talk.baseUrl`: Nextcloud 인스턴스 URL
- `channels.nextcloud-talk.botSecret`: bot shared secret
- `channels.nextcloud-talk.botSecretFile`: secret file 경로
- `channels.nextcloud-talk.apiUser`: room lookup용 API user(DM 감지)
- `channels.nextcloud-talk.apiPassword`: room lookup용 API/app password
- `channels.nextcloud-talk.apiPasswordFile`: API password file 경로
- `channels.nextcloud-talk.webhookPort`: webhook listener 포트(기본값: 8788)
- `channels.nextcloud-talk.webhookHost`: webhook host(기본값: 0.0.0.0)
- `channels.nextcloud-talk.webhookPath`: webhook 경로(기본값: /nextcloud-talk-webhook)
- `channels.nextcloud-talk.webhookPublicUrl`: 외부에서 접근 가능한 webhook URL
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.nextcloud-talk.allowFrom`: DM allowlist(user ID). `open`에는 `"*"`가 필요
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`
- `channels.nextcloud-talk.groupAllowFrom`: group allowlist(user ID)
- `channels.nextcloud-talk.rooms`: room별 설정과 allowlist
- `channels.nextcloud-talk.historyLimit`: group history limit(0이면 비활성)
- `channels.nextcloud-talk.dmHistoryLimit`: DM history limit(0이면 비활성)
- `channels.nextcloud-talk.dms`: DM별 override(historyLimit)
- `channels.nextcloud-talk.textChunkLimit`: outbound text chunk 크기(문자 수)
- `channels.nextcloud-talk.chunkMode`: `length`(기본값) 또는 `newline`. 길이 분할 전에 빈 줄(문단 경계)에서 먼저 분리
- `channels.nextcloud-talk.blockStreaming`: 이 채널의 block streaming 비활성화
- `channels.nextcloud-talk.blockStreamingCoalesce`: block streaming coalesce 조정
- `channels.nextcloud-talk.mediaMaxMb`: 수신 media 최대 크기(MB)
