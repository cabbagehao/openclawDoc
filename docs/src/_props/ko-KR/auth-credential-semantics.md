# 인증 자격 증명 시맨틱(Semantics)

이 문서는 다음 전반에서 공통으로 사용되는 표준 자격 증명 적격성 및 해석 시맨틱을 정의함.

* `resolveAuthProfileOrder`
* `resolveApiKeyForProfile`
* `models status --probe`
* `doctor-auth`

본 시맨틱의 목적은 선택 시점의 동작과 실제 런타임 동작을 일치시키는 데 있음.

## 상태 사유 코드(Reason Codes)

* `ok`: 정상.
* `missing_credential`: 자격 증명 누락.
* `invalid_expires`: 잘못된 만료일 형식.
* `expired`: 만료됨.
* `unresolved_ref`: 참조(Reference)를 해석할 수 없음.

## 토큰(Token) 자격 증명

토큰 자격 증명(`type: "token"`)은 인라인 `token` 및/또는 `tokenRef`를 지원함.

### 적격성 규칙

1. `token`과 `tokenRef`가 모두 존재하지 않을 경우, 해당 토큰 프로필은 부적격으로 간주함.
2. `expires` 속성은 선택 사항임.
3. `expires`가 존재할 경우, 반드시 `0`보다 큰 유한한 숫자여야 함.
4. `expires` 값이 잘못된 형식(`NaN`, `0`, 음수, 무한대, 잘못된 데이터 형식)일 경우, `invalid_expires` 코드를 반환하며 부적격 처리함.
5. `expires`가 현재 시점보다 이전일 경우, `expired` 코드를 반환하며 부적격 처리함.
6. `tokenRef`가 존재하더라도 `expires` 검증 절차는 동일하게 수행됨.

### 해석 규칙

1. 리졸버(Resolver)의 `expires` 처리 방식은 위 적격성 규칙과 동일함.
2. 적격한 프로필의 토큰 값은 인라인 값 또는 `tokenRef`에서 해석됨.
3. 해석 불가능한 참조는 `models status --probe` 출력 시 `unresolved_ref`를 생성함.

## 레거시 호환 메시지

스크립트 호환성을 위해 프로브(Probe) 오류의 첫 번째 줄은 다음 문구를 그대로 유지함.

`Auth profile credentials are missing or expired.`

두 번째 줄부터는 상세 정보 및 위 상태 사유 코드를 사람이 읽기 쉬운 형태로 추가할 수 있음.
