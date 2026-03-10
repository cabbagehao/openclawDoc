---
summary: "ノードのペアリング、フォアグラウンド要件、権限、ツールの障害のトラブルシューティングを行う"
read_when:
  - ノードは接続されていますが、カメラ/キャンバス/画面/実行ツールが失敗します
  - ノードのペアリングと承認のメンタル モデルが必要です
title: "ノードのトラブルシューティング"
x-i18n:
  source_hash: "d5c053beb8b9ce9b63085ac2bb00f83ce3f046b78f9ee85c225c650742991adc"
---

# ノードのトラブルシューティング

ステータスにノードが表示されているが、ノード ツールが失敗する場合は、このページを使用します。

## コマンドラダー

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

次に、ノード固有のチェックを実行します。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

健全な信号:

- ノードは接続され、ロール `node` に対してペアになっています。
- `nodes describe` には、呼び出している機能が含まれています。
- 実行承認には、予期されるモード/許可リストが表示されます。

## フォアグラウンドの要件

`canvas.*`、`camera.*`、および `screen.*` は、iOS/Android ノードでのみフォアグラウンドです。

簡単なチェックと修正:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` が表示された場合は、ノード アプリをフォアグラウンドにして再試行してください。

## 権限マトリックス|能力 | iOS |アンドロイド | macOS ノード アプリ |典型的な障害コード |

| ---------------------------- | -------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`、`camera.clip` |カメラ (+ クリップオーディオ用マイク) |カメラ (+ クリップオーディオ用マイク) |カメラ (+ クリップオーディオ用マイク) | `*_PERMISSION_REQUIRED` |
| `screen.record` |画面録画 (+ マイクオプション) |スクリーン キャプチャ プロンプト (+ マイクはオプション) |画面録画 | `*_PERMISSION_REQUIRED` |
| `location.get` |使用中または常時 (モードによる) |モードに基づく前景/背景の位置 |位置情報の許可 | `LOCATION_PERMISSION_REQUIRED` |
| `system.run` |該当なし (ノードのホスト パス) |該当なし (ノードのホスト パス) |幹部の承認が必要 | `SYSTEM_RUN_DENIED` |

## ペアリングと承認

これらは異なるゲートです。

1. **デバイスのペアリング**: このノードはゲートウェイに接続できますか?
2. **実行承認**: このノードは特定のシェル コマンドを実行できますか?

簡単なチェック:

````bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```ペアリングが見つからない場合は、最初にノードデバイスを承認します。
ペアリングは正常だが、`system.run` が失敗する場合は、実行承認/許可リストを修正してください。

## 一般的なノードのエラー コード

- `NODE_BACKGROUND_UNAVAILABLE` → アプリはバックグラウンドになっています。それを前面に持ってきます。
- `CAMERA_DISABLED` → ノード設定でカメラの切り替えが無効になっています。
- `*_PERMISSION_REQUIRED` → OS 権限が見つからない/拒否されました。
- `LOCATION_DISABLED` → 位置情報モードはオフです。
- `LOCATION_PERMISSION_REQUIRED` → 要求された位置情報モードは許可されません。
- `LOCATION_BACKGROUND_UNAVAILABLE` → アプリはバックグラウンドですが、使用中権限のみが存在します。
- `SYSTEM_RUN_DENIED: approval required` → 実行リクエストには明示的な承認が必要です。
- `SYSTEM_RUN_DENIED: allowlist miss` → コマンドは許可リスト モードによってブロックされました。
  Windows ノード ホストでは、`cmd.exe /c ...` のようなシェル ラッパー フォームはホワイトリストのミスとして扱われます。
  ask フロー経由で承認されない限り、許可リスト モード。

## 高速リカバリループ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
````

まだスタックしている場合:

- デバイスのペアリングを再承認します。
- ノード アプリを再度開きます (フォアグラウンド)。
- OS 権限を再付与します。
- 役員承認ポリシーを再作成/調整します。

関連:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
