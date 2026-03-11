---
summary: "NIP-04 암호화 메시지 규격을 사용하는 Nostr DM 채널 설정 및 사용 가이드"
read_when:
  - OpenClaw에서 Nostr 네트워크를 통한 DM 수발신 기능을 구현하고자 할 때
  - 탈중앙화된 메시징 환경을 구축할 때
title: "Nostr"
x-i18n:
  source_path: "channels/nostr.md"
---

# Nostr (플러그인)

**상태**: 선택적 플러그인 (기본 비활성화 상태).

Nostr는 소셜 네트워킹을 위한 탈중앙화 프로토콜임. 이 채널을 통해 OpenClaw는 NIP-04 규격에 따라 암호화된 개인 대화(DM)를 수신하고 응답할 수 있음.

## 플러그인 설치

### 온보딩 마법사 활용 (권장)

* `openclaw onboard` 또는 `openclaw channels add` 실행 시 선택 가능한 채널 플러그인 목록에 표시됨.
* Nostr를 선택하면 설치 여부를 묻는 프롬프트가 나타나며 즉시 설치를 진행함.

**설치 경로 규칙:**

* **개발 채널 + Git 소스 환경**: 로컬 플러그인 경로를 우선 사용함.
* **안정/베타 채널**: npm 저장소로부터 최신 패키지를 다운로드함.

### 수동 설치

```bash
openclaw plugins install @openclaw/nostr
```

**로컬 소스 연동 (개발용):**

```bash
openclaw plugins install --link <openclaw-경로>/extensions/nostr
```

설치 또는 활성화 후에는 반드시 **Gateway를 재시작**해야 함.

## 빠른 설정 가이드

1. **Nostr 키 쌍(Keypair) 생성**: (기존 키가 없는 경우)
   ```bash
   # nak 도구 사용 예시
   nak key generate
   ```

2. **설정 파일에 추가**:
   ```json
   {
     "channels": {
       "nostr": {
         "privateKey": "${NOSTR_PRIVATE_KEY}"
       }
     }
   }
   ```

3. **환경 변수 등록**:
   ```bash
   export NOSTR_PRIVATE_KEY="nsec1..."
   ```

4. **Gateway 시작**: 설정 반영을 위해 서버를 구동함.

## 주요 설정 레퍼런스

| 설정 키         | 타입        | 기본값                                         | 설명                           |
| :----------- | :-------- | :------------------------------------------ | :--------------------------- |
| `privateKey` | string    | (필수)                                        | `nsec` 또는 16진수(Hex) 형식의 개인 키 |
| `relays`     | string\[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 접속할 릴레이 URL 목록 (WebSocket)   |
| `dmPolicy`   | string    | `pairing`                                   | DM 접근 제어 정책                  |
| `allowFrom`  | string\[] | `[]`                                        | 허용된 발신자 공개 키(Pubkey) 목록      |
| `enabled`    | boolean   | `true`                                      | 채널 활성화 여부                    |
| `name`       | string    | -                                           | 표시 이름                        |
| `profile`    | object    | -                                           | NIP-01 프로필 메타데이터             |

## 프로필 메타데이터 (Profile)

프로필 정보는 NIP-01 `kind:0` 이벤트로 네트워크에 게시됨. Control UI(Channels -> Nostr -> Profile)에서 관리하거나 설정 파일에서 직접 정의할 수 있음.

**예시:**

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "profile": {
        "name": "openclaw",
        "displayName": "OpenClaw",
        "about": "개인용 인공지능 비서 DM 봇",
        "picture": "https://example.com/avatar.png",
        "website": "https://example.com",
        "nip05": "openclaw@example.com"
      }
    }
  }
}
```

* 프로필 내 이미지 및 웹사이트 URL은 반드시 `https://` 보안 프로토콜을 사용해야 함.
* 릴레이로부터 프로필을 가져올 때 로컬 오버라이드 설정은 보존됨.

## 접근 제어 정책

### DM 정책 (DM Policies)

* **`pairing`** (기본값): 승인되지 않은 발신자에게는 페어링 코드를 전송함.
* **`allowlist`**: `allowFrom`에 등록된 공개 키를 가진 사용자만 대화 가능.
* **`open`**: 모든 공개 DM 수락 (`allowFrom: ["*"]` 설정 필요).
* **`disabled`**: 모든 수신 DM 무시.

### 허용 목록 설정 예시

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

## 키 형식 (Key Formats)

* **개인 키 (Private key)**: `nsec1...` 형식 또는 64자리 16진수 문자열.
* **공개 키 (Pubkey)**: `npub1...` 형식 또는 16진수 문자열.

## 릴레이(Relays) 관리

기본값으로 `relay.damus.io` 및 `nos.lol`을 사용함.

```json
{
  "channels": {
    "nostr": {
      "relays": ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"]
    }
  }
}
```

**팁:**

* 가용성 확보를 위해 2\~3개의 릴레이를 혼용할 것을 권장함.
* 릴레이가 너무 많으면 지연 시간이 늘어나고 중복 수신 부하가 발생할 수 있음.
* 테스트 시에는 로컬 릴레이(`ws://localhost:7777`) 사용 가능.

## 지원 프로토콜 (NIPs)

| 규격     | 상태 | 설명                     |
| :----- | :- | :--------------------- |
| NIP-01 | 지원 | 기본 이벤트 형식 및 프로필 메타데이터  |
| NIP-04 | 지원 | 암호화된 DM (`kind:4`)     |
| NIP-17 | 예정 | 선물 포장(Gift-wrapped) DM |
| NIP-44 | 예정 | 버전 관리형 암호화             |

## 테스트 방법

### 로컬 릴레이 테스트

```bash
# strfry 릴레이 서버 실행 (Docker)
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

### 수동 기능 점검

1. Gateway 로그에서 봇의 공개 키(`npub`)를 확인함.
2. Damus, Amethyst 등 Nostr 클라이언트를 실행함.
3. 확인한 봇 공개 키로 DM을 전송함.
4. 에이전트의 응답이 정상적으로 수신되는지 확인함.

## 문제 해결 (Troubleshooting)

* **메시지 수신 불가**: 개인 키 유효 여부, 릴레이 주소의 오타(`wss://`), `enabled: true` 설정 여부를 재확인함.
* **응답 전송 실패**: 릴레이 서버가 쓰기(Write) 권한을 허용하는지, Gateway 호스트의 아웃바운드 네트워크 환경을 점검함.
* **중복 응답**: 여러 릴레이를 사용할 때 발생할 수 있으나, OpenClaw는 이벤트 ID 기반으로 중복을 제거하여 한 번만 응답을 트리거함.

## 보안 및 제한 사항

* **보안**: 개인 키를 코드 저장소에 직접 커밋하지 말고 환경 변수를 활용할 것. 운영 환경에서는 허용 목록(`allowlist`) 사용을 권장함.
* **제한 (MVP 단계)**: 현재는 개인 대화(DM)만 지원하며 그룹 대화 및 미디어 첨부 기능은 미지원 상태임.
