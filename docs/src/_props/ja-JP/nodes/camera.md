---
summary: "エージェント利用向けのカメラキャプチャ（iOS / Android ノード + macOS アプリ）: 写真（jpg）と短い動画クリップ（mp4）"
read_when:
  - iOS / Android ノードや macOS でカメラキャプチャ機能を追加・変更するとき
  - エージェントが利用できる MEDIA 一時ファイルワークフローを拡張するとき
title: "Camera Capture"
x-i18n:
  source_hash: "30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d"
---

# Camera capture (agent)

OpenClaw は、エージェントワークフロー向けに **camera capture** をサポートしています。

* **iOS node**（Gateway 経由でペアリング）: `node.invoke` で **写真**（`jpg`）または **短い動画クリップ**（`mp4`、音声は任意）を取得できます
* **Android node**（Gateway 経由でペアリング）: `node.invoke` で **写真**（`jpg`）または **短い動画クリップ**（`mp4`、音声は任意）を取得できます
* **macOS app**（Gateway 配下の node）: `node.invoke` で **写真**（`jpg`）または **短い動画クリップ**（`mp4`、音声は任意）を取得できます

カメラアクセスはすべて **ユーザーが制御する設定** の背後にあります。

## iOS node

### ユーザー設定（デフォルトでオン）

* iOS の Settings タブ → **Camera** → **Allow Camera**（`camera.enabled`）
  * デフォルト: **on**（キー未設定でも有効として扱う）
  * off の場合: `camera.*` コマンドは `CAMERA_DISABLED` を返す

### コマンド（Gateway の `node.invoke` 経由）

* `camera.list`
  * 応答ペイロード:
    * `devices`: `{ id, name, position, deviceType }` の配列

* `camera.snap`
  * パラメータ:
    * `facing`: `front|back`（デフォルト: `front`）
    * `maxWidth`: number（任意。iOS node のデフォルトは `1600`）
    * `quality`: `0..1`（任意。デフォルトは `0.9`）
    * `format`: 現在は `jpg`
    * `delayMs`: number（任意。デフォルトは `0`）
    * `deviceId`: string（任意。`camera.list` で取得）
  * 応答ペイロード:
    * `format: "jpg"`
    * `base64: "<...>"`
    * `width`、`height`
  * ペイロード保護: 写真は base64 ペイロードが 5 MB 未満に収まるよう再圧縮される

* `camera.clip`
  * パラメータ:
    * `facing`: `front|back`（デフォルト: `front`）
    * `durationMs`: number（デフォルト `3000`、最大 `60000` にクランプ）
    * `includeAudio`: boolean（デフォルト `true`）
    * `format`: 現在は `mp4`
    * `deviceId`: string（任意。`camera.list` で取得）
  * 応答ペイロード:
    * `format: "mp4"`
    * `base64: "<...>"`
    * `durationMs`
    * `hasAudio`

### フォアグラウンド要件

`canvas.*` と同様に、iOS node では **foreground** 中のみ `camera.*` を実行できます。background から呼び出した場合は `NODE_BACKGROUND_UNAVAILABLE` を返します。

### CLI helper（一時ファイル + MEDIA）

添付ファイルとして扱う最も簡単な方法は、デコード済みメディアを一時ファイルへ書き込み、`MEDIA:<path>` を出力する CLI helper を使うことです。

例:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注:

* `nodes camera snap` はデフォルトで **両方の向き** を取得し、エージェントに front / back 両方の視点を渡します
* 自前のラッパーを作らない限り、出力ファイルは OS の一時ディレクトリ上のテンポラリファイルです

## Android node

### Android のユーザー設定（デフォルトでオン）

* Android の Settings sheet → **Camera** → **Allow Camera**（`camera.enabled`）
  * デフォルト: **on**（キー未設定でも有効として扱う）
  * off の場合: `camera.*` コマンドは `CAMERA_DISABLED` を返す

### 権限

* Android では実行時権限が必要です
  * `camera.snap` と `camera.clip` の両方に `CAMERA`
  * `camera.clip` で `includeAudio=true` の場合は `RECORD_AUDIO`

権限が不足している場合、可能であればアプリが権限要求を出します。拒否された場合、`camera.*` リクエストは `*_PERMISSION_REQUIRED` で失敗します。

### Android の foreground 要件

`canvas.*` と同様に、Android node でも **foreground** 中のみ `camera.*` を実行できます。background からの呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### Android コマンド（Gateway の `node.invoke` 経由）

* `camera.list`
  * 応答ペイロード:
    * `devices`: `{ id, name, position, deviceType }` の配列

### ペイロード保護

写真は base64 ペイロードを 5 MB 未満に抑えるため再圧縮されます。

## macOS app

### ユーザー設定（デフォルトでオフ）

macOS companion app には次のチェックボックスがあります。

* **Settings → General → Allow Camera**（`openclaw.cameraEnabled`）
  * デフォルト: **off**
  * off の場合: カメラ要求は “Camera disabled by user” を返す

### CLI helper（node invoke）

メインの `openclaw` CLI を使って、macOS node に camera command を送れます。

例:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注:

* `openclaw nodes camera snap` は、未指定時 `maxWidth=1600` になります
* macOS の `camera.snap` は、warm-up / 露出安定のあと `delayMs`（デフォルト 2000ms）だけ待ってから撮影します
* 写真ペイロードは base64 が 5 MB 未満になるよう再圧縮されます

## セーフティと実用上の制限

* カメラおよびマイクの使用時には、通常の OS 権限プロンプトが表示されます（Info.plist の usage string も必要）
* ノードペイロードの肥大化（base64 オーバーヘッド + メッセージ制限）を避けるため、動画クリップは現在 `<= 60s` に制限されています

## macOS の画面動画（OS レベル）

*screen* 動画（カメラではなく画面）については、macOS companion を使用します。

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

注:

* macOS の **Screen Recording** 権限（TCC）が必要です
