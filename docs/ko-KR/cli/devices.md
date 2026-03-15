---
summary: "기기 페어링 요청 승인, 토큰 로테이션 및 폐기를 관리하는 `openclaw devices` 명령어 레퍼런스"
read_when:
  - 새로운 기기의 페어링 요청을 승인하고자 할 때
  - 특정 기기의 접근 토큰을 갱신하거나 권한을 취소해야 할 때
title: "devices"
x-i18n:
  source_path: "cli/devices.md"
---

# `openclaw devices`

Gateway 기기 페어링 요청 및 기기 범위의 토큰(Device-scoped tokens)을 관리함.

## 주요 명령어

### `openclaw devices list`

대기 중인 페어링 요청 목록과 이미 연결된 기기 목록을 확인함.

```bash
openclaw devices list
openclaw devices list --json
```

### `openclaw devices remove <deviceId>`

등록된 기기 항목을 하나 제거함.

```bash
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

등록된 기기 또는 대기 중인 요청을 일괄 정리함.

```bash
# 연결된 모든 기기 제거
openclaw devices clear --yes

# 대기 중인 모든 요청 제거
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

대기 중인 기기 페어링 요청을 승인함. `requestId`를 생략하면 가장 최근의 요청을 자동으로 승인함.

```bash
# 가장 최근 요청 승인
openclaw devices approve

# 특정 요청 ID 승인
openclaw devices approve <requestId>

# 최신 요청 승인 명시
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

대기 중인 기기 페어링 요청을 거부함.

```bash
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

특정 역할(Role)에 대한 기기 토큰을 로테이션(갱신)함. 필요한 경우 권한 범위(Scope)를 함께 업데이트할 수 있음.

```bash
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `openclaw devices revoke --device <id> --role <role>`

특정 역할에 할당된 기기 토큰을 즉시 폐기함.

```bash
openclaw devices revoke --device <deviceId> --role node
```

## 공통 옵션

- `--url <url>`: Gateway WebSocket 주소 (`gateway.remote.url`이 설정된 경우 해당 값을 기본값으로 사용).
- `--token <token>`: Gateway 인증 토큰.
- `--password <password>`: Gateway 인증 비밀번호.
- `--timeout <ms>`: RPC 요청 타임아웃 시간 (밀리초).
- `--json`: 기계 판독 가능한 JSON 형식으로 결과 출력 (스크립트 활용 시 권장).

<Note>
`--url` 옵션을 명시적으로 지정할 경우, CLI는 설정 파일이나 환경 변수의 자격 증명을 자동으로 참조하지 않음. 반드시 `--token` 또는 `--password`를 함께 전달해야 함.
</Note>

## 참고 사항

- **토큰 보안**: 토큰 로테이션 결과로 반환되는 새로운 토큰은 민감한 정보이므로 외부로 유출되지 않도록 주의함.
- **권한 요구**: 이 명령어들을 실행하려면 `operator.pairing` 또는 `operator.admin` 권한 범위가 필요함.
- **안전 장치**: `devices clear` 명령어는 실수로 인한 대량 삭제를 방지하기 위해 `--yes` 플래그를 필수로 요구함.
- **로컬 폴백**: 로컬 루프백 환경에서 권한 범위가 부족하고 명시적인 `--url`이 지정되지 않은 경우, 시스템은 로컬 전용 페어링 폴백 메커니즘을 사용할 수 있음.
