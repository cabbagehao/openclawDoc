---
summary: "macOS におけるゲートウェイのライフサイクル（launchd）"
read_when:
  - Mac アプリとゲートウェイのライフサイクルを統合する
title: "ゲートウェイのライフサイクル"
x-i18n:
  source_hash: "73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41"
---

# macOS におけるゲートウェイのライフサイクル

macOS アプリは、デフォルトでは **launchd 経由でゲートウェイを管理**し、ゲートウェイを子プロセスとして起動しません。まず、設定済みポートで既存のゲートウェイに接続できるか確認し、到達できるプロセスがない場合のみ、外部 `openclaw` CLI を使って launchd サービスを有効にします。組み込みランタイムは使いません。この方式により、ログイン時の自動起動とクラッシュ後の再起動を安定して実現できます。

子プロセス モード、つまりアプリが直接ゲートウェイを起動する構成は、現時点では **使用していません**。UI とより密に連携させたい場合は、ターミナルからゲートウェイを手動で起動してください。

## デフォルト動作（launchd）

- アプリは、ユーザーごとの LaunchAgent として `ai.openclaw.gateway` をインストールします。
  `--profile` / `OPENCLAW_PROFILE` を使う場合は `ai.openclaw.<profile>` になり、従来の `com.openclaw.*` ラベルも引き続き扱えます。
- ローカル モードが有効な場合、アプリは LaunchAgent がロード済みであることを確認し、必要に応じてゲートウェイを起動します。
- ログは launchd 用のゲートウェイ ログ パスに書き込まれ、Debug Settings から確認できます。

一般的なコマンド:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きプロファイルを実行する場合は、ラベルを `ai.openclaw.<profile>` に置き換えます。

## 未署名の開発ビルド

`scripts/restart-mac.sh --no-sign` は、署名キーがない環境で高速にローカル ビルドを回すためのオプションです。launchd が未署名の relay バイナリを参照しないよう、次のファイルを書き込みます。

- `~/.openclaw/disable-launchagent`

`scripts/restart-mac.sh` を署名付きで実行すると、このマーカーが存在する場合は自動的に解除されます。手動でリセットする場合は次を実行します。

```bash
rm ~/.openclaw/disable-launchagent
```

## 接続専用モード

macOS アプリに **launchd のインストールや管理を一切行わせたくない** 場合は、`--attach-only`（または `--no-launchd`）を付けて起動します。これにより `~/.openclaw/disable-launchagent` が設定され、アプリはすでに起動しているゲートウェイにのみ接続します。同じ挙動は Debug Settings からも切り替えられます。

## リモートモード

リモート モードでは、ローカルのゲートウェイは起動しません。アプリは SSH トンネルを張り、そのトンネル経由でリモート ホストへ接続します。

## launchd を採用している理由

- ログイン時に自動起動できます。
- 再起動と KeepAlive の仕組みが標準で備わっています。
- 予測可能なログと監視を提供できます。

将来的に真の子プロセス モードが再び必要になった場合は、別の明示的な開発専用モードとして文書化するべきです。
