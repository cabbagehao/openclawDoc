# 認証資格情報のセマンティクス

このドキュメントでは、以下で使われる標準の資格情報の有効性判定および解決セマンティクスを定義します。

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目的は、選択時の動作と実行時の動作を一致させることです。

## 安定した理由コード

- `ok`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`

## トークン資格情報

トークン資格情報（`type: "token"`）では、インラインの`token`および`tokenRef`、またはいずれか一方を使用できます。

### 有効性判定のルール

1. `token`と`tokenRef`の両方がない場合、トークンプロファイルは無効です。
2. `expires`は任意です。
3. `expires`がある場合は、`0`より大きい有限の数値でなければなりません。
4. `expires`が無効（`NaN`、`0`、負数、有限でない値、または型が不正）な場合、そのプロファイルは`invalid_expires`により無効になります。
5. `expires`が過去の時刻を示している場合、そのプロファイルは`expired`により無効になります。
6. `tokenRef`があっても、`expires`の検証は省略されません。

### 解決ルール

1. リゾルバーにおける`expires`の扱いは、有効性判定のセマンティクスと一致します。
2. 有効なプロファイルでは、トークン本体をインライン値または`tokenRef`から解決できます。
3. 参照を解決できない場合、`models status --probe`の出力では`unresolved_ref`になります。

## 旧来仕様との互換性があるメッセージ

スクリプト互換性のため、プローブエラーでは次の先頭行を変更せずに維持します。

`Auth profile credentials are missing or expired.`

後続の行には、人が読みやすい詳細や安定した理由コードを追加できます。
