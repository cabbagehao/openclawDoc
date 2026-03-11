---
summary: "에이전트 워크스페이스 가이드: 저장 위치, 파일 구조 및 Git 백업 전략 안내"
read_when:
  - 에이전트 워크스페이스의 개념이나 내부 파일 구조를 이해하고자 할 때
  - 워크스페이스 데이터를 백업하거나 다른 기기로 이전하고 싶을 때
title: "에이전트 워크스페이스"
x-i18n:
  source_path: "concepts/agent-workspace.md"
---

# 에이전트 워크스페이스 (Agent Workspace)

워크스페이스는 에이전트의 '집'이자 활동 공간임. 파일 처리 도구 및 컨텍스트 구성을 위한 유일한 작업 디렉터리이며, 사용자의 사적인 기억 장소로 취급되어야 함.

이는 설정 파일, 자격 증명(Credentials), 세션 데이터가 저장되는 `~/.openclaw/` 폴더와는 엄격히 구분됨.

**중요:** 워크스페이스는 기본적으로 도구가 실행되는 **현재 작업 디렉터리(CWD)** 역할을 수행하지만, 그 자체로 하드웨어적인 샌드박스는 아님. 상대 경로는 워크스페이스를 기준으로 해석되나, 샌드박싱 기능을 활성화하지 않을 경우 절대 경로를 통해 시스템의 다른 위치에 접근할 수도 있음. 격리된 환경이 필요한 경우 [`agents.defaults.sandbox`](/gateway/sandboxing) 설정을 활용할 것을 권장함.

## 기본 저장 위치

* **기본 경로**: `~/.openclaw/workspace`
* `OPENCLAW_PROFILE` 환경 변수가 설정된 경우(예: `"dev"`), `~/.openclaw/workspace-<profile>` 경로가 사용됨.
* `~/.openclaw/openclaw.json` 파일에서 경로를 직접 변경할 수 있음:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `configure`, `setup` 명령어를 실행하면 해당 경로에 워크스페이스를 생성하고 필수 초기 파일들을 자동으로 채워줌(Seeding).

기존에 직접 관리하는 워크스페이스 파일이 있다면, 초기 파일 자동 생성을 비활성화할 수 있음:

```json5
{ agent: { skipBootstrap: true } }
```

## 중복 워크스페이스 관리

이전 버전의 설치 방식에 따라 `~/openclaw` 폴더가 존재할 수 있음. 여러 개의 워크스페이스 폴더를 방치할 경우 인증 정보 불일치나 상태 동기화 문제가 발생할 수 있음.

**권장 사항**: 하나의 활성 워크스페이스만 유지할 것을 권장함. 사용하지 않는 폴더는 백업 후 삭제하거나 휴지통으로 이동 시키는 것이 좋음. 의도적으로 여러 개를 운영할 경우 `agents.defaults.workspace` 설정이 현재 사용하려는 경로를 정확히 가리키고 있는지 확인함.

`openclaw doctor` 명령어로 중복된 워크스페이스 폴더가 있는지 진단할 수 있음.

## 워크스페이스 파일 구성 (Map)

OpenClaw가 워크스페이스 내부에서 인식하는 표준 파일들임:

* **`AGENTS.md`**
  * 에이전트 운영 지침 및 기억(Memory) 데이터 활용 방법 정의.
  * 모든 세션 시작 시 항상 로드됨. 에이전트의 원칙, 우선순위, 행동 강령을 명시하기에 가장 적합한 장소임.
* **`SOUL.md`**
  * 에이전트의 성격(Persona), 말투, 행동 경계 정의.
* **`USER.md`**
  * 사용자에 대한 정보 및 선호하는 호칭 정의.
* **`IDENTITY.md`**
  * 에이전트의 이름, 고유한 분위기(Vibe), 상징 이모지 정보. 부트스트래핑 과정에서 생성 및 업데이트됨.
* **`TOOLS.md`**
  * 로컬 도구 사용법 및 규칙에 대한 가이드. (실제 도구 권한을 제어하지는 않음)
* **`HEARTBEAT.md`**
  * 주기적인 하트비트 실행 시 참고할 짧은 체크리스트. 비용 절감을 위해 가급적 짧게 유지함.
* **`BOOT.md`**
  * 내부 훅 활성화 시 Gateway 재시작 시점에 실행될 작업 목록.
* **`BOOTSTRAP.md`**
  * 최초 실행 시 수행되는 일회성 절차 정의. 과정이 완료되면 자동으로 삭제됨.
* **`memory/YYYY-MM-DD.md`**
  * 일일 단위 기억 로그. 세션 시작 시 최근 며칠간의 기록을 읽어 맥락을 파악함.
* **`MEMORY.md` (선택 사항)**
  * 정제된 장기 기억 데이터. 주로 비공개 메인 세션에서만 활용됨.

상세 워크플로우는 [기억 시스템(Memory)](/concepts/memory) 참조.

* **`skills/` (선택 사항)**: 해당 워크스페이스 전용 커스텀 스킬 저장소.
* **`canvas/` (선택 사항)**: 노드 출력용 Canvas UI 리소스(HTML 등).

파일 누락 시 시스템은 경고 문구를 삽입하고 실행을 계속함. 너무 큰 파일은 전송 시 잘릴 수 있으므로 `bootstrapMaxChars` 설정으로 제한을 조절할 수 있음.

## 워크스페이스에 포함되지 않는 항목

다음 데이터는 `~/.openclaw/` 하위에 저장되며, 워크스페이스 Git 저장소에 포함(Commit)해서는 안 됨:

* `openclaw.json` (전체 설정)
* `credentials/` (인증 토큰, API 키)
* `agents/<agentId>/sessions/` (대화 기록 및 메타데이터)
* `skills/` (관리형 스킬 데이터)

## Git을 활용한 백업 전략 (권장)

워크스페이스는 에이전트의 개인적인 기억이므로, **비공개(Private)** Git 저장소로 관리하여 안전하게 백업하고 복구할 수 있도록 함.

### 1. 저장소 초기화

Gateway가 실행 중인 기기에서 다음 명령어를 수행함:

```bash
cd ~/.openclaw/workspace
git init
git add .
git commit -m "Initial workspace setup"
```

### 2. 비공개 원격 저장소 연결

GitHub나 GitLab에서 비공개 저장소를 생성한 후 연동함:

```bash
git branch -M main
git remote add origin <저장소-URL>
git push -u origin main
```

### 3. 지속적인 업데이트

```bash
git add .
git commit -m "Update memory"
git push
```

## 보안 주의사항: 비밀 정보 노출 금지

비공개 저장소라 할지라도 다음 정보는 워크스페이스에 직접 저장하지 않는 것이 안전함:

* 실제 API 키, OAuth 토큰, 각종 비밀번호.
* `~/.openclaw/` 폴더 내의 민감한 파일.
* 대화 내용 전문이나 민감한 첨부 파일 원본.

민감한 값이 필요한 경우 환경 변수나 별도의 시크릿 관리 도구를 활용하고, 워크스페이스에는 참조값만 남겨둠.

**권장 `.gitignore` 예시:**

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## 워크스페이스 이전 방법

1. 새로운 기기의 원하는 경로에 Git 저장소를 클론(Clone)함.
2. `openclaw.json` 파일의 `agents.defaults.workspace` 값을 해당 경로로 수정함.
3. `openclaw setup --workspace <경로>` 명령어를 실행하여 누락된 파일을 보충함.
4. 대화 기록이 필요한 경우 구 기기의 `sessions/` 폴더를 별도로 복사함.
