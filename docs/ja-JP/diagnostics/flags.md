---
summary: "対象となるデバッグ ログの診断フラグ"
read_when:
  - グローバルログレベルを上げずに、対象を絞ったデバッグログが必要である
  - サポートのためにサブシステム固有のログをキャプチャする必要がある
title: "診断フラグ"
x-i18n:
  source_hash: "daf0eca0e6bd1cbc2c400b2e94e1698709a96b9cdba1a8cf00bd580a61829124"
---

# 診断フラグ

診断フラグを使用すると、どこでも詳細なログを有効にすることなく、ターゲットを絞ったデバッグ ログを有効にすることができます。フラグはオプトインであり、サブシステムがチェックしない限り効果はありません。

## 仕組み

- フラグは文字列です (大文字と小文字は区別されません)。
- 設定内で、または環境オーバーライドを介してフラグを有効にすることができます。
- ワイルドカードがサポートされています:
  - `telegram.*` は `telegram.http` と一致します
  - `*` はすべてのフラグを有効にします

## 設定経由で有効にする

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

複数のフラグ:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

フラグを変更した後、ゲートウェイを再起動します。

## 環境オーバーライド (1 回限り)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

すべてのフラグを無効にします。

```bash
OPENCLAW_DIAGNOSTICS=0
```

## ログの行き先

フラグは、標準の診断ログ ファイルにログを出力します。デフォルトでは:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

`logging.file` を設定した場合は、代わりにそのパスを使用してください。ログは JSONL (1 行に 1 つの JSON オブジェクト) です。 `logging.redactSensitive` に基づいて編集が引き続き適用されます。

## ログを抽出する

最新のログ ファイルを選択します。

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP 診断用のフィルター:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

または、再生中に尾を引く:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

リモート ゲートウェイの場合は、`openclaw logs --follow` を使用することもできます ([/cli/logs](/cli/logs) を参照)。

## 注意事項- `logging.level` が `warn` よりも高く設定されている場合、これらのログは抑制される可能性があります。デフォルトの `info` で問題ありません

- フラグは有効のままにしても安全です。特定のサブシステムのログ ボリュームにのみ影響します。
- [/logging](/logging) を使用して、ログの宛先、レベル、リダクションを変更します。
