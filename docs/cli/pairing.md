---
summary: "「openclaw ペアリング」の CLI リファレンス (ペアリング要求の承認/リスト)"
read_when:
  - ペアリングモードの DM を使用しているため、送信者を承認する必要があります
title: "ペアリング"
x-i18n:
  source_hash: "266732af69e57b8849ddc9963426902f60e81daed6e5a80ef4ed5b7923ffa9e2"
---
DM ペアリング リクエストを承認または検査します (ペアリングをサポートするチャネルの場合)。

関連:

- ペアリングの流れ：[ペアリング](/channels/pairing)

## コマンド

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## 注意事項

- チャネル入力: 位置指定 (`pairing list telegram`) または `--channel <channel>` を使用して渡します。
- `pairing list` は、マルチアカウント チャネルの `--account <accountId>` をサポートします。
- `pairing approve` は、`--account <accountId>` および `--notify` をサポートします。
- ペアリング可能なチャネルが 1 つだけ構成されている場合、`pairing approve <code>` が許可されます。
