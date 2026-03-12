---
summary: "node のペアリング、foreground 要件、権限、tool failure の切り分け"
read_when:
  - node は接続済みだが camera / canvas / screen / exec tool が失敗するとき
  - node pairing と approvals の違いを整理したいとき
title: "Node Troubleshooting"
x-i18n:
  source_hash: "d5c053beb8b9ce9b63085ac2bb00f83ce3f046b78f9ee85c225c650742991adc"
---
status 上では node が見えているのに、node tool が失敗する場合はこのページを使ってください。

## コマンドラダー

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

続いて、node 固有の確認を行います。

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

正常時のシグナル:

- node が接続済みで、role `node` として paired になっている
- `nodes describe` に、呼び出したい capability が含まれている
- exec approvals が期待どおりの mode / allowlist になっている

## foreground 要件

`canvas.*`、`camera.*`、`screen.*` は iOS / Android node では foreground 専用です。

簡易確認と対処:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

`NODE_BACKGROUND_UNAVAILABLE` が出た場合は、node app を foreground に戻してから再試行してください。

## 権限マトリクス

| Capability                   | iOS                                     | Android                                      | macOS node app                | Typical failure code           |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Camera（clip 音声には mic も必要）      | Camera（clip 音声には mic も必要）           | Camera（clip 音声には mic も必要） | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Screen Recording（+ mic は任意）        | Screen capture prompt（+ mic は任意）        | Screen Recording              | `*_PERMISSION_REQUIRED`        |
| `location.get`               | While Using または Always（mode に依存） | mode に応じた foreground / background location | Location permission           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | n/a（node host 経路）                   | n/a（node host 経路）                        | Exec approvals が必要         | `SYSTEM_RUN_DENIED`            |

## pairing と approvals の違い

この 2 つは別の gate です。

1. **Device pairing**: この node が gateway へ接続できるか
2. **Exec approvals**: この node が特定の shell command を実行できるか

簡易確認:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

pairing が欠けている場合は、まず node device を承認してください。pairing が正常なのに `system.run` だけ失敗する場合は、exec approvals / allowlist を見直してください。

## よくある node error code

- `NODE_BACKGROUND_UNAVAILABLE` → app が background。foreground に戻す
- `CAMERA_DISABLED` → node settings で camera toggle が無効
- `*_PERMISSION_REQUIRED` → OS 権限が未付与または拒否されている
- `LOCATION_DISABLED` → location mode が off
- `LOCATION_PERMISSION_REQUIRED` → 要求した location mode が許可されていない
- `LOCATION_BACKGROUND_UNAVAILABLE` → app は background だが While Using 権限しかない
- `SYSTEM_RUN_DENIED: approval required` → exec request に明示承認が必要
- `SYSTEM_RUN_DENIED: allowlist miss` → command が allowlist mode によって拒否された
  Windows node host では、`cmd.exe /c ...` のような shell-wrapper 形式は、ask flow で承認しない限り allowlist mode では allowlist miss として扱われます。

## すばやい復旧ループ

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

それでも解消しない場合:

- device pairing を再承認する
- node app を開き直す（foreground にする）
- OS 権限を再付与する
- exec approval policy を作り直す / 調整する

関連:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
