---
summary: "ルートレス Podman コンテナで OpenClaw を実行する"
description: "rootless Podman で OpenClaw Gateway を動かすためのイメージ利用方法、設定、運用上の注意点を説明します。"
read_when:
  - Docker の代わりに Podman を使ったコンテナ化ゲートウェイが必要な場合
title: "rootless Podman で OpenClaw を動かす導入手順"
---
**ルートレス** Podman コンテナで OpenClaw ゲートウェイを実行します。使用するイメージは Docker と同じで、リポジトリの [Dockerfile](https://github.com/openclaw/openclaw/blob/main/Dockerfile) からビルドします。

## 要件

- Podman (ルートレス)
- 初回セットアップ用の sudo 権限 (ユーザー作成、イメージビルド)

## クイックスタート

**1. 初回セットアップ** (リポジトリルートで実行。ユーザー作成、イメージビルド、起動スクリプト配置を行います):

```bash
./setup-podman.sh
```

これにより、ウィザードを実行しなくてもゲートウェイが起動できるよう、最小構成の `~openclaw/.openclaw/openclaw.json` (`gateway.mode="local"` を設定) も作成されます。

デフォルトでは、コンテナは systemd サービスとしては **インストールされません**。起動は手動です (後述)。自動起動と再起動を含む本番向け構成にしたい場合は、代わりに systemd の Quadlet ユーザーサービスとして導入してください。

```bash
./setup-podman.sh --quadlet
```

(`OPENCLAW_PODMAN_QUADLET=1` を設定しても同じです。コンテナと起動スクリプトだけを入れたい場合は `--container` を使います。)

任意のビルド時環境変数 (`setup-podman.sh` 実行前に設定):

- `OPENCLAW_DOCKER_APT_PACKAGES` — イメージのビルド中に追加の apt パッケージをインストールします
- `OPENCLAW_EXTENSIONS` — 拡張機能の依存関係を事前インストールします (スペース区切りの拡張機能名。例: `diagnostics-otel matrix`)

**2. ゲートウェイを起動** (手動、簡易スモークテスト向け):

```bash
./scripts/run-openclaw-podman.sh launch
```

**3. オンボーディングウィザード** (チャネルやプロバイダーを追加する場合など):

```bash
./scripts/run-openclaw-podman.sh launch setup
```

その後 `http://127.0.0.1:18789/` を開き、`~openclaw/.openclaw/.env` にあるトークン、またはセットアップ時に表示された値を使ってアクセスします。

## Systemd (Quadlet、オプション)

`./setup-podman.sh --quadlet` (または `OPENCLAW_PODMAN_QUADLET=1`) を実行すると、[Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) ユニットが入り、ゲートウェイが `openclaw` ユーザーの systemd ユーザーサービスとして動作します。サービスはセットアップの最後に有効化され、そのまま起動されます。

- **開始:** `sudo systemctl --machine openclaw@ --user start openclaw.service`
- **停止:** `sudo systemctl --machine openclaw@ --user stop openclaw.service`
- **ステータス:** `sudo systemctl --machine openclaw@ --user status openclaw.service`
- **ログ:** `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`

Quadlet ファイルは `~openclaw/.config/containers/systemd/openclaw.container` にあります。ポートや環境変数を変更する場合は、そのファイル、または参照元の `.env` を編集し、`sudo systemctl --machine openclaw@ --user daemon-reload` を実行してからサービスを再起動してください。起動時には、`openclaw` の lingering が有効であれば自動起動します (loginctl が使える環境ではセットアップ時に有効化されます)。

初回セットアップで Quadlet を使わなかった場合でも、後から `./setup-podman.sh --quadlet` を再実行すれば追加できます。

## openclaw ユーザー (非ログイン)

`setup-podman.sh` は、専用のシステムユーザー `openclaw` を作成します。

- **シェル:** `nologin` — 対話ログインを許可せず、攻撃面を減らします
- **ホーム:** 例 `/home/openclaw` — `~/.openclaw` (設定、ワークスペース) と起動スクリプト `run-openclaw-podman.sh` を配置します
- **ルートレス Podman:** ユーザーには **subuid** と **subgid** の範囲が必要です。多くのディストリビューションでは、ユーザー作成時に自動割り当てされます。セットアップで警告が出た場合は、`/etc/subuid` と `/etc/subgid` に次の行を追加してください。

  ```text
  openclaw:100000:65536
  ```

  その後、そのユーザーとしてゲートウェイを起動します (cron や systemd から実行する場合など)。

  ```bash
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh setup
  ```

- **設定:** `/home/openclaw/.openclaw` にアクセスできるのは `openclaw` と root のみです。設定編集は、ゲートウェイ起動後に Control UI を使うか、`sudo -u openclaw $EDITOR /home/openclaw/.openclaw/openclaw.json` を実行してください。

## 環境と設定

- **トークン:** `~openclaw/.openclaw/.env` に `OPENCLAW_GATEWAY_TOKEN` として保存されます。存在しない場合は、`setup-podman.sh` と `run-openclaw-podman.sh` が `openssl`、`python3`、または `od` を使って生成します。
- **任意設定:** 同じ `.env` で、プロバイダーキー (例: `GROQ_API_KEY`、`OLLAMA_API_KEY`) やその他の OpenClaw 環境変数を設定できます。
- **ホストポート:** デフォルトでは、スクリプトは `18789` (Gateway) と `18790` (ブリッジ) をマップします。 起動時に、 **ホスト** のポートマッピングを `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` と `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` で上書きします。
- **ゲートウェイの bind:** デフォルトでは、`run-openclaw-podman.sh` は安全なローカルアクセスのため `--bind loopback` で起動します。LAN に公開する場合は `OPENCLAW_GATEWAY_BIND=lan` を設定し、`openclaw.json` で `gateway.controlUi.allowedOrigins` を構成するか、明示的に host-header fallback を有効にしてください。
- **パス:** ホスト側の既定値は `~openclaw/.openclaw` と `~openclaw/.openclaw/workspace` です。必要に応じて `OPENCLAW_CONFIG_DIR` と `OPENCLAW_WORKSPACE_DIR` で上書きします。

## ストレージモデル

- **永続的なホストデータ:** `OPENCLAW_CONFIG_DIR` と `OPENCLAW_WORKSPACE_DIR` はコンテナにバインドマウントされ、ホスト上の状態を保持します。
- **一時サンドボックス tmpfs:** `agents.defaults.sandbox` を有効にすると、ツールサンドボックスコンテナは `/tmp`、`/var/tmp`、`/run` に `tmpfs` をマウントします。これらはメモリ上の一時領域で、サンドボックスコンテナ終了とともに消えます。最上位の Podman コンテナ側では独自の tmpfs は追加しません。
- **ディスク増加の主な箇所:** `media/`、`agents/<agentId>/sessions/sessions.json`、トランスクリプト JSONL、`cron/runs/*.jsonl`、および `/tmp/openclaw/` (または設定した `logging.file`) 配下のローテーションログに注意してください。

`setup-podman.sh` は現在、イメージ tar をプライベートな一時ディレクトリへ退避し、セットアップ時に選ばれたベースディレクトリを表示します。非 root 実行では、安全に使える場合にのみ `TMPDIR` を採用し、それ以外は `/var/tmp`、次に `/tmp` へフォールバックします。保存した tar は所有者のみが参照でき、対象ユーザーの `podman load` へストリーミングされるため、呼び出し元の private な一時ディレクトリがセットアップの妨げになることはありません。

## 便利なコマンド

- **ログ:** Quadlet の場合: `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`。 スクリプトの場合: `sudo -u openclaw podman logs -f openclaw`
- **停止:** Quadlet の場合: `sudo systemctl --machine openclaw@ --user stop openclaw.service`。 スクリプトの場合: `sudo -u openclaw podman stop openclaw`
- **再開:** Quadlet の場合: `sudo systemctl --machine openclaw@ --user start openclaw.service`。 スクリプトの場合: 起動スクリプトまたは `podman start openclaw` を再実行します。
- **コンテナの削除:** `sudo -u openclaw podman rm -f openclaw` — ホスト上の設定とワークスペースは保持されます。

## トラブルシューティング

- **設定や auth-profiles で Permission denied (EACCES) が出る:** コンテナはデフォルトで `--userns=keep-id` を使い、スクリプトを実行したホストユーザーと同じ uid/gid で動きます。ホスト側の `OPENCLAW_CONFIG_DIR` と `OPENCLAW_WORKSPACE_DIR` がそのユーザー所有になっているか確認してください。
- **Gateway の起動がブロックされる (`gateway.mode=local` がない):** `~openclaw/.openclaw/openclaw.json` が存在し、 `gateway.mode="local"` が設定されていることを確認してください。 `setup-podman.sh` は、存在しない場合はこのファイルを作成します。
- **`openclaw` ユーザーでルートレス Podman が失敗する:** `/etc/subuid` と `/etc/subgid` に `openclaw` 用の行 (例: `openclaw:100000:65536`) があるか確認してください。なければ追加して再実行します。
- **コンテナ名が使用中:** 起動スクリプトは `podman run --replace` を使用するため、再開時に既存のコンテナが置き換えられます。 手動でクリーンアップするには: `podman rm -f openclaw`。
- **`openclaw` として実行したときにスクリプトが見つからない:** `run-openclaw-podman.sh` が `openclaw` のホーム (例: `/home/openclaw/run-openclaw-podman.sh`) にコピーされるよう、`setup-podman.sh` を実行済みか確認してください。
- **Quadlet サービスが見つからないか、起動に失敗する:** `.container` ファイルを編集した後、 `sudo systemctl --machine openclaw@ --user daemon-reload` を実行します。 Quadlet には cgroups v2 が必要です: `podman info --format '{{.Host.CgroupsVersion}}'` が `2` を表示するはずです。

## オプション: 自分のユーザーで実行する

専用の `openclaw` ユーザーを使わず、通常ユーザーとしてゲートウェイを動かすこともできます。その場合は、イメージをビルドし、`OPENCLAW_GATEWAY_TOKEN` を含む `~/.openclaw/.env` を作成し、`--userns=keep-id` と `~/.openclaw` へのマウント付きでコンテナを起動します。起動スクリプトは `openclaw` ユーザーフロー向けなので、単一ユーザー構成ではスクリプト内の `podman run` 相当を手動実行し、設定とワークスペースを自分のホームへ向けてください。通常は、`setup-podman.sh` を使い、`openclaw` ユーザーで分離運用する方法を推奨します。
