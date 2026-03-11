---
summary: "OpenClaw のロギング: ローリング診断ファイル ログと unified logging のプライバシー設定"
read_when:
  - macOS ログの取得やプライベート データのログ出力調査
  - 音声ウェイクやセッション ライフサイクルの問題のデバッグ
title: "macOS のロギング"
x-i18n:
  source_hash: "c08d6bc012f8e8bb53353fe654713dede676b4e6127e49fd76e00c2510b9ab0b"
---

# ロギング（macOS）

## ローリング診断ファイル ログ（Debug pane）

OpenClaw は macOS アプリのログを swift-log 経由で処理しており、既定では unified logging を使用します。永続的な記録が必要な場合は、ローカル ディスクへローテーション付きのファイル ログを書き出せます。

* Verbosity: **Debug pane → Logs → App logging → Verbosity**
* Enable: **Debug pane → Logs → App logging → "Write rolling diagnostics log (JSONL)"**
* Location: `~/Library/Logs/OpenClaw/diagnostics.jsonl`（古いファイルは自動でローテーションされ、`.1`、`.2` のような接尾辞が付きます）
* Clear: **Debug pane → Logs → App logging → "Clear"**

注意:

* これは **既定では無効** です。実際にデバッグが必要な期間だけ有効にしてください。
* このファイルには機微な情報が含まれる可能性があります。内容を確認せず共有しないでください。

## macOS の unified logging における private data

unified logging では、サブシステム側で `privacy -off` を有効にしない限り、多くのペイロードがマスクされます。Peter の記事 [logging privacy shenanigans](https://steipete.me/posts/2025/logging-privacy-shenanigans)（2025）で説明されているとおり、この挙動は `/Library/Preferences/Logging/Subsystems/` 配下の plist で制御し、キーにはサブシステム名を使用します。このフラグは新しく出力されるログにのみ反映されるため、問題を再現する前に有効化してください。

## OpenClaw（`ai.openclaw`）で有効化する

* まず plist を一時ファイルへ書き出し、その後 root 権限でアトミックにインストールします。

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

* 再起動は不要です。`logd` は比較的すぐにこのファイルを検知しますが、private data を含むのはそれ以降に出力された新しいログ行だけです。
* より詳細な出力は既存のヘルパーで確認できます。たとえば `./scripts/clawlog.sh --category WebChat --last 5m` を使用します。

## デバッグ後に無効化する

* オーバーライドを削除します: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`
* 必要に応じて `sudo log config --reload` を実行すると、`logd` に即座に設定を再読み込みさせることができます。
* この経路には電話番号やメッセージ本文が含まれる可能性があります。追加情報が必要な間だけ plist を配置してください。
