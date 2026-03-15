# OpenClaw 위협 모델에 기여하기

OpenClaw를 더 안전하게 만드는 데 도움을 주셔서 감사합니다. 이 위협 모델은 살아 있는 문서이며, 보안 전문가가 아니어도 누구나 기여할 수 있습니다.

## 기여 방법

### 위협 추가하기

아직 다루지 않은 공격 벡터나 위험을 발견했나요? [openclaw/trust](https://github.com/openclaw/trust/issues)에 이슈를 열고, 당신의 표현으로 시나리오를 설명해 주세요. 어떤 프레임워크를 알 필요도 없고, 모든 필드를 채울 필요도 없습니다. 상황만 설명하면 됩니다.

**도움이 되는 정보(필수는 아님):**

- 공격 시나리오와 악용 방식
- 영향을 받는 OpenClaw 구성요소(CLI, gateway, channels, ClawHub, MCP servers 등)
- 체감 위험도(low / medium / high / critical)
- 관련 연구, CVE, 실제 사례 링크

ATLAS 매핑, threat id, 위험도 평가는 검토 과정에서 유지보수자가 처리합니다. 원한다면 이런 정보를 함께 적어도 좋지만 필수는 아닙니다.

> **이 문서는 위협 모델에 내용을 추가하기 위한 것입니다. 실제 악용 가능한 취약점을 신고하는 용도가 아닙니다.** 실제 취약점을 찾았다면 [Trust 페이지](https://trust.openclaw.ai)에서 책임 있는 공개 절차를 확인하세요.

### 완화책 제안하기

기존 위협에 대응하는 아이디어가 있나요? 해당 위협을 참조하는 이슈나 PR을 열어 주세요. 좋은 완화책은 구체적이고 실행 가능해야 합니다. 예를 들어 “gateway에서 발신자별 초당 10건 rate limiting”은 “rate limiting을 구현하자”보다 훨씬 유용합니다.

### 공격 체인 제안하기

공격 체인은 여러 위협이 결합해 현실적인 공격 시나리오를 만드는 방식을 보여 줍니다. 위험한 조합을 발견했다면 단계와 연결 방식을 설명해 주세요. 형식적인 템플릿보다, 실제로 공격이 어떻게 전개되는지에 대한 짧은 서사가 더 가치 있습니다.

### 기존 내용 수정 또는 개선

오탈자, 설명 보완, 오래된 정보, 더 나은 예시 모두 환영합니다. 이런 경우에는 이슈 없이 바로 PR을 열어도 됩니다.

## 우리가 사용하는 것

### MITRE ATLAS

이 위협 모델은 [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)를 기반으로 합니다. 이는 prompt injection, tool misuse, agent exploitation 같은 AI/ML 위협을 위해 설계된 프레임워크입니다. 기여를 위해 ATLAS를 알 필요는 없습니다. 제출된 내용은 검토 중에 프레임워크에 맞춰 매핑됩니다.

### Threat ID

각 위협에는 `T-EXEC-003` 같은 id가 부여됩니다. 카테고리는 다음과 같습니다.

| Code    | Category                    |
| ------- | --------------------------- |
| RECON   | Reconnaissance - 정보 수집  |
| ACCESS  | Initial access - 침입 시작  |
| EXEC    | Execution - 악성 행위 실행  |
| PERSIST | Persistence - 접근 유지     |
| EVADE   | Defense evasion - 탐지 회피 |
| DISC    | Discovery - 환경 파악       |
| EXFIL   | Exfiltration - 데이터 탈취  |
| IMPACT  | Impact - 피해 또는 장애     |

ID는 유지보수자가 검토 과정에서 부여합니다. 직접 고를 필요는 없습니다.

### 위험도 수준

| Level        | Meaning                                                   |
| ------------ | --------------------------------------------------------- |
| **Critical** | 전체 시스템 장악, 또는 높은 가능성 + 치명적 영향          |
| **High**     | 심각한 피해 가능성이 높음, 또는 중간 가능성 + 치명적 영향 |
| **Medium**   | 중간 수준의 위험, 또는 낮은 가능성 + 높은 영향            |
| **Low**      | 가능성이 낮고 영향도 제한적                               |

위험도 수준이 확실하지 않다면 영향만 설명해 주세요. 평가는 우리가 합니다.

## 검토 절차

1. **Triage** - 새 제출물은 48시간 이내 검토
2. **Assessment** - 실현 가능성 검증, ATLAS 매핑과 threat id 부여, 위험도 확인
3. **Documentation** - 형식과 내용 완비 여부 점검
4. **Merge** - 위협 모델과 시각화에 반영

## 참고 자료

- [ATLAS Website](https://atlas.mitre.org/)
- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/security/THREAT-MODEL-ATLAS)

## 연락처

- **보안 취약점:** 신고 절차는 [Trust 페이지](https://trust.openclaw.ai)를 참고하세요
- **위협 모델 관련 질문:** [openclaw/trust](https://github.com/openclaw/trust/issues)에 이슈 등록
- **일반 대화:** Discord #security 채널

## 기여자 인정

위협 모델 기여자는 위협 모델 기여자 명단, 릴리스 노트, 그리고 중요한 기여가 있을 경우 OpenClaw Security Hall of Fame에 이름이 올라갑니다.
