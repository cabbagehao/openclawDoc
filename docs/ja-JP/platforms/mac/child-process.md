---
summary: "macOS でのゲートウェイのライフサイクル (launchd)"
read_when:
  - Mac アプリとゲートウェイのライフサイクルを統合する
title: "ゲートウェイのライフサイクル"
x-i18n:
  source_hash: "73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41"
---

# macOS でのゲートウェイのライフサイクル

macOS アプリはデフォルトで **launchd 経由でゲートウェイを管理**し、起動しません
ゲートウェイを子プロセスとして扱います。まず、すでに実行中のサーバーに接続しようとします。
設定されたポート上のゲートウェイ。到達可能なものがない場合は、launchd が有効になります。
外部 `openclaw` CLI 経由のサービス (組み込みランタイムなし)。これにより、
ログイン時に信頼性の高い自動起動とクラッシュ時に再起動します。

子プロセス モード (アプリによって直接生成されるゲートウェイ) は現在 **使用されていません**。
UI との緊密な結合が必要な場合は、ターミナルでゲートウェイを手動で実行します。

## デフォルトの動作 (launchd)

- アプリは、`ai.openclaw.gateway` というラベルの付いたユーザーごとの LaunchAgent をインストールします。
  (または、`--profile`/`OPENCLAW_PROFILE` を使用する場合は `ai.openclaw.<profile>`、従来の `com.openclaw.*` はサポートされます)。
- ローカル モードが有効な場合、アプリは LaunchAgent がロードされていることを確認し、
  必要に応じてゲートウェイを開始します。
- ログは、launchd ゲートウェイのログ パス (デバッグ設定に表示されます) に書き込まれます。

一般的なコマンド:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

名前付きプロファイルを実行する場合は、ラベルを `ai.openclaw.<profile>` に置き換えます。

## 署名されていない開発ビルド

`scripts/restart-mac.sh --no-sign` は、
署名キー。 launchd が署名のないリレー バイナリを指すことを防ぐには、次のようにします。

- `~/.openclaw/disable-launchagent` を書き込みます。

`scripts/restart-mac.sh` の署名付き実行は、マーカーが次の場合にこのオーバーライドをクリアします。
現在。手動でリセットするには:

```bash
rm ~/.openclaw/disable-launchagent
```

## アタッチ専用モードmacOS アプリに**launchd のインストールや管理を行わないようにする**には、次のコマンドを使用してアプリを起動します

`--attach-only` (または `--no-launchd`)。これにより `~/.openclaw/disable-launchagent` が設定されます。
そのため、アプリはすでに実行されているゲートウェイにのみ接続されます。同じように切り替えることができます
デバッグ設定での動作。

## リモートモード

リモート モードではローカル ゲートウェイは起動されません。アプリは SSH トンネルを使用して、
リモート ホストとそのトンネル経由で接続します。

## launchd を好む理由

- ログイン時に自動起動します。
- 組み込みの再起動/KeepAlive セマンティクス。
- 予測可能なログと監視。

真の子プロセス モードが再び必要になった場合は、次のように文書化する必要があります。
個別の明示的な開発専用モード。
