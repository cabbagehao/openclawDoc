---
summary: "`openclaw health` の CLI リファレンス (RPC 経由でのゲートウェイヘルスチェック)"
read_when:
  - 稼働中のゲートウェイの健全性を素早く確認したい場合
title: "health"
x-i18n:
  source_hash: "82a78a5a97123f7a5736699ae8d793592a736f336c5caced9eba06d14d973fd7"
---

# `openclaw health`

稼働中のゲートウェイからヘルスステータス（健全性情報）を取得します。

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

補足事項:

* `--verbose` フラグを指定すると、ライブプローブを実行し、複数のアカウントが構成されている場合はアカウントごとの応答時間などを表示します。
* 複数のエージェントが構成されている場合、出力にはエージェントごとのセッションストア情報が含まれます。
