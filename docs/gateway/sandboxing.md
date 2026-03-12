---
summary: "OpenClaw サンドボックスの仕組み: 動作モード、スコープ、ワークスペースへのアクセス、および Docker イメージ"
description: "サンドボックスの対象、モード、スコープ、ワークスペース共有、バインドマウント、イメージ準備、escape hatch の考え方を説明します。"
title: "OpenClaw サンドボックス設定ガイド Docker 実行・権限範囲・構成"
read_when:
  - サンドボックスの詳細な解説を読みたい場合
  - "`agents.defaults.sandbox` の設定を調整する必要がある場合"
status: active
x-i18n:
  source_hash: "0d7bb6c468517fec90b277065201f2d2e322a14b036b57a2b175abdf74a66668"
---
OpenClaw は、**Docker コンテナ内でツールを実行** することで、不測の事態による影響範囲（Blast radius）を最小限に抑えることができます。これは **オプション機能** であり、構成設定（`agents.defaults.sandbox` または `agents.list[].sandbox`）で制御します。サンドボックスをオフにすると、ツールはホスト上で直接実行されます。ゲートウェイプロセス自体は常にホスト上で動作し、ツールの実行時のみ分離されたサンドボックス環境が使用されます。

これは完全なセキュリティ境界を提供するものではありませんが、モデルが予期しない挙動（誤ったファイル操作やコマンド実行など）をした際に、ファイルシステムやプロセスへのアクセスを実質的に制限できます。

## サンドボックスの対象となるもの

- ツール実行（`exec`, `read`, `write`, `edit`, `apply_patch`, `process` など）。
- オプションのサンドボックス化されたブラウザ (`agents.defaults.sandbox.browser`)。
  - デフォルトでは、ブラウザツールが必要になった際に、サンドボックス内のブラウザが自動起動（CDP エンドポイントの疎通確認を含む）します。起動挙動は `autoStart` や `autoStartTimeoutMs` で調整可能です。
  - サンドボックスブラウザのコンテナは、デフォルトで専用の Docker ネットワーク (`openclaw-sandbox-browser`) を使用し、グローバルな `bridge` ネットワークからは分離されます。
  - `cdpSourceRange` 設定により、コンテナへの CDP 接続（Ingress）を特定の CIDR 範囲（例: `172.21.0.1/32`）に制限できます。
  - noVNC による画面監視は、デフォルトでパスワード保護されます。OpenClaw は短命なトークンを含む URL を発行し、URL フラグメントにパスワードを埋め込んで noVNC を開きます（クエリパラメータやヘッダーログにパスワードが残らないように配慮されています）。
  - `allowHostControl` を有効にすると、サンドボックス内のセッションから明示的にホスト側のブラウザを操作できるようになります。
  - `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts` などの許可リストにより、`target: "custom"` 指定時の接続先を制限できます。

サンドボックスの対象 **外** となるもの:

- ゲートウェイプロセス自体。
- ホスト上での実行が明示的に許可されたツール（例: `tools.elevated`）。
  - **昇格（Elevated）された exec 実行はホスト上で行われ、サンドボックスをバイパスします。**
  - サンドボックス機能自体がオフの場合、`tools.elevated` による挙動の変化はありません（常にホスト上で実行されるため）。詳細は [昇格（Elevated）モード](/tools/elevated) を参照してください。

## 動作モード

`agents.defaults.sandbox.mode` により、サンドボックスを **いつ** 使用するかを制御します:

- `"off"`: サンドボックスを使用しません。
- `"non-main"`: **メイン（main）以外のセッションのみ** をサンドボックス化します。ホスト上のファイルを自由に扱いたい通常のチャットはメインセッションで行い、それ以外を制限したい場合のデフォルト設定です。
- `"all"`: すべてのセッションをサンドボックス内で実行します。

注意: `"non-main"` の判定はエージェント ID ではなく、`session.mainKey`（デフォルトは `"main"`）に基づきます。グループチャットや各種チャネルのセッションは独自のキーを持つため、これらは「非メイン」として扱われ、サンドボックス化されます。

## スコープ (Scope)

`agents.defaults.sandbox.scope` により、**いくつのコンテナ** を作成するかを制御します:

