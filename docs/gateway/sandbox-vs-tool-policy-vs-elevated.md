---
title: "OpenClaw サンドボックス・ツールポリシー・昇格切り分けガイド"
summary: "ツールがブロックされる原因の切り分け: サンドボックス環境、ツールの許可/拒否ポリシー、および exec ツールの昇格ゲート"
description: "サンドボックス、ツール許可/拒否、exec 昇格の違いを整理し、ツールがブロックされる原因を最短で切り分ける手順を示します。"
read_when:
  - 「サンドボックス獄（jail）」に陥った場合や、ツール/昇格の拒否が発生した際、どの構成キーを変更すべきか知りたい場合
status: active
x-i18n:
  source_hash: "863ea5e6d137dfb61f12bd686b9557d6df1fd0c13ba5f15861bf72248bc975f1"
---
OpenClaw には、互いに関連しつつも異なる役割を持つ 3 つの制御機能があります:

1. **サンドボックス** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`): ツールを **どこで実行するか**（Docker コンテナ内か、ホスト上か）を決定します。
2. **ツールポリシー** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`): **どのツールが利用可能 / 許可されるか** を決定します。
3. **昇格 (Elevated)** (`tools.elevated.*`, `agents.list[].tools.elevated.*`): サンドボックス環境から **ホスト上で直接実行するための、exec ツール専用のエスケープハッチ（脱出口）** です。

## クイックデバッグ

インスペクター（調査ツール）を使用して、OpenClaw が実際にどのように判断しているかを確認できます:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

このコマンドは以下を出力します:
- 適用されているサンドボックスモード / スコープ / ワークスペースへのアクセス権。
- 現在のセッションがサンドボックス化されているかどうか（メインか非メインか）。
- 適用されているサンドボックスツールの許可 / 拒否状態（エージェント設定、グローバル設定、デフォルトのどこに由来するか）。
- 昇格用ゲートの状態と、修正すべき構成キーのパス。

## サンドボックス: ツールの実行場所

サンドボックス化は `agents.defaults.sandbox.mode` によって制御されます:

- `"off"`: すべてがホスト上で実行されます。
- `"non-main"`: 非メイン（non-main）セッションのみがサンドボックス化されます。グループチャットやチャネル経由の通信で「なぜか制限されている」と感じる場合の多くはこれが原因です。
- `"all"`: すべてのセッションがサンドボックス内で実行されます。

詳細なマトリクス（スコープ、ワークスペースのマウント、イメージ設定）については、[サンドボックス](/gateway/sandboxing) を参照してください。

### バインドマウントに関するセキュリティ上の注意

- `docker.binds` は、サンドボックスのファイルシステムを **貫通（pierce）** させます。マウントしたディレクトリは、指定したモード（`:ro` または `:rw`）でコンテナ内から見えてしまいます。
- モードを省略した場合はデフォルトで読み書き可能（read-write）となります。ソースコードやシークレット情報をマウントする場合は `:ro`（読み取り専用）を推奨します。
- `scope: "shared"` の場合、エージェントごとの個別のバインド設定は無視されます（グローバル設定のみが適用されます）。
- `/var/run/docker.sock` をバインドすると、サンドボックス内からホストの Docker 制御が可能になります。意図的な場合を除き、行わないでください。
- ワークスペースへのアクセス設定 (`workspaceAccess: "ro"`/`"rw"`) は、このバインドマウント設定とは独立して機能します。

## ツールポリシー: ツールの存在と呼び出し可否

以下の 2 つのレイヤーが重要です:

- **ツールプロファイル**: `tools.profile` および `agents.list[].tools.profile`（基本となる許可リスト）。
- **プロバイダー別ツールプロファイル**: `tools.byProvider[provider].profile` など。
- **グローバル / エージェント別ポリシー**: `tools.allow`/`tools.deny` および `agents.list[].tools.allow`/`deny`。
- **プロバイダー別ポリシー**: `tools.byProvider[provider].allow/deny`。
- **サンドボックス内ツールポリシー** (サンドボックス実行時のみ適用): `tools.sandbox.tools.allow`/`deny` および `agents.list[].tools.sandbox.tools.*`。

鉄則:
- **`deny`（拒否）が常に優先されます。**
- `allow`（許可）リストが空でない場合、そこに記載されていないツールはすべてブロックされます。
- ツールポリシーは「絶対的な停止」を意味します。`/exec` コマンドで設定を変えても、ポリシーで拒否されている `exec` ツールを動かすことはできません。
- `/exec` は、認可された送信者に対して「セッション内でのデフォルト挙動」を変更するだけであり、ツールの実行権限そのものを与えるものではありません。
- プロバイダー指定のキーには、`provider`（例: `google-antigravity`）または `provider/model`（例: `openai/gpt-5.2`）のいずれかを使用できます。

### ツールグループ (短縮記法)

ツールポリシー（グローバル、エージェント、サンドボックス）では、複数のツールをまとめて指定できる `group:*` 形式をサポートしています:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

利用可能なグループ:
- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: すべての組み込みツール（外部プロバイダープラグインを除く）

## 昇格 (Elevated): exec ツールのみ「ホストで実行」

昇格（Elevated）は、追加のツールを使えるようにするものではなく、あくまで `exec` の実行場所にのみ影響します。

- サンドボックス化されている場合、`/elevated on`（または `exec` 時に `elevated: true` を指定）することで、そのコマンドをホスト上で実行できます（承認ステップが必要な場合は引き続き適用されます）。
- `/elevated full` を使用すると、そのセッションにおいて `exec` の承認ステップもスキップします。
- 最初からホスト上で直接ツールを動かしている（サンドボックスオフ）場合、昇格設定は実質的に何もしません（ただしゲートのチェックは行われます）。
- 昇格は **スキル（skill）のスコープ内には収まりません**。また、ツールポリシーの許可/拒否を上書きすることもありません。
- `/exec` は昇格とは別の設定です。認可された送信者からのセッションごとの `exec` のデフォルト設定を調整するだけのものです。

制限（ゲート）の構成:
- 有効化設定: `tools.elevated.enabled` (およびオプションで `agents.list[].tools.elevated.enabled`)。
- 送信者許可リスト: `tools.elevated.allowFrom.<provider>` (およびオプションでエージェント別設定)。

詳細は [昇格（Elevated）モード](/tools/elevated) を参照してください。

## よくある「サンドボックス獄」の修正方法

### 「Tool X blocked by sandbox tool policy」と表示される

以下のいずれかで修正します:
- サンドボックスを無効にする: `agents.defaults.sandbox.mode=off` (またはエージェント別に設定)。
- サンドボックス内での実行を許可する:
  - `tools.sandbox.tools.deny` からそのツールを削除する。
  - または、`tools.sandbox.tools.allow` にそのツールを追加する。

### 「これはメイン（main）セッションのはずなのに、なぜサンドボックス化されているのか？」

`"non-main"` モードにおいて、グループチャットや各チャネルのキーは「メイン」とはみなされません。`sandbox explain` で表示されるメインセッションのキーを使用するか、あるいはモードを `"off"` に切り替えてください。
