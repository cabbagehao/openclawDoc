---
summary: "エージェント、エンベロープ、プロンプトのタイムゾーン処理"
read_when:
  - タイムスタンプがモデルに対してどのように正規化されるかを理解する必要があります
  - システムプロンプトのユーザータイムゾーンの構成
title: "タイムゾーン"
x-i18n:
  source_hash: "9ee809c96897db1126c7efcaa5bf48a63cdcb2092abd4b3205af224ebd882766"
---

# タイムゾーン

OpenClaw はタイムスタンプを標準化するため、モデルは **単一の参照時刻**を認識します。

## メッセージ エンベロープ (デフォルトではローカル)

受信メッセージは次のようなエンベロープで包まれます。

```
[Provider ... 2026-01-05 16:26 PST] message text
```

エンベロープ内のタイムスタンプは**デフォルトではホストローカル**であり、精度は分です。

これを次のようにオーバーライドできます。

```json5
{
  agents: {
    defaults: {
      envelopeTimezone: "local", // "utc" | "local" | "user" | IANA timezone
      envelopeTimestamp: "on", // "on" | "off"
      envelopeElapsed: "on", // "on" | "off"
    },
  },
}
```

- `envelopeTimezone: "utc"` は UTC を使用します。
- `envelopeTimezone: "user"` は `agents.defaults.userTimezone` を使用します (ホストのタイムゾーンにフォールバックします)。
- 固定オフセットには明示的な IANA タイムゾーン (例: `"Europe/Vienna"`) を使用します。
- `envelopeTimestamp: "off"` は、エンベロープ ヘッダーから絶対タイムスタンプを削除します。
- `envelopeElapsed: "off"` は、経過時間のサフィックス (`+2m` スタイル) を削除します。

### 例

**ローカル (デフォルト):**

```
[Signal Alice +1555 2026-01-18 00:19 PST] hello
```

**固定タイムゾーン:**

```
[Signal Alice +1555 2026-01-18 06:19 GMT+1] hello
```

**経過時間:**

```
[Signal Alice +1555 +2m 2026-01-18T05:19Z] follow-up
```

## ツール ペイロード (生のプロバイダー データ + 正規化されたフィールド)

ツール呼び出し (`channels.discord.readMessages`、`channels.slack.readMessages` など) は **生のプロバイダー タイムスタンプ**を返します。
一貫性を保つために正規化されたフィールドも追加します。

- `timestampMs` (UTC エポック ミリ秒)
- `timestampUtc` (ISO 8601 UTC 文字列)

生のプロバイダーフィールドは保持されます。

## システムプロンプトのユーザータイムゾーン

`agents.defaults.userTimezone` を設定して、ユーザーのローカル タイム ゾーンをモデルに伝えます。もしそうなら
設定を解除すると、OpenClaw は **実行時にホストのタイムゾーン**を解決します (構成の書き込みは行われません)。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

システム プロンプトには次のものが含まれます。- ローカル時間とタイムゾーンを含む `Current Date & Time` セクション

- `Time format: 12-hour` または `24-hour`

プロンプトの形式は、`agents.defaults.timeFormat` (`auto` | `12` | `24`) で制御できます。

完全な動作と例については、[日付と時刻](/date-time) を参照してください。
