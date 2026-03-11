---
summary: "NIP-04 암호화 메시지를 사용하는 Nostr DM 채널"
read_when:
  - OpenClaw가 Nostr DM을 수신하게 하고 싶을 때
  - 분산형 메시징을 설정할 때
title: "Nostr"
---

# Nostr

**상태:** 선택적 plugin(기본 비활성)

Nostr는 소셜 네트워킹을 위한 분산형 프로토콜입니다. 이 채널을 사용하면 OpenClaw가 NIP-04를 통해 암호화된 direct message(DM)를 수신하고 응답할 수 있습니다.

## Install (on demand)

### Onboarding (recommended)

- onboarding wizard(`openclaw onboard`)와 `openclaw channels add`는 선택적 channel plugin을 나열합니다.
- Nostr를 선택하면 필요 시 plugin 설치 프롬프트가 나타납니다.

설치 기본 동작:

- **Dev channel + git checkout 가능:** 로컬 plugin 경로 사용
- **Stable/Beta:** npm에서 다운로드

프롬프트에서 언제든 선택을 바꿀 수 있습니다.

### Manual install

```bash
openclaw plugins install @openclaw/nostr
```

로컬 체크아웃 사용(dev workflow):

```bash
openclaw plugins install --link <path-to-openclaw>/extensions/nostr
```

plugin 설치 또는 활성화 후에는 Gateway를 재시작하세요.

## Quick setup

1. 필요하면 Nostr keypair를 생성합니다.

```bash
# nak 사용
nak key generate
```

2. config에 추가합니다.

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}"
    }
  }
}
```

3. key를 export 합니다.

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway를 재시작합니다.

## Configuration reference

| Key          | Type     | Default                                     | Description                      |
| ------------ | -------- | ------------------------------------------- | -------------------------------- |
| `privateKey` | string   | required                                    | `nsec` 또는 hex 형식 private key |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | Relay URL(WebSocket)             |
| `dmPolicy`   | string   | `pairing`                                   | DM 접근 정책                     |
| `allowFrom`  | string[] | `[]`                                        | 허용된 sender pubkey             |
| `enabled`    | boolean  | `true`                                      | 채널 활성화/비활성화             |
| `name`       | string   | -                                           | display name                     |
| `profile`    | object   | -                                           | NIP-01 profile metadata          |

## Profile metadata

profile 데이터는 NIP-01 `kind:0` 이벤트로 게시됩니다. Control UI(Channels -> Nostr -> Profile)에서 관리하거나 config에 직접 지정할 수 있습니다.

예시:

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "profile": {
        "name": "openclaw",
        "displayName": "OpenClaw",
        "about": "Personal assistant DM bot",
        "picture": "https://example.com/avatar.png",
        "banner": "https://example.com/banner.png",
        "website": "https://example.com",
        "nip05": "openclaw@example.com",
        "lud16": "openclaw@example.com"
      }
    }
  }
}
```

참고:

- profile URL은 `https://`를 사용해야 합니다.
- relay에서 가져온 데이터를 병합할 때 로컬 override는 유지됩니다.

## Access control

### DM policies

- **pairing** (기본값): 알 수 없는 발신자는 pairing code를 받습니다.
- **allowlist**: `allowFrom`에 있는 pubkey만 DM 가능
- **open**: 공개 inbound DM 허용(`allowFrom: ["*"]` 필요)
- **disabled**: inbound DM 무시

### Allowlist example

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "dmPolicy": "allowlist",
      "allowFrom": ["npub1abc...", "npub1xyz..."]
    }
  }
}
```

## Key formats

허용 형식:

- **Private key:** `nsec...` 또는 64자 hex
- **Pubkeys (`allowFrom`):** `npub...` 또는 hex

## Relays

기본 relay: `relay.damus.io`, `nos.lol`

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "relays": ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"]
    }
  }
}
```

팁:

- 중복 대비를 위해 relay는 2-3개 정도 사용하세요.
- relay를 너무 많이 쓰면 지연과 중복이 늘어납니다.
- 유료 relay는 안정성을 높일 수 있습니다.
- 테스트에는 로컬 relay도 괜찮습니다(`ws://localhost:7777`).

## Protocol support

| NIP    | Status    | Description                        |
| ------ | --------- | ---------------------------------- |
| NIP-01 | Supported | 기본 event 형식 + profile metadata |
| NIP-04 | Supported | 암호화 DM (`kind:4`)               |
| NIP-17 | Planned   | gift-wrapped DM                    |
| NIP-44 | Planned   | versioned encryption               |

## Testing

### Local relay

```bash
# strfry 시작
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "relays": ["ws://localhost:7777"]
    }
  }
}
```

### Manual test

1. 로그에서 bot pubkey(npub)를 확인합니다.
2. Nostr client(Damus, Amethyst 등)를 엽니다.
3. bot pubkey에 DM을 보냅니다.
4. 응답을 확인합니다.

## Troubleshooting

### Not receiving messages

- private key가 유효한지 확인하세요.
- relay URL에 접근 가능하고 `wss://`(또는 로컬이면 `ws://`)를 사용하는지 확인하세요.
- `enabled`가 `false`가 아닌지 확인하세요.
- Gateway log에서 relay 연결 오류를 확인하세요.

### Not sending responses

- relay가 쓰기를 허용하는지 확인하세요.
- outbound connectivity를 점검하세요.
- relay rate limit이 없는지 확인하세요.

### Duplicate responses

- 여러 relay를 쓸 때는 예상 가능한 동작입니다.
- 메시지는 event ID로 deduplicate되며, 첫 전달만 응답을 트리거합니다.

## Security

- private key는 절대 커밋하지 마세요.
- key는 environment variable로 관리하세요.
- 운영 bot에는 `allowlist`를 고려하세요.

## Limitations (MVP)

- direct message만 지원(group chat 없음)
- media attachment 없음
- NIP-04만 지원(NIP-17 gift-wrap은 예정)
