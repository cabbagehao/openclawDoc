---
summary: "ロギング サーフェス、ファイル ログ、WS ログ スタイル、およびコンソールのフォーマット"
read_when:
  - ロギング出力または形式の変更
  - CLI またはゲートウェイ出力のデバッグ
title: "ロギング"
x-i18n:
  source_hash: "efb8eda5e77e3809369a8ff569fac110323a86b3945797093f20e9bc98f39b2e"
---

# ロギング

ユーザー向けの概要 (CLI + コントロール UI + 構成) については、[/logging](/logging) を参照してください。

OpenClaw には 2 つのログ「サーフェス」があります。

- **コンソール出力** (ターミナル/デバッグ UI に表示されるもの)。
- **ファイル ログ** (JSON 行) はゲートウェイ ロガーによって書き込まれます。

## ファイルベースのロガー

- デフォルトのローリング ログ ファイルは `/tmp/openclaw/` の下にあります (1 日あたり 1 ファイル): `openclaw-YYYY-MM-DD.log`
  - 日付にはゲートウェイ ホストのローカル タイムゾーンが使用されます。
- ログ ファイルのパスとレベルは、`~/.openclaw/openclaw.json` を介して構成できます。
  - `logging.file`
  - `logging.level`

ファイル形式は 1 行に 1 つの JSON オブジェクトです。

[コントロール UI ログ] タブは、ゲートウェイ (`logs.tail`) を介してこのファイルを追跡します。
CLI でも同様のことができます。

```bash
openclaw logs --follow
```

**詳細レベルとログ レベル**

- **ファイル ログ**は、`logging.level` によって排他的に制御されます。
- `--verbose` は **コンソールの冗長性** (および WS ログ スタイル) にのみ影響します。それは**しません**
  ファイルのログレベルを上げます。
- ファイル ログで詳細のみの詳細をキャプチャするには、`logging.level` を `debug` に設定するか、
  `trace`。

## コンソールのキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャし、ファイル ログに書き込みます。
stdout/stderr に出力しながら。

次の方法でコンソールの冗長性を個別に調整できます。

- `logging.consoleLevel` (デフォルト `info`)
- `logging.consoleStyle` (`pretty` | `compact` | `json`)

## ツールの概要の編集詳細なツールの概要 (`🛠️ Exec: ...` など) は、機密トークンがアクセスされる前にマスクすることができます

コンソールストリーム。これは**ツールのみ**であり、ファイル ログは変更されません。

- `logging.redactSensitive`: `off` | `tools` (デフォルト: `tools`)
- `logging.redactPatterns`: 正規表現文字列の配列 (デフォルトをオーバーライドします)
  - 生の正規表現文字列 (自動 `gi`) を使用するか、カスタム フラグが必要な場合は `/pattern/flags` を使用します。
  - 最初の 6 文字と最後の 4 文字 (長さ >= 18) を保持することによって一致がマスクされます。それ以外の場合は `***` です。
  - デフォルトは、共通キー割り当て、CLI フラグ、JSON フィールド、ベアラー ヘッダー、PEM ブロック、および一般的なトークン プレフィックスをカバーします。

## ゲートウェイ WebSocket ログ

ゲートウェイは、次の 2 つのモードで WebSocket プロトコル ログを出力します。

- **通常モード (`--verbose` なし)**: 「興味深い」 RPC 結果のみが出力されます。
  - エラー (`ok=false`)
  - 通話が遅い (デフォルトのしきい値: `>= 50ms`)
  - 解析エラー
- **詳細モード (`--verbose`)**: すべての WS 要求/応答トラフィックを出力します。

### WS ログのスタイル

`openclaw gateway` は、ゲートウェイごとのスタイルのスイッチをサポートします。

- `--ws-log auto` (デフォルト): 通常モードが最適化されます。詳細モードではコンパクトな出力を使用します
- `--ws-log compact`: 冗長時のコンパクトな出力 (ペアのリクエスト/レスポンス)
- `--ws-log full`: 詳細時のフレームごとの完全な出力
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## コンソールのフォーマット (サブシステムのロギング)コンソール フォーマッタは **TTY 対応**で、一貫した接頭辞付きの行を出力します

サブシステム ロガーは、出力をグループ化してスキャン可能に保ちます。

動作:

- 各行の **サブシステム プレフィックス** (例: `[gateway]`、`[canvas]`、`[tailscale]`)
- **サブシステム カラー** (サブシステムごとに安定) プラス レベル カラーリング
- **出力が TTY である場合、または環境がリッチ ターミナルのように見える場合の色** (`TERM`/`COLORTERM`/`TERM_PROGRAM`)、`NO_COLOR` を尊重します
- **短縮されたサブシステム プレフィックス**: 先頭の `gateway/` + `channels/` を削除し、最後の 2 セグメントを保持します (例: `whatsapp/outbound`)
- **サブシステム別のサブロガー** (自動プレフィックス + 構造化フィールド `{ subsystem }`)
- **`logRaw()`** QR/UX 出力 (プレフィックスなし、フォーマットなし)
- **コンソール スタイル** (例: `pretty | compact | json`)
- **コンソール ログ レベル**はファイル ログ レベルとは別 (`logging.level` が `debug`/`trace` に設定されている場合、ファイルは完全な詳細を保持します)
- **WhatsApp メッセージ本文** は `debug` に記録されます (表示するには `--verbose` を使用します)

これにより、対話型出力をスキャン可能にしながら、既存のファイル ログが安定した状態に保たれます。
