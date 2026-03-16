---
title: "위협 모델 기여하기"
description: "OpenClaw 위협 모델에 threat, mitigation, attack chain을 제안하고 review 과정이 어떻게 진행되는지 설명합니다."
x-i18n:
  source_path: "security/CONTRIBUTING-THREAT-MODEL.md"
---

# OpenClaw 위협 모델에 기여하기

OpenClaw를 더 안전하게 만드는 데 도움을 주셔서 감사합니다. 이 위협 모델은 살아 있는 문서이며, 보안 전문가가 아니어도 누구나 기여할 수 있습니다.

## 기여 방법

### 위협 추가하기

아직 다루지 않은 attack vector나 risk를 발견했나요? [openclaw/trust](https://github.com/openclaw/trust/issues)에 issue를 열고, 자신의 말로 scenario를 설명해 주세요. 어떤 framework를 알 필요도 없고, 모든 field를 채울 필요도 없습니다. 상황만 설명하면 됩니다.

**도움이 되는 정보(필수는 아님):**

- attack scenario와 exploitation 방식
- 영향을 받는 OpenClaw 구성요소(CLI, gateway, channels, ClawHub, MCP servers 등)
- 체감 severity (low / medium / high / critical)
- 관련 연구, CVE, 실제 사례 링크

ATLAS mapping, threat IDs, risk assessment는 review 중에 maintainers가 처리합니다. 원한다면 이런 정보를 함께 적어도 좋지만 필수는 아닙니다.

> **이 문서는 threat model에 내용을 추가하기 위한 것입니다. live vulnerabilities를 신고하는 용도가 아닙니다.** 실제 exploitable vulnerability를 찾았다면 [Trust page](https://trust.openclaw.ai)에서 responsible disclosure 절차를 확인하세요.

### 완화책 제안하기

기존 threat에 대응하는 아이디어가 있나요? 해당 threat를 참조하는 issue나 PR을 열어 주세요. 좋은 mitigation은 구체적이고 실행 가능해야 합니다. 예를 들어 “gateway에서 sender별 분당 10건 rate limiting”은 “rate limiting을 구현하자”보다 훨씬 유용합니다.

### 공격 체인 제안하기

attack chains는 여러 threats가 결합해 현실적인 공격 scenario를 만드는 방식을 보여 줍니다. 위험한 조합을 발견했다면 단계와 공격자가 어떻게 이를 연결하는지 설명해 주세요. 형식적인 템플릿보다 실제 전개 과정을 보여 주는 짧은 narrative가 더 가치 있습니다.

### 기존 내용 수정 또는 개선

오탈자, 설명 보완, 오래된 정보, 더 나은 examples 모두 환영합니다. 이런 경우에는 issue 없이 바로 PR을 열어도 됩니다.

## 우리가 사용하는 것

### MITRE ATLAS

이 threat model은 [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)를 기반으로 합니다. 이는 prompt injection, tool misuse, agent exploitation 같은 AI/ML threats를 위해 설계된 framework입니다. 기여를 위해 ATLAS를 알 필요는 없습니다. 제출된 내용은 review 중에 framework에 맞춰 매핑됩니다.

### Threat ID

각 threat에는 `T-EXEC-003` 같은 ID가 부여됩니다. categories는 다음과 같습니다.

| Code    | Category                    |
| ------- | --------------------------- |
| RECON   | Reconnaissance - 정보 수집       |
| ACCESS  | Initial access - 진입 확보       |
| EXEC    | Execution - 악성 행위 실행       |
| PERSIST | Persistence - 접근 유지          |
| EVADE   | Defense evasion - 탐지 회피      |
| DISC    | Discovery - 환경 정보 수집       |
| EXFIL   | Exfiltration - 데이터 유출       |
| IMPACT  | Impact - 피해 또는 서비스 중단   |

IDs는 maintainers가 review 중에 부여합니다. 직접 고를 필요는 없습니다.

### 위험도 수준

| Level        | Meaning                                                   |
| ------------ | --------------------------------------------------------- |
| **Critical** | 전체 시스템 장악, 또는 높은 가능성 + 치명적 영향          |
| **High**     | 심각한 피해 가능성이 높음, 또는 중간 가능성 + 치명적 영향 |
| **Medium**   | 중간 수준의 위험, 또는 낮은 가능성 + 높은 영향            |
| **Low**      | 가능성이 낮고 영향도 제한적                               |

risk level이 확실하지 않다면 impact만 설명해 주세요. 평가는 우리가 합니다.

## 검토 절차

1. **Triage** - 새 submissions는 48시간 이내 검토
2. **Assessment** - feasibility 검증, ATLAS mapping과 threat ID 부여, risk level 확인
3. **Documentation** - 형식과 내용 완비 여부 점검
4. **Merge** - threat model과 visualization에 반영

## 참고 자료

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/security/THREAT-MODEL-ATLAS)

## 연락처

- **보안 취약점:** 신고 절차는 [Trust page](https://trust.openclaw.ai)를 참고하세요
- **위협 모델 관련 질문:** [openclaw/trust](https://github.com/openclaw/trust/issues)에 issue를 등록하세요
- **일반 대화:** Discord `#security` 채널

## 기여자 인정

위협 모델 기여자는 acknowledgments, release notes, 그리고 중요한 기여가 있을 경우 OpenClaw security hall of fame에서 인정받습니다.
