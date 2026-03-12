---
summary: "グローバルな voice wake word（gateway 管理）と node 間同期の仕組み"
read_when:
  - voice wake word の挙動やデフォルトを変更するとき
  - wake word 同期が必要な新しい node platform を追加するとき
title: "Voice Wake"
x-i18n:
  source_hash: "a80e0cf7f68a3d48ff79af0ffb3058a7a0ecebd2cdbaad20b9ff53bc2b39dc84"
---
OpenClaw では、**wake word は gateway が管理する 1 つのグローバルリスト** として扱われます。

- **node ごとのカスタム wake word** はありません
- **どの node / app UI からでも** リストを編集でき、変更は gateway に保存されたうえで全体へブロードキャストされます
- macOS と iOS にはローカルの **Voice Wake enabled / disabled** toggle が残っています（ローカル UX と権限モデルが異なるため）
- Android は現状 Voice Wake を無効にしており、Voice タブの手動 mic フローを使います

## 保存場所（gateway host）

wake word は gateway マシン上の次のファイルに保存されます。

- `~/.openclaw/settings/voicewake.json`

形式:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## protocol

### method

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` に `{ triggers: string[] }` を渡す → `{ triggers: string[] }`

注:

- trigger は正規化されます（trim し、空文字は削除）。空リストになった場合はデフォルトへ戻ります
- 安全性のため、件数と長さには上限があります

### event

- `voicewake.changed` payload `{ triggers: string[] }`

受信対象:

- すべての WebSocket client（macOS app、WebChat など）
- 接続中のすべての node（iOS / Android）。さらに node 接続時には、初期状態として現在値も push されます

## client 挙動

### macOS app

- グローバルリストを `VoiceWakeRuntime` の trigger 判定に使います
- Voice Wake 設定で “Trigger words” を編集すると `voicewake.set` を呼び、その後は broadcast によって他 client との同期を保ちます

### iOS node

- グローバルリストを `VoiceWakeManager` の trigger 検出に使います
- Settings で Wake Words を編集すると、Gateway WS 経由で `voicewake.set` を呼び出し、同時にローカルの wake-word 検出もすぐ反映されるようにします

### Android node

- Voice Wake は現在の Android runtime / Settings では無効です
- Android の voice は wake word trigger ではなく、Voice タブの手動 mic capture を使います
