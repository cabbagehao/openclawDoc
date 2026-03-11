---
summary: "Gateway 및 채널 연결 상태를 점검하고 가이드에 따라 자동 복구를 수행하는 `openclaw doctor` 명령어 레퍼런스"
read_when:
  - 시스템 연결 또는 인증 문제가 발생하여 가이드 기반의 해결책이 필요할 때
  - 소스 업데이트 후 시스템의 전반적인 정상 동작 여부를 확인하고자 할 때
title: "doctor"
x-i18n:
  source_path: "cli/doctor.md"
---

# `openclaw doctor`

Gateway 서버 및 각 통신 채널의 상태를 점검(Health check)하고, 발견된 문제에 대한 빠른 수정(Quick fixes) 기능을 제공함.

**관련 문서:**
- 문제 해결 가이드: [Troubleshooting](/gateway/troubleshooting)
- 보안 감사 및 점검: [Security](/gateway/security)

## 사용 예시

```bash
# 기본 점검 실행
openclaw doctor

# 발견된 문제 자동 수정 시도
openclaw doctor --repair

# 상세 네트워크 및 의존성 점검 수행
openclaw doctor --deep
```

## 참고 사항

- **대화형 모드**: 키체인이나 OAuth 수정과 같은 대화형 프롬프트는 터미널(TTY) 환경에서 실행 중이며 `--non-interactive` 플래그가 설정되지 않은 경우에만 작동함. 크론 작업이나 백그라운드 실행 시에는 프롬프트 단계를 자동으로 건너뜀.
- **자동 수정 및 백업**: `--fix` (또는 `--repair`) 옵션 사용 시, 기존 설정 파일을 `~/.openclaw/openclaw.json.bak` 경로에 백업함. 이후 정의되지 않은 설정 키를 제거하며 변경 내역을 요약하여 출력함.
- **데이터 무결성 검사**: 세션 디렉터리에 연결 정보가 없는 고아(Orphan) 대화 이력 파일이 있는지 감지함. 공간 확보를 위해 이들을 `.deleted.<timestamp>` 형식으로 아카이브 처리할 수 있음.
- **크론(Cron) 작업 최적화**: `~/.openclaw/cron/jobs.json` 파일을 스캔하여 이전 버전 형식의 작업을 최신 규격으로 자동 마이그레이션함.
- **기능 준비 상태 점검**: 벡터 검색(Memory-search) 환경을 확인하고, 임베딩 모델의 자격 증명이 누락된 경우 설정 마법사 실행을 권고함.
- **샌드박스 진단**: 샌드박스 모드가 활성화되어 있으나 Docker를 사용할 수 없는 경우, Docker 설치 또는 기능 비활성화를 제안하는 고휘도 경고 메시지를 표시함.

## macOS: `launchctl` 환경 변수 우선순위 주의

과거에 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (또는 `...PASSWORD`) 명령어를 실행한 적이 있다면, 해당 값이 설정 파일의 값보다 우선 적용되어 지속적인 "Unauthorized" 인증 오류를 유발할 수 있음.

**상태 확인 명령어:**
```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD
```

**환경 변수 제거 명령어 (문제 발생 시):**
```bash
launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```
