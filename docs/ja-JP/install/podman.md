---
summary: "ルートレス Podman コンテナで OpenClaw を実行する"
read_when:
  - Docker の代わりに Podman を使用したコンテナ化された Gateway が必要な場合
title: "Podman"
---

# Podman

**ルートレス** Podman コンテナで OpenClaw Gateway を実行します。Docker と同じイメージを使用します (リポジトリの [Dockerfile](https://github.com/openclaw/openclaw/blob/main/Dockerfile) からビルドします)。

## 要件

- Podman (ルートレス)
- ワンタイムセットアップ用の Sudo (ユーザーの作成、イメージのビルド)

## クイックスタート

**1. ワンタイムセットアップ** (リポジトリのルートから。ユーザーを作成し、イメージをビルドし、起動スクリプトをインストールします):

```bash
./setup-podman.sh
```

これにより、ウィザードを実行せずに Gateway が起動できるように、最小限の `~openclaw/.openclaw/openclaw.json` ( `gateway.mode="local"` を設定) も作成されます。

デフォルトでは、コンテナは systemd サービスとしてインストール**されません**。手動で起動します (以下を参照)。 自動起動と再起動を備えた本番環境スタイルのセットアップの場合は、代わりに systemd Quadlet ユーザーサービスとしてインストールします:

```bash
./setup-podman.sh --quadlet
```

(または `OPENCLAW_PODMAN_QUADLET=1` を設定します。コンテナと起動スクリプトのみをインストールするには `--container` を使用します。)

オプションのビルド時環境変数 (`setup-podman.sh` を実行する前に設定します):

- `OPENCLAW_DOCKER_APT_PACKAGES` — イメージのビルド中に追加の apt パッケージをインストールします
- `OPENCLAW_EXTENSIONS` — 拡張機能の依存関係を事前インストールします (スペース区切りの拡張機能名。例: `diagnostics-otel matrix`)

**2. Gateway の起動** (手動、クイックスモークテスト用):

```bash
./scripts/run-openclaw-podman.sh launch
```

**3. オンボーディングウィザード** (例: チャネルまたはプロバイダを追加する場合):

```bash
./scripts/run-openclaw-podman.sh launch setup
```

その後、 `http://127.0.0.1:18789/` を開き、 `~openclaw/.openclaw/.env` からのトークン (またはセットアップで表示された値) を使用します。

## Systemd (Quadlet、オプション)

`./setup-podman.sh --quadlet` (または `OPENCLAW_PODMAN_QUADLET=1`) を実行した場合、[Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) ユニットがインストールされ、Gateway が openclaw ユーザーの systemd ユーザーサービスとして実行されるようになります。 サービスはセットアップの最後に有効化され、開始されます。

- **開始:** `sudo systemctl --machine openclaw@ --user start openclaw.service`
- **停止:** `sudo systemctl --machine openclaw@ --user stop openclaw.service`
- **ステータス:** `sudo systemctl --machine openclaw@ --user status openclaw.service`
- **ログ:** `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`

Quadlet ファイルは `~openclaw/.config/containers/systemd/openclaw.container` にあります。 ポートや環境変数を変更するには、そのファイル (またはそのソースとなる `.env`) を編集し、 `sudo systemctl --machine openclaw@ --user daemon-reload` を実行してサービスを再起動します。 起動時、openclaw の lingering が有効になっている場合、サービスは自動的に開始されます (loginctl が利用可能な場合、セットアップでこれが実行されます)。

Quadlet を使用しなかった初期セットアップの**後**に Quadlet を追加するには、再実行します: `./setup-podman.sh --quadlet`。

## openclaw ユーザー (非ログイン)

`setup-podman.sh` は、専用のシステムユーザー `openclaw` を作成します:

- **シェル:** `nologin` — 対話型ログインはありません。アタックサーフェスを減らします。
- **ホーム:** 例 `/home/openclaw` — `~/.openclaw` (設定、ワークスペース) と起動スクリプト `run-openclaw-podman.sh` を保持します。
- **ルートレス Podman:** ユーザーは **subuid** と **subgid** の範囲を持っている必要があります。 多くのディストリビューションは、ユーザーの作成時にこれらを自動的に割り当てます。 セットアップで警告が出力された場合は、 `/etc/subuid` と `/etc/subgid` に行を追加します:

  ```text
  openclaw:100000:65536
  ```

  次に、そのユーザーとして Gateway を起動します (例: cron または systemd から):

  ```bash
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh setup
  ```

- **設定:** `/home/openclaw/.openclaw` にアクセスできるのは `openclaw` と root だけです。 設定を編集するには: Gateway が起動したら Control UI を使用するか、 `sudo -u openclaw $EDITOR /home/openclaw/.openclaw/openclaw.json` を実行します。

## 環境と設定

- **トークン:** `~openclaw/.openclaw/.env` に `OPENCLAW_GATEWAY_TOKEN` として保存されます。 欠落している場合は、 `setup-podman.sh` と `run-openclaw-podman.sh` が生成します (`openssl`、 `python3`、または `od` を使用)。
- **オプション:** その `.env` で、プロバイダのキー (例: `GROQ_API_KEY`、 `OLLAMA_API_KEY`) やその他の OpenClaw 環境変数を設定できます。
- **ホストポート:** デフォルトでは、スクリプトは `18789` (Gateway) と `18790` (ブリッジ) をマップします。 起動時に、 **ホスト** のポートマッピングを `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` と `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` で上書きします。
- **Gateway のバインド:** デフォルトでは、 `run-openclaw-podman.sh` は安全なローカルアクセスのために `--bind loopback` を使用して Gateway を起動します。 LAN に公開するには、 `OPENCLAW_GATEWAY_BIND=lan` を設定し、 `openclaw.json` で `gateway.controlUi.allowedOrigins` を構成します (または明示的に host-header フォールバックを有効にします)。
- **パス:** ホストの設定とワークスペースのデフォルトは `~openclaw/.openclaw` と `~openclaw/.openclaw/workspace` です。 起動スクリプトで使用されるホストパスを `OPENCLAW_CONFIG_DIR` と `OPENCLAW_WORKSPACE_DIR` で上書きします。

## ストレージモデル

- **永続的なホストデータ:** `OPENCLAW_CONFIG_DIR` と `OPENCLAW_WORKSPACE_DIR` はコンテナにバインドマウントされ、ホスト上の状態を保持します。
- **一時的なサンドボックス tmpfs:** `agents.defaults.sandbox` を有効にすると、ツールサンドボックスコンテナは `/tmp`、 `/var/tmp`、および `/run` に `tmpfs` をマウントします。 これらのパスはメモリでバックアップされ、サンドボックスコンテナと共に消滅します。最上位の Podman コンテナのセットアップは、独自の tmpfs マウントを追加しません。
- **ディスクの増加のホットスポット:** 注意すべき主なパスは `media/`、 `agents/<agentId>/sessions/sessions.json`、トランスクリプト JSONL ファイル、 `cron/runs/*.jsonl`、および `/tmp/openclaw/` (または構成した `logging.file`) の下のローリングファイルログです。

`setup-podman.sh` は現在、プライベートな一時ディレクトリにイメージ tar をステージングし、セットアップ中に選択されたベースディレクトリを出力します。 非 root での実行の場合、そのベースが安全に使用できる場合にのみ `TMPDIR` を受け入れます。それ以外の場合は `/var/tmp`、次に `/tmp` にフォールバックします。 保存された tar は所有者のみに保持され、ターゲットユーザーの `podman load` にストリーミングされるため、プライベートな呼び出し元の一時ディレクトリがセットアップをブロックすることはありません。

## 便利なコマンド

- **ログ:** Quadlet の場合: `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`。 スクリプトの場合: `sudo -u openclaw podman logs -f openclaw`
- **停止:** Quadlet の場合: `sudo systemctl --machine openclaw@ --user stop openclaw.service`。 スクリプトの場合: `sudo -u openclaw podman stop openclaw`
- **再開:** Quadlet の場合: `sudo systemctl --machine openclaw@ --user start openclaw.service`。 スクリプトの場合: 起動スクリプトまたは `podman start openclaw` を再実行します。
- **コンテナの削除:** `sudo -u openclaw podman rm -f openclaw` — ホスト上の設定とワークスペースは保持されます。

## トラブルシューティング

- **設定または auth-profiles で Permission denied (EACCES) が発生する:** コンテナのデフォルトは `--userns=keep-id` であり、スクリプトを実行しているホストユーザーと同じ uid/gid で実行されます。 ホストの `OPENCLAW_CONFIG_DIR` と `OPENCLAW_WORKSPACE_DIR` がそのユーザーによって所有されていることを確認してください。
- **Gateway の起動がブロックされる (`gateway.mode=local` がない):** `~openclaw/.openclaw/openclaw.json` が存在し、 `gateway.mode="local"` が設定されていることを確認してください。 `setup-podman.sh` は、存在しない場合はこのファイルを作成します。
- **ユーザー openclaw に対してルートレス Podman が失敗する:** `/etc/subuid` と `/etc/subgid` に `openclaw` の行 (例: `openclaw:100000:65536`) が含まれていることを確認してください。 欠落している場合は追加し、再起動します。
- **コンテナ名が使用中:** 起動スクリプトは `podman run --replace` を使用するため、再開時に既存のコンテナが置き換えられます。 手動でクリーンアップするには: `podman rm -f openclaw`。
- **openclaw として実行時にスクリプトが見つからない:** `run-openclaw-podman.sh` が openclaw のホーム (例: `/home/openclaw/run-openclaw-podman.sh`) にコピーされるように、 `setup-podman.sh` が実行されたことを確認してください。
- **Quadlet サービスが見つからないか、起動に失敗する:** `.container` ファイルを編集した後、 `sudo systemctl --machine openclaw@ --user daemon-reload` を実行します。 Quadlet には cgroups v2 が必要です: `podman info --format '{{.Host.CgroupsVersion}}'` が `2` を表示するはずです。

## オプション: 自分のユーザーとして実行する

(専用の openclaw ユーザーではなく) 通常のユーザーとして Gateway を実行するには: イメージをビルドし、 `OPENCLAW_GATEWAY_TOKEN` を含む `~/.openclaw/.env` を作成し、 `--userns=keep-id` を使用して、 `~/.openclaw` へのマウントを使用してコンテナを実行します。 起動スクリプトは openclaw ユーザーフロー用に設計されています。単一ユーザーのセットアップの場合は、代わりにスクリプトの `podman run` コマンドを手動で実行し、設定とワークスペースをホームに向けます。 ほとんどのユーザーに推奨: `setup-podman.sh` を使用し、openclaw ユーザーとして実行して、設定とプロセスを分離します。
