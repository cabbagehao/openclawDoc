---
summary: "NIP-04 암호화 메시지를 사용하는 Nostr DM 채널"
read_when:
  - OpenClaw가 Nostr를 통해 DM을 받게 하려 할 때
  - 분산 메시징을 설정할 때
title: "Nostr"
description: "Nostr plugin 설치, keypair 설정, relay 구성, DM access policy, profile metadata, testing과 troubleshooting 절차를 설명합니다."
x-i18n:
  source_path: "channels/nostr.md"
---

# Nostr

**상태:** 선택형 plugin(기본 비활성화).

Nostr는 소셜 네트워킹용 분산 프로토콜입니다. 이 채널은 OpenClaw가 NIP-04를
통해 암호화된 direct message(DM)를 수신하고 응답할 수 있게 합니다.

## 설치(필요할 때)

### Onboarding (권장)

- onboarding wizard(`openclaw onboard`)와 `openclaw channels add`는 선택형
  채널 plugin을 나열합니다.
- Nostr를 선택하면 필요할 때 plugin 설치를 진행합니다.

설치 기본값:

- **Dev channel + git checkout 가능:** 로컬 plugin path 사용
- **Stable/Beta:** npm에서 다운로드

프롬프트에서 언제든 선택을 바꿀 수 있습니다.

### 수동 설치

```bash
openclaw plugins install @openclaw/nostr
```

로컬 checkout 사용(dev workflow):

```bash
openclaw plugins install --link <path-to-openclaw>/extensions/nostr
```

plugin을 설치하거나 활성화한 뒤 Gateway를 재시작하세요.

## 빠른 설정

1. Nostr keypair가 없다면 생성:

```bash
# Using nak
nak key generate
```

2. config에 추가:

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}"
    }
  }
}
```

3. key를 export:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Gateway를 재시작합니다.

## Configuration reference

| Key          | Type     | Default                                     | Description                         |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | required                                    | `nsec` 또는 hex 형식 private key    |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | relay URL(WebSocket)                |
| `dmPolicy`   | string   | `pairing`                                   | DM access policy                    |
| `allowFrom`  | string[] | `[]`                                        | 허용된 sender pubkey                |
| `enabled`    | boolean  | `true`                                      | 채널 활성화/비활성화               |
| `name`       | string   | -                                           | 표시 이름                           |
| `profile`    | object   | -                                           | NIP-01 profile metadata             |

## Profile metadata

Profile 데이터는 NIP-01 `kind:0` event로 게시됩니다. Control UI
(Channels -> Nostr -> Profile)에서 관리하거나 config에 직접 넣을 수 있습니다.

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

- Profile URL은 `https://`를 사용해야 합니다.
- relay에서 가져온 profile을 import하면 field를 병합하고 local override를
  유지합니다.

## 접근 제어

### DM policy

- **pairing** (기본): 알 수 없는 sender는 pairing code를 받음
- **allowlist**: `allowFrom`의 pubkey만 DM 가능
- **open**: 공개 inbound DMs (`allowFrom: ["*"]` 필요)
- **disabled**: inbound DM 무시

### Allowlist 예시

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

## Key 형식

허용되는 형식:

- **Private key:** `nsec...` 또는 64자 hex
- **Pubkey (`allowFrom`):** `npub...` 또는 hex

## Relays

기본값: `relay.damus.io`, `nos.lol`

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

- 중복 대비를 위해 2-3개 relay를 사용하세요.
- relay가 너무 많으면 지연과 중복이 늘어납니다.
- 유료 relay는 신뢰성을 높일 수 있습니다.
- 테스트에는 local relay도 괜찮습니다(`ws://localhost:7777`).

## Protocol support

| NIP    | Status    | Description                           |
| ------ | --------- | ------------------------------------- |
| NIP-01 | Supported | 기본 event 형식 + profile metadata    |
| NIP-04 | Supported | 암호화 DM (`kind:4`)                  |
| NIP-17 | Planned   | Gift-wrapped DMs                      |
| NIP-44 | Planned   | Versioned encryption                  |

## Testing

### Local relay

```bash
# Start strfry
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

### 수동 테스트

1. logs에서 bot pubkey(npub)를 확인합니다.
2. Nostr client(Damus, Amethyst 등)를 엽니다.
3. bot pubkey에 DM을 보냅니다.
4. 응답을 확인합니다.

## 문제 해결

### 메시지를 받지 못할 때

- private key가 유효한지 확인
- relay URL이 도달 가능하고 `wss://`를 쓰는지 확인
  (로컬은 `ws://` 가능)
- `enabled`가 `false`가 아닌지 확인
- relay connection error가 있는지 Gateway logs 확인

### 응답을 보내지 못할 때

- relay가 write를 허용하는지 확인
- outbound connectivity 확인
- relay rate limit 확인

### 중복 응답

- 여러 relay를 쓸 때는 예상 가능한 현상입니다.
- 메시지는 event ID로 dedupe되며, 첫 번째 전달만 응답을 트리거합니다.

## 보안

- private key를 절대 커밋하지 마세요.
- key는 env var로 관리하세요.
- 운영 bot에는 `allowlist`를 고려하세요.

## 제한 사항(MVP)

- direct messages만 지원(group chat 없음)
- media attachment 없음
- NIP-04만 지원(NIP-17 gift-wrap은 예정)
