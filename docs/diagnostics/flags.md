---
summary: "特定のデバッグログを有効にするための診断フラグ（Diagnostics Flags）"
read_when:
  - 全体のログレベルを上げずに、特定のサブシステムのデバッグログを確認したい場合
  - サポートのためにサブシステム固有のログを取得する必要がある場合
title: "診断フラグ"
x-i18n:
  source_hash: "daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124"
---

# 診断フラグ (Diagnostics Flags)

診断フラグを使用すると、システム全体で詳細な（verbose）ログを有効にすることなく、特定の箇所に絞ってデバッグログを出力させることができます。フラグはオプトイン方式であり、サブシステム側でチェックが行われない限り、パフォーマンスに影響を与えることはありません。

## 仕組み

- フラグは文字列として扱われ、大文字と小文字を区別しません。
- 構成ファイルまたは環境変数の上書きによって有効化できます。
- ワイルドカード（`*`）をサポートしています:
  - `telegram.*` は `telegram.http` や `telegram.payload` に一致します。
  - `*` はすべての診断フラグを有効にします。

## 構成ファイルによる有効化

`openclaw.json` で設定します:

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

複数のフラグを指定する場合:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

フラグを変更した後は、ゲートウェイを再起動してください。

## 環境変数の上書き (一時的な利用)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

すべてのフラグを無効にする場合:

```bash
OPENCLAW_DIAGNOSTICS=0
```

## ログの出力先

診断フラグによるログは、標準の診断ログファイルに出力されます。デフォルトのパスは以下の通りです:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` で出力先を変更している場合は、そのパスを確認してください。ログは 1 行 1 オブジェクトの JSONL 形式です。機密情報の伏せ字（redaction）は、`logging.redactSensitive` の設定に基づいて適用されます。

## ログの抽出と確認

最新のログファイルを見つける:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram の HTTP エラーに関連するログをフィルタリングする:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

リアルタイムで監視（tail）しながら問題を再現させる:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

リモートゲートウェイの場合は、`openclaw logs --follow` コマンドも利用可能です（詳細は [/cli/logs](/cli/logs) を参照）。

## 補足事項

- `logging.level` が `warn` より高いレベル（`error` など）に設定されている場合、これらの診断ログが抑制される可能性があります。デフォルトの `info` であれば問題ありません。
- フラグを有効にしたままにしても基本的には安全です。影響を受けるのは、指定した特定のサブシステムのログ出力ボリュームのみです。
- ログの出力先、レベル、および伏せ字設定を変更するには、[/logging](/logging) を参照してください。
