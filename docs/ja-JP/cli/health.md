---
summary: "「openclaw health」の CLI リファレンス (RPC 経由のゲートウェイ ヘルス エンドポイント)"
read_when:
  - 実行中のゲートウェイの状態をすぐに確認したい
title: "健康"
x-i18n:
  source_hash: "82a78a5a97123f7a5736699ae8d793592a736f336c5caced9eba06d14d973fd7"
---

# `openclaw health`

実行中のゲートウェイからヘルスを取得します。

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

注:

- `--verbose` はライブ プローブを実行し、複数のアカウントが構成されている場合にアカウントごとのタイミングを出力します。
- 複数のエージェントが構成されている場合、出力にはエージェントごとのセッション ストアが含まれます。
