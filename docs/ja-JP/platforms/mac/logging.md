---
summary: "OpenClaw ログ: ローリング診断ファイル ログ + 統合されたログ プライバシー フラグ"
read_when:
  - macOS ログのキャプチャまたはプライベート データ ログの調査
  - 音声ウェイク/セッションのライフサイクルの問題のデバッグ
title: "macOS のロギング"
x-i18n:
  source_hash: "c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b"
---

# ロギング (macOS)

## ローリング診断ファイル ログ ([デバッグ] ペイン)

OpenClaw は、swift-log (デフォルトでは統合ログ) を介して macOS アプリのログをルーティングし、永続的なキャプチャが必要な場合に、ローカルの回転ファイル ログをディスクに書き込むことができます。

- 詳細度: **デバッグ ペイン → ログ → アプリ ログ → 詳細度**
- 有効化: **デバッグ ペイン → ログ → アプリ ログ → 「ローリング診断ログ (JSONL) の書き込み」**
- 場所: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (自動的にローテーションします。古いファイルには `.1`、`.2` などの接尾辞が付けられます)
- クリア: **デバッグペイン→ログ→アプリログ→「クリア」**

注:

- これは**デフォルトではオフ**です。アクティブなデバッグ中にのみ有効にします。
- ファイルを機密ファイルとして扱います。レビューせずに共有しないでください。

## macOS でのプライベート データのログ記録を統合する

サブシステムが `privacy -off` を選択しない限り、統合ログはほとんどのペイロードを秘匿化します。 Peter の macOS に関する記述 [プライバシー詐欺のロギング](https://steipete.me/posts/2025/logging-privacy-shenanigans) (2025) によると、これはサブシステム名をキーとした `/Library/Preferences/Logging/Subsystems/` の plist によって制御されます。新しいログ エントリのみがこのフラグを選択するため、問題を再現する前にフラグを有効にしてください。

## OpenClaw を有効にする (`ai.openclaw`)

- 最初に plist を一時ファイルに書き込み、次にそれを root としてアトミックにインストールします。

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

- 再起動は必要ありません。 logd はファイルをすぐに認識しますが、プライベート ペイロードが含まれるのは新しいログ行のみです。
- 既存のヘルパーを使用して、より豊富な出力を表示します。 `./scripts/clawlog.sh --category WebChat --last 5m`。## デバッグ後に無効にする

- オーバーライドを削除します: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`。
- 必要に応じて、`sudo log config --reload` を実行して、logd にオーバーライドを直ちに削除させます。
- このサーフェスには電話番号とメッセージ本文を含めることができることに注意してください。 plist は、追加の詳細が積極的に必要な場合にのみ所定の位置に保持してください。