- `"session"` (デフォルト): セッション（会話単位）ごとに 1 つのコンテナを作成します。
- `"agent"`: エージェントごとに 1 つのコンテナを作成します。
- `"shared"`: すべてのサンドボックスセッションで単一のコンテナを共有します。

## ワークスペースへのアクセス

`agents.defaults.sandbox.workspaceAccess` により、**サンドボックスから何が見えるか** を制御します:

- `"none"` (デフォルト): ツールからは `~/.openclaw/sandboxes` 配下の専用領域のみが見えます。
- `"ro"`: エージェントのワークスペースを `/agent` に読み取り専用（read-only）でマウントします。`write`, `edit`, `apply_patch` などの書き込み系ツールは無効化されます。
- `"rw"`: エージェントのワークスペースを `/workspace` に読み書き可能（read/write）でマウントします。

受信したメディアファイルは、アクティブなサンドボックスワークスペース内 (`media/inbound/*`) にコピーされます。
スキルに関する補足: `read` ツールはサンドボックス内のルートを基準に動作します。`workspaceAccess: "none"` の場合、OpenClaw は対象となるスキルの実行ファイルをサンドボックス内の `.../skills` へミラーリングし、読み取れるようにします。`"rw"` の場合は、`/workspace/skills` から直接読み取り可能です。

## カスタムバインドマウント

`agents.defaults.sandbox.docker.binds` を使用して、ホスト上の任意のディレクトリをコンテナ内にマウントできます。
形式: `ホスト側パス:コンテナ内パス:モード` (例: `"/home/user/source:/source:rw"`)。

グローバル設定とエージェントごとの設定は **マージ** されます。ただし、`scope: "shared"` の場合はエージェントごとの設定は無視されます。

`agents.defaults.sandbox.browser.binds` は、**サンドボックスブラウザ** コンテナ専用のマウント設定です。
- これが設定されている場合（空配列 `[]` を含む）、ブラウザコンテナにおいては `docker.binds` の設定を完全に置き換えます。
- 設定されていない（省略された）場合は、通常の `docker.binds` の設定が使用されます（後方互換性のため）。

設定例 (読み取り専用のソースと追加のデータディレクトリをマウント):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

セキュリティ上の注意:
- バインドマウントはサンドボックスのファイルシステム制限を回避します。指定したモード（`:ro` または `:rw`）でホストのパスがそのまま公開されます。
- OpenClaw は危険なパスのマウントをブロックします（例: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` およびこれらを露出させる親ディレクトリ）。
- 機密情報（シークレット、SSH キー、サービス認証情報など）をマウントする場合は、絶対に必要な場合を除き `:ro` (読み取り専用) にしてください。
- ワークスペースへの読み取りアクセスのみが必要な場合は `workspaceAccess: "ro"` と組み合わせてください。バインドモードはそれとは独立して機能します。
- バインドマウントとツールポリシー、および昇格実行の相互作用については、[サンドボックス vs ツールポリシー vs 昇格](/gateway/sandbox-vs-tool-policy-vs-elevated) を参照してください。

## イメージの作成とセットアップ

デフォルトイメージ: `openclaw-sandbox:bookworm-slim`

以下のスクリプトでイメージをビルドします（初回のみ）:

```bash
scripts/sandbox-setup.sh
```

補足: デフォルトイメージには **Node.js は含まれていません**。スキルが Node.js（または他のランタイム）を必要とする場合は、カスタムイメージを作成するか、`sandbox.docker.setupCommand` を使用してインストールしてください（ネットワークアクセス、書き込み可能なルート権限、root ユーザー設定が必要です）。

一般的なツール（`curl`, `jq`, `nodejs`, `python3`, `git` など）を含んだより多機能なイメージを使用したい場合は、以下をビルドしてください:

```bash
scripts/sandbox-common-setup.sh
```

その後、`agents.defaults.sandbox.docker.image` に `openclaw-sandbox-common:bookworm-slim` を指定します。

サンドボックスブラウザ用のイメージ:

```bash
scripts/sandbox-browser-setup.sh
```

デフォルトでは、サンドボックスコンテナは **ネットワークなし (no network)** で実行されます。変更するには `agents.defaults.sandbox.docker.network` を上書きしてください。

同梱のサンドボックスブラウザイメージには、コンテナ環境に適した保守的な Chromium 起動設定が適用されています。現在のデフォルト設定には以下が含まれます:
- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT から派生>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`, `--no-default-browser-check`
- グラフィックス制限: `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer`（コンテナに GPU がない場合に有用。WebGL 等が必要な場合は `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` で無効化可能）
- リソース制限: `--renderer-process-limit=2`（`OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT` で調整可能）
- `--disable-extensions`（拡張機能が必要な場合は `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` で無効化可能）
- その他、バックグラウンド通信やクラッシュレポートの無効化など。

