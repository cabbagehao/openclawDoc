---
summary: "エージェント使用のためのカメラ キャプチャ (iOS/Android ノード + macOS アプリ): 写真 (jpg) および短いビデオ クリップ (mp4)"
read_when:
  - iOS/Android ノードまたは macOS でのカメラ キャプチャの追加または変更
  - エージェントがアクセス可能な MEDIA 一時ファイルのワークフローを拡張する
title: "カメラキャプチャ"
x-i18n:
  source_hash: "30b1beaac9602ff29733f72b953065f271928743c8fff03191a007e8b965c88d"
---

# カメラキャプチャ (エージェント)

OpenClaw は、エージェント ワークフローの **カメラ キャプチャ** をサポートしています。

- **iOS ノード** (ゲートウェイ経由でペアリング): `node.invoke` 経由で **写真** (`jpg`) または **短いビデオ クリップ** (`mp4`、オプションの音声付き) をキャプチャします。
- **Android ノード** (ゲートウェイ経由でペアリング): `node.invoke` 経由で **写真** (`jpg`) または **短いビデオ クリップ** (`mp4`、オプションの音声付き) をキャプチャします。
- **macOS アプリ** (ゲートウェイ経由のノード): `node.invoke` 経由で **写真** (`jpg`) または **短いビデオ クリップ** (`mp4`、オプションの音声付き) をキャプチャします。

すべてのカメラへのアクセスは、**ユーザー制御の設定**の背後でゲートされます。

## iOS ノード

### ユーザー設定 (デフォルトはオン)

- iOS 設定タブ → **カメラ** → **カメラを許可** (`camera.enabled`)
  - デフォルト: **オン** (欠落しているキーは有効なものとして扱われます)。
  - オフの場合: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### コマンド (ゲートウェイ `node.invoke` 経由)

- `camera.list`
  - 応答ペイロード:
    - `devices`: `{ id, name, position, deviceType }` の配列- `camera.snap`
  - パラメータ:
    - `facing`: `front|back` (デフォルト: `front`)
    - `maxWidth`: 数値 (オプション、iOS ノードのデフォルト `1600`)
    - `quality`: `0..1` (オプション、デフォルトは `0.9`)
    - `format`: 現在 `jpg`
    - `delayMs`: 数値 (オプション、デフォルトは `0`)
    - `deviceId`: 文字列 (オプション、`camera.list` から)
  - 応答ペイロード:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - ペイロード ガード: 写真は再圧縮されて、base64 ペイロードが 5 MB 未満に保たれます。

- `camera.clip`
  - パラメータ:
    - `facing`: `front|back` (デフォルト: `front`)
    - `durationMs`: 数値 (デフォルトは `3000`、最大値は `60000` に固定)
    - `includeAudio`: ブール値 (デフォルトは `true`)
    - `format`: 現在 `mp4`
    - `deviceId`: 文字列 (オプション、`camera.list` から)
  - 応答ペイロード:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### フォアグラウンドの要件

`canvas.*` と同様、iOS ノードでは **フォアグラウンド** での `camera.*` コマンドのみが許可されます。バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### CLI ヘルパー (一時ファイル + メディア)添付ファイルを取得する最も簡単な方法は、デコードされたメディアを一時ファイルに書き込み、`MEDIA:<path>` を出力する CLI ヘルパーを使用することです

例:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注:

- `nodes camera snap` はデフォルトで **両方** を向き、エージェントに両方のビューを提供します。
- 独自のラッパーを構築しない限り、出力ファイルは一時的 (OS 一時ディレクトリ内) になります。

## Android ノード

### Android ユーザー設定 (デフォルトはオン)

- Android 設定シート → **カメラ** → **カメラを許可** (`camera.enabled`)
  - デフォルト: **オン** (欠落しているキーは有効なものとして扱われます)。
  - オフの場合: `camera.*` コマンドは `CAMERA_DISABLED` を返します。

### 権限

- Android には実行時の権限が必要です。
  - `camera.snap` と `camera.clip` の両方の場合は `CAMERA`。
  - `includeAudio=true` の場合は、`RECORD_AUDIO`、`camera.clip`。

権限が不足している場合、アプリは可能な場合にプロンプ​​トを表示します。拒否された場合、`camera.*` リクエストは失敗し、
`*_PERMISSION_REQUIRED` エラー。

### Android フォアグラウンド要件

`canvas.*` と同様、Android ノードでは **フォアグラウンド** での `camera.*` コマンドのみが許可されます。バックグラウンド呼び出しは `NODE_BACKGROUND_UNAVAILABLE` を返します。

### Android コマンド (ゲートウェイ `node.invoke` 経由)

- `camera.list`
  - 応答ペイロード:
    - `devices`: `{ id, name, position, deviceType }` の配列

### ペイロードガード

写真は、base64 ペイロードを 5 MB 未満に保つために再圧縮されます。

## macOS アプリ

### ユーザー設定 (デフォルトはオフ)macOS コンパニオン アプリはチェックボックスを公開します

- **設定 → 一般 → カメラを許可** (`openclaw.cameraEnabled`)
  - デフォルト: **オフ**
  - オフの場合: カメラ要求は「ユーザーによってカメラが無効になっています」を返します。

### CLI ヘルパー (ノード呼び出し)

メインの `openclaw` CLI を使用して、macOS ノードでカメラ コマンドを呼び出します。

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

- `openclaw nodes camera snap` は、オーバーライドされない限り、デフォルトで `maxWidth=1600` になります。
- macOS では、`camera.snap` は、ウォームアップ/露出が安定した後、キャプチャする前に `delayMs` (デフォルトは 2000 ミリ秒) 待機します。
- 写真のペイロードは、base64 を 5 MB 未満に保つために再圧縮されます。

## 安全性 + 実用的な制限

- カメラとマイクにアクセスすると、通常の OS 許可プロンプトがトリガーされます (また、Info.plist 内の使用文字列が必要です)。
- ノード ペイロードの過大化 (base64 オーバーヘッド + メッセージ制限) を回避するために、ビデオ クリップにはキャップが設定されています (現在 `<= 60s`)。

## macOS 画面ビデオ (OS レベル)

_screen_ ビデオ (カメラではない) の場合は、macOS コンパニオンを使用します。

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

注:

- macOS **画面録画** 権限 (TCC) が必要です。
