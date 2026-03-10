---
summary: "ノードの位置コマンド (location.get)、権限モード、および Android フォアグラウンド動作"
read_when:
  - ロケーションノードのサポートまたは権限UIの追加
  - Android の位置情報の許可またはフォアグラウンド動作の設計
title: "位置コマンド"
x-i18n:
  source_hash: "5c691cfe147b0b9b16b3a4984d544c168a46b37f91d55b82b2507407d2011529"
---

# 位置コマンド (ノード)

## TL;DR

- `location.get` はノード コマンドです (`node.invoke` 経由)。
- デフォルトではオフです。
- Android アプリの設定では、セレクターを使用します: オフ / 使用中。
- 個別のトグル: 正確な位置。

## なぜセレクターなのか (単なるスイッチではない)

OS のアクセス許可は複数レベルです。アプリ内でセレクターを公開できますが、実際の許可は OS が決定します。

- iOS/macOS では、システム プロンプト/設定で **使用中** または **常時** が表示される場合があります。
- Android アプリは現在、前景位置のみをサポートしています。
- 正確な位置情報は別個に許可されます (iOS 14 以降では「正確」、Android では「細かい」と「粗い」)。

UI のセレクターは、要求されたモードを駆動します。実際の許可は OS 設定にあります。

## 設定モデル

ノードデバイスごと:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: ブール値

UI の動作:

- `whileUsing` を選択すると、フォアグラウンド権限が要求されます。
- OS が要求されたレベルを拒否した場合、許可された最高のレベルに戻り、ステータスを表示します。

## 権限マッピング (node.permissions)

オプション。 macOS ノードは、権限マップを介して `location` を報告します。 iOS/Androidでは省略される場合があります。

## コマンド: `location.get`

`node.invoke` 経由で呼び出されます。

パラメータ (推奨):

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

エラー (安定したコード):- `LOCATION_DISABLED`: セレクターがオフです。

- `LOCATION_PERMISSION_REQUIRED`: 要求されたモードに対する権限がありません。
- `LOCATION_BACKGROUND_UNAVAILABLE`: アプリはバックグラウンドですが、使用中のみ許可されます。
- `LOCATION_TIMEOUT`: 修正が間に合いません。
- `LOCATION_UNAVAILABLE`: システム障害 / プロバイダーがありません。

## バックグラウンドの動作

- Android アプリはバックグラウンド中に `location.get` を拒否します。
- Android で位置情報をリクエストするときは、OpenClaw を開いたままにしてください。
- 他のノードのプラットフォームは異なる場合があります。

## モデル/ツールの統合

- ツール サーフェス: `nodes` ツールは `location_get` アクションを追加します (ノードが必要)。
- CLI: `openclaw nodes location get --node <id>`。
- エージェントのガイドライン: ユーザーが位置情報を有効にし、範囲を理解している場合にのみ呼び出します。

## UX コピー (推奨)

- オフ: 「位置情報の共有は無効になっています。」
- 使用中：「OpenClaw が開いているときのみ」。
- 正確: 「正確な GPS 位置を使用します。おおよその位置を共有するにはオフに切り替えます。」