異なるプロンプトプロファイルが必要な場合は、カスタムブラウザイメージを使用して独自のエントリポイントを指定してください。ローカル（非コンテナ）の Chromium プロファイルを使用する場合は、`browser.extraArgs` を使用して起動フラグを追加できます。

セキュリティ上の制約:
- `network: "host"` はブロックされます。
- `network: "container:<id>"` は、ネームスペース共有によるバイパスのリスクがあるため、デフォルトでブロックされます。
- 緊急の上書き設定: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker によるインストールおよびコンテナ化されたゲートウェイの詳細は、[Docker での利用](/install/docker) を参照してください。

## setupCommand (コンテナの初回セットアップ)

`setupCommand` は、サンドボックスコンテナが作成された直後に **一度だけ** 実行されます（実行のたびに走るわけではありません）。コンテナ内で `sh -lc` を介して実行されます。

設定パス:
- グローバル: `agents.defaults.sandbox.docker.setupCommand`
- エージェント別: `agents.list[].sandbox.docker.setupCommand`

よくある落とし穴:
- デフォルトの `docker.network` は `"none"`（外部通信なし）のため、パッケージのインストールなどは失敗します。
- `readOnlyRoot: true` の場合、書き込みができません。`false` に設定するか、あらかじめ必要なものを含めたカスタムイメージを作成してください。
- パッケージインストールには root 権限が必要です（`user` 設定を省略するか `"0:0"` に設定）。
- サンドボックス内での実行はホストの `process.env` を **継承しません**。スキルの API キーなどが必要な場合は、`agents.defaults.sandbox.docker.env` を使用するか、イメージ内に含めてください。

## ツールポリシーとエスケープハッチ

ツールの許可 / 拒否ポリシーは、サンドボックスのルールよりも先に適用されます。グローバル設定やエージェント設定で拒否されているツールは、サンドボックス化しても利用できるようにはなりません。

`tools.elevated` は、ホスト上で直接 `exec` を実行するための明示的なエスケープハッチです。`/exec` 指示は認可された送信者にのみ適用され、セッションごとに保持されます。`exec` ツールを完全に禁止したい場合は、ツールポリシーの `deny` を使用してください（詳細は [サンドボックス vs ツールポリシー vs 昇格](/gateway/sandbox-vs-tool-policy-vs-elevated) を参照）。

デバッグ方法:
- `openclaw sandbox explain` を使用して、現在のサンドボックスモード、適用されているツールポリシー、および修正すべき構成キーを確認してください。
- 「なぜこれがブロックされているのか？」という疑問には、[サンドボックス vs ツールポリシー vs 昇格](/gateway/sandbox-vs-tool-policy-vs-elevated) の考え方が役立ちます。

## マルチエージェントによる上書き

各エージェントは、サンドボックス設定およびツール設定を個別に上書きできます。
設定箇所: `agents.list[].sandbox`, `agents.list[].tools` (およびサンドボックス内ツールポリシー用の `agents.list[].tools.sandbox.tools`)。
優先順位の詳細は [マルチエージェントにおけるサンドボックスとツール](/tools/multi-agent-sandbox-tools) を参照してください。

## 最小限の有効化設定例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 関連ドキュメント

- [サンドボックス構成リファレンス](/gateway/configuration#agentsdefaults-sandbox)
- [マルチエージェントにおけるサンドボックスとツール](/tools/multi-agent-sandbox-tools)
- [セキュリティ](/gateway/security)
