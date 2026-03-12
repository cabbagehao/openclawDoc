---
summary: "ノード向け location command（location.get）、権限モード、Android の foreground 挙動"
read_when:
  - location node サポートや権限 UI を追加するとき
  - Android の位置情報権限や foreground 挙動を設計するとき
title: "Location Command"
seoTitle: "OpenClawの位置情報コマンドの使い方と位置共有処理ガイド"
description: "OS の権限モデルは多段階です。アプリ内では selector を提示できますが、実際にどの権限が付与されるかは OS 側が最終的に決定します。TL;DR、なぜ selector なのか（単なる switch ではない）、設定モデルを確認できます。"
x-i18n:
  source_hash: "5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529"
---
## TL;DR

- `location.get` は node command（`node.invoke` 経由）
- デフォルトでは off
- Android アプリ設定は selector 方式: Off / While Using
- 別 toggle として Precise Location がある

## なぜ selector なのか（単なる switch ではない）

OS の権限モデルは多段階です。アプリ内では selector を提示できますが、実際にどの権限が付与されるかは OS 側が最終的に決定します。

- iOS / macOS では system prompt や Settings に **While Using** または **Always** が出ることがある
- Android アプリは現時点では foreground location のみをサポートする
- precise location は独立した権限である（iOS 14+ の “Precise”、Android の “fine” / “coarse”）

UI の selector は要求モードを決めるものであり、実際の grant 状態は OS Settings にあります。

## 設定モデル

node device ごとの設定:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 挙動:

- `whileUsing` を選ぶと foreground permission を要求する
- OS が要求レベルを拒否した場合は、実際に許可された最上位レベルへ戻し、状態を表示する

## 権限マッピング（node.permissions）

任意です。macOS node は permissions map で `location` を返しますが、iOS / Android では省略される場合があります。

## コマンド: `location.get`

`node.invoke` 経由で呼び出します。

パラメータ（推奨）:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

応答ペイロード:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

エラー（安定コード）:

- `LOCATION_DISABLED`: selector が off
- `LOCATION_PERMISSION_REQUIRED`: 要求モードに必要な権限がない
- `LOCATION_BACKGROUND_UNAVAILABLE`: アプリが background だが、While Using しか許可されていない
- `LOCATION_TIMEOUT`: 規定時間内に位置 fix が得られない
- `LOCATION_UNAVAILABLE`: system failure または provider 不在

## バックグラウンド挙動

- Android アプリは background 中の `location.get` を拒否する
- Android で位置情報を取得する際は OpenClaw を foreground のままにする
- 他の node platform では挙動が異なる可能性がある

## モデル / ツール統合

- tool surface: `nodes` tool に `location_get` action を追加する（node 必須）
- CLI: `openclaw nodes location get --node <id>`
- agent guideline: ユーザーが location を有効化し、共有範囲を理解している場合にのみ呼び出す

## UX 文言案

- Off: 「位置情報の共有は無効です。」
- While Using: 「OpenClaw を開いている間だけ共有します。」
- Precise: 「高精度な GPS 位置を使用します。おおよその位置だけを共有したい場合はオフにしてください。」
