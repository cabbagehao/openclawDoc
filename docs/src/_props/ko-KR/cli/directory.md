---
summary: "연락처, 그룹 및 자신의 계정 정보 조회를 위한 `openclaw directory` 명령어 레퍼런스"
read_when:
  - 특정 채널의 연락처, 그룹 ID 또는 자신의 계정 식별자를 조회하고자 할 때
  - 채널 디렉터리 어댑터(Adapter)를 개발하거나 테스트할 때
title: "directory"
x-i18n:
  source_path: "cli/directory.md"
---

# `openclaw directory`

디렉터리 조회 기능을 지원하는 채널에서 연락처(Peers), 그룹 및 자신의 계정("me") 정보를 조회함.

## 공통 플래그

* **`--channel <name>`**: 채널 ID 또는 별칭. (여러 채널이 설정된 경우 필수 입력이며, 하나만 설정된 경우 자동으로 선택됨)
* **`--account <id>`**: 계정 ID. (미지정 시 해당 채널의 기본 계정 사용)
* **`--json`**: 기계 판독이 가능한 JSON 형식으로 결과 출력.

## 참고 사항

* `directory` 명령어는 다른 명령어(특히 `openclaw message send --target ...`)에 활용할 수 있는 식별자(ID)를 찾는 데 도움을 줌.
* 상당수의 채널에서 조회 결과는 실시간 공급자 디렉터리가 아닌, 설정 파일에 등록된 허용 목록(Allowlist)이나 구성된 그룹 정보를 기반으로 함.
* 기본 출력 형식은 탭(Tab)으로 구분된 `ID`와 `이름`임. 스크립트 작성 시에는 `--json` 옵션 사용을 권장함.

## 조회 결과를 `message send`에 활용하는 방법

```bash
# 1. Slack에서 특정 사용자 ID 찾기
openclaw directory peers list --channel slack --query "U0"

# 2. 확인된 ID를 대상으로 메시지 전송
openclaw message send --channel slack --target user:U012ABCDEF --message "안녕하세요"
```

## 채널별 ID 형식 가이드

* **WhatsApp**: `+821012345678` (개인), `1234567890-1234567890@g.us` (그룹)
* **Telegram**: `@사용자명` 또는 숫자 형식의 채팅 ID (그룹 역시 숫자 ID 사용)
* **Slack**: `user:U...` (사용자), `channel:C...` (채널)
* **Discord**: `user:<id>` (사용자), `channel:<id>` (채널)
* **Matrix (플러그인)**: `user:@사용자:서버`, `room:!룸ID:서버` 또는 `#별칭:서버`
* **Microsoft Teams (플러그인)**: `user:<id>`, `conversation:<id>`
* **Zalo (플러그인)**: 봇 API 사용자 ID
* **Zalo Personal / `zalouser` (플러그인)**: 스레드 ID (개인/그룹), 친구 목록, 그룹 목록 등

## 자기 자신 정보 조회 ("me")

```bash
openclaw directory self --channel zalouser
```

## 피어 조회 (연락처/사용자)

```bash
# 전체 목록 조회
openclaw directory peers list --channel zalouser

# 검색어 필터링
openclaw directory peers list --channel zalouser --query "이름"

# 출력 개수 제한
openclaw directory peers list --channel zalouser --limit 50
```

## 그룹 조회

```bash
# 전체 그룹 목록 조회
openclaw directory groups list --channel zalouser

# 그룹명 검색
openclaw directory groups list --channel zalouser --query "업무"

# 특정 그룹의 멤버 목록 조회
openclaw directory groups members --channel zalouser --group-id <ID>
```
