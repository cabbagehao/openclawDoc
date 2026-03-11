# 인증 자격 증명 의미 체계

이 문서는 다음 전반에서 사용되는 표준 자격 증명 적격성 및 해석 의미 체계를 정의합니다.

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

목표는 선택 시점의 동작과 런타임 동작을 일치시키는 것입니다.

## 안정적인 이유 코드

- `ok`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`

## 토큰 자격 증명

토큰 자격 증명(`type: "token"`)은 인라인 `token` 및/또는 `tokenRef`를 지원합니다.

### 적격성 규칙

1. `token`과 `tokenRef`가 모두 없으면 해당 토큰 프로필은 부적격입니다.
2. `expires`는 선택 사항입니다.
3. `expires`가 있으면 `0`보다 큰 유한한 숫자여야 합니다.
4. `expires`가 잘못된 값(`NaN`, `0`, 음수, 비유한값, 잘못된 타입)이면 해당 프로필은 `invalid_expires`로 부적격 처리됩니다.
5. `expires`가 과거 시점이면 해당 프로필은 `expired`로 부적격 처리됩니다.
6. `tokenRef`가 있어도 `expires` 검증을 우회하지는 않습니다.

### 해석 규칙

1. 해석기(resolver)의 `expires` 처리 의미 체계는 적격성 의미 체계와 동일합니다.
2. 적격한 프로필의 경우 토큰 값은 인라인 값 또는 `tokenRef`에서 해석될 수 있습니다.
3. 해석할 수 없는 ref는 `models status --probe` 출력에서 `unresolved_ref`를 생성합니다.

## 레거시 호환 메시징

스크립트 호환성을 위해 probe 오류의 첫 줄은 다음 문구를 그대로 유지합니다.

`Auth profile credentials are missing or expired.`

그 다음 줄부터는 사람이 읽기 쉬운 상세 정보와 안정적인 이유 코드를 추가할 수 있습니다.
