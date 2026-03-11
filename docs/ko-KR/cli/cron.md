---
summary: "백그라운드 작업 예약 및 실행을 위한 `openclaw cron` 명령어 레퍼런스"
read_when:
  - 예약된 작업이나 자동 실행(Wakeup) 기능을 설정하고자 할 때
  - 크론 작업의 실행 이력 및 로그를 디버깅할 때
title: "cron"
x-i18n:
  source_path: "cli/cron.md"
---

# `openclaw cron`

Gateway 스케줄러를 통해 실행되는 크론(Cron) 작업을 관리함.

**관련 문서:**
- 크론 작업 가이드: [Cron jobs](/automation/cron-jobs)

**팁**: 전체 명령어 및 옵션 목록을 확인하려면 `openclaw cron --help`를 실행함.

## 참고 사항

- **응답 전달**: 격리된(`isolated`) `cron add` 작업은 기본적으로 `--announce` 전달 방식을 사용함. 결과를 외부로 전송하지 않고 내부에만 유지하려면 `--no-deliver` 플래그를 사용함. (`--deliver`는 `--announce`와 동일한 레거시 별칭임)
- **1회성 작업**: `--at` 옵션으로 설정된 1회성 작업은 성공적으로 실행된 후 자동 삭제됨. 작업 이력을 유지하려면 `--keep-after-run` 옵션을 사용함.
- **재시도 정책**: 반복 작업 중 연속적인 오류가 발생할 경우 지수 백오프(Exponential backoff) 정책(30초 → 1분 → 5분 → 15분 → 60분)이 적용되며, 다음 성공 시 정상 스케줄로 복귀함.
- **실행 방식**: `openclaw cron run` 명령어는 수동 실행 요청이 대기열에 추가되는 즉시 `{ ok: true, enqueued: true, runId }`를 반환함. 실제 최종 실행 결과는 `openclaw cron runs --id <job-id>` 명령어로 추적 가능함.
- **보관 및 정리 (Pruning)**: 설정 파일의 다음 항목을 통해 관리됨:
  - `cron.sessionRetention`: 완료된 격리 세션 보관 기간 (기본값: `24h`).
  - `cron.runLog.maxBytes` / `keepLines`: 실행 로그 파일(`~/.openclaw/cron/runs/<jobId>.jsonl`)의 용량 및 라인 수 제한.

**업그레이드 안내**: 이전 버전의 크론 작업 데이터 형식을 사용 중인 경우 `openclaw doctor --fix` 명령어를 실행하여 최신 규격으로 정규화 및 마이그레이션을 수행할 것을 권장함.

## 일반적인 수정 사례

**메시지는 유지하고 응답 전송 설정만 변경:**
```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

**격리된 작업의 결과 전송 비활성화:**
```bash
openclaw cron edit <job-id> --no-deliver
```

**가벼운 컨텍스트(Lightweight Context) 활성화:**
```bash
openclaw cron edit <job-id> --light-context
```

**특정 Slack 채널로 결과 알림 설정:**
```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

## 신규 작업 생성 예시

가벼운 부트스트랩 컨텍스트를 사용하는 격리된 예약 작업 생성:

```bash
openclaw cron add \
  --name "가벼운 아침 요약" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "어제 밤새 업데이트된 내용을 요약해줘." \
  --light-context \
  --no-deliver
```

<Note>
`--light-context` 플래그는 격리된 에이전트 실행 작업에만 적용됨. 이 모드에서는 전체 워크스페이스 부트스트랩 파일을 주입하는 대신 컨텍스트를 비워두어 자원을 절약함.
</Note>
