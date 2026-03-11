---
summary: "Gateway 서비스 관리 명령의 레거시 별칭인 `openclaw daemon` 명령어 레퍼런스"
read_when:
  - 기존 스크립트에서 `openclaw daemon ...` 형식을 사용 중일 때
  - 서비스 생명주기(설치, 시작, 중지, 재시작, 상태 확인) 명령어가 필요할 때
title: "daemon (Legacy)"
x-i18n:
  source_path: "cli/daemon.md"
---

# `openclaw daemon`

이 명령어는 Gateway 서비스 관리 명령을 위한 레거시 별칭(Alias)임.

`openclaw daemon ...`은 `openclaw gateway` 하위의 서비스 제어 명령어들과 동일한 기능을 수행함.

## 사용법

```bash
openclaw daemon status
openclaw daemon install
openclaw daemon start
openclaw daemon stop
openclaw daemon restart
openclaw daemon uninstall
```

## 주요 하위 명령어

* **`status`**: 서비스 설치 상태를 확인하고 Gateway 서버의 헬스 체크를 수행함.
* **`install`**: 운영체제별 서비스(`launchd`, `systemd`, `schtasks`)로 등록함.
* **`uninstall`**: 등록된 서비스를 제거함.
* **`start`**: 서비스를 시작함.
* **`stop`**: 서비스를 중지함.
* **`restart`**: 서비스를 재시작함.

## 주요 옵션

* **`status`**: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--deep`, `--json`
* **`install`**: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
* **생명주기 관리**: `--json`

## 참고 사항

* **인증 연동**: `status` 명령어 실행 시, 가능한 경우 설정된 시크릿 참조(SecretRef)를 해석하여 인증을 시도함.
* **Linux(systemd)**: `status` 확인 시 `Environment=` 및 `EnvironmentFile=` 유닛 설정에 포함된 토큰 정보의 일치 여부(Drift)를 검사함.
* **시크릿 관리**: `gateway.auth.token`이 SecretRef로 관리되는 경우, `install` 과정에서 해당 참조의 해석 가능 여부를 검증함. 단, 보안을 위해 해석된 평문 토큰값을 서비스 환경 메타데이터에 직접 저장하지는 않음.
* **보안 제어**: 토큰 인증이 필수임에도 SecretRef 해석에 실패하거나, 토큰과 비밀번호가 모두 설정되었음에도 인증 모드(`gateway.auth.mode`)가 지정되지 않은 경우 서비스 설치가 차단됨.

## 권장 사항

향후 버전에서의 지원 중단을 대비하여 가급적 최신 명령어인 [**`openclaw gateway`**](/cli/gateway)를 사용할 것을 권장함.
