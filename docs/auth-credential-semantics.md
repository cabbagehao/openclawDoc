---
summary: "OpenClaw における認証情報の適格性判定、解決順序、理由コードを定義します"
description: "認証プロファイルやトークン参照がどの順序で解決され、失効や欠落がどのように判定されるかを仕様レベルで整理します。"
title: "OpenClawの認証情報の解決順序と有効性判定ルールを理解するガイド"
---
このドキュメントでは、以下で使われる標準的な認証情報の適格性判定と解決の意味論を定義します。

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目的は、選択時の挙動と実行時の挙動を一致させることです。

## 安定した理由コード

- `ok`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`

## トークン認証情報

トークン認証情報（`type: "token"`）では、インラインの `token` と `tokenRef` の両方、またはいずれか一方を使用できます。

### 適格性ルール

1. `token` と `tokenRef` の両方が存在しない場合、トークンプロファイルは不適格です。
2. `expires` は任意です。
3. `expires` がある場合は、`0` より大きい有限の数値でなければなりません。
4. `expires` が無効（`NaN`、`0`、負数、有限でない値、または型が不正）な場合、そのプロファイルは `invalid_expires` により不適格になります。
5. `expires` が過去の時刻を示している場合、そのプロファイルは `expired` により不適格になります。
6. `tokenRef` があっても、`expires` の検証は省略されません。

### 解決ルール

1. リゾルバーにおける `expires` の扱いは、適格性判定の意味論と一致します。
2. 適格なプロファイルでは、トークン本体をインライン値または `tokenRef` から解決できます。
3. 参照を解決できない場合、`models status --probe` の出力では `unresolved_ref` になります。

## 旧来仕様と互換性のあるメッセージ

スクリプト互換性のため、プローブエラーでは次の先頭行を変更せず維持します。

`Auth profile credentials are missing or expired.`

後続の行には、人が読みやすい詳細や安定した理由コードを追加できます。
