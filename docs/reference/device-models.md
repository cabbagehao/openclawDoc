---
summary: "OpenClaw が macOS アプリのフレンドリ名用の Apple デバイス モデル識別子を提供する方法。"
read_when:
  - デバイスモデル識別子のマッピングまたは通知/ライセンスファイルの更新
  - インスタンス UI でのデバイス名の表示方法の変更
title: "デバイスモデルデータベース"
seoTitle: "OpenClawデバイスモデルDBの役割と参照方法を確認するガイド"
description: "macOS コンパニオン アプリは、Apple モデル識別子 (例: iPad16,6、Mac16,6) を人間が読める名前にマッピングすることにより、インスタンス UI にわかりやすい Apple デバイス モデル名を表示します。"
x-i18n:
  source_hash: "1d99c2538a0d8fdd80fa468fa402f63479ef2522e83745a0a46527a86238aeb2"
---
macOS コンパニオン アプリは、Apple モデル識別子 (例: `iPad16,6`、`Mac16,6`) を人間が読める名前にマッピングすることにより、**インスタンス** UI にわかりやすい Apple デバイス モデル名を表示します。

マッピングは次の場所で JSON として販売されます。

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## データソース

現在、MIT ライセンスのリポジトリからマッピングを提供しています。

- `kyle-seongwoo-jun/apple-device-identifiers`

ビルドを決定論的に保つために、JSON ファイルは特定のアップストリーム コミットに固定されます (`apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` に記録されています)。

## データベースの更新

1. ピン留めするアップストリーム コミットを選択します (iOS 用に 1 つ、macOS 用に 1 つ)。
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` のコミット ハッシュを更新します。
3. これらのコミットに固定された JSON ファイルを再ダウンロードします。

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` がアップストリームと一致していることを確認します (アップストリーム ライセンスが変更された場合は置き換えます)。
5. macOS アプリが正常にビルドされることを確認します (警告なし)。

```bash
swift build --package-path apps/macos
```
