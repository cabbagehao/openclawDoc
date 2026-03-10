---
title: "サンドボックス vs ツール ポリシー vs 昇格"
summary: "ツールがブロックされる理由: サンドボックス ランタイム、ツールの許可/拒否ポリシー、および昇格された実行ゲート"
read_when: "You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change."
status: active
x-i18n:
  source_hash: "863ea5e6d137dfb61f12bd686b9557d6df1fd0c13ba5f15861bf72248bc975f1"
---

# サンドボックス vs ツール ポリシー vs 昇格

OpenClaw には 3 つの関連する (しかし異なる) コントロールがあります。

1. **サンドボックス** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) は、**ツールが実行される場所** (Docker かホストか) を決定します。
2. **ツール ポリシー** (`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`) は、**どのツールが使用可能/許可されるか**を決定します。
3. **昇格** (`tools.elevated.*`、`agents.list[].tools.elevated.*`) は、サンドボックス化されているときにホスト上で実行する **実行専用のエスケープ ハッチ**です。

## クイックデバッグ

インスペクターを使用して、OpenClaw が実際に何を行っているかを確認します。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

出力されます:

- 効果的なサンドボックス モード/スコープ/ワークスペース アクセス
- セッションが現在サンドボックス化されているかどうか (メインか非メインか)
- 効果的なサンドボックス ツールの許可/拒否 (およびエージェント/グローバル/デフォルトからのものかどうか)
- 高架ゲートとフィックスイットキーパス

## サンドボックス: ツールが実行される場所

サンドボックスは `agents.defaults.sandbox.mode` によって制御されます。

- `"off"`: すべてがホスト上で実行されます。
- `"non-main"`: メイン以外のセッションのみがサンドボックス化されます (グループ/チャネルの一般的な「サプライズ」)。
- `"all"`: すべてがサンドボックス化されています。

完全なマトリクス (スコープ、ワークスペース マウント、イメージ) については、[サンドボックス](/gateway/sandboxing) を参照してください。

### バインドマウント (セキュリティクイックチェック)- `docker.binds` サンドボックス ファイルシステムを _pierces_ します。マウントしたものはすべて、設定したモード (`:ro` または `:rw`) でコンテナー内に表示されます

- モードを省略した場合、デフォルトは読み取り/書き込みです。ソース/シークレットについては `:ro` を使用してください。
- `scope: "shared"` は、エージェントごとのバインドを無視します (グローバル バインドのみが適用されます)。
- `/var/run/docker.sock` をバインドすると、ホスト制御が効果的にサンドボックスに渡されます。これは意図的に行うだけです。
- ワークスペース アクセス (`workspaceAccess: "ro"`/`"rw"`) はバインド モードから独立しています。

## ツール ポリシー: どのツールが存在するか、どのツールを呼び出し可能か

2 つの層が重要です:

- **ツール プロファイル**: `tools.profile` および `agents.list[].tools.profile` (基本許可リスト)
- **プロバイダー ツール プロファイル**: `tools.byProvider[provider].profile` および `agents.list[].tools.byProvider[provider].profile`
- **グローバル/エージェントごとのツール ポリシー**: `tools.allow`/`tools.deny` および `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **プロバイダー ツール ポリシー**: `tools.byProvider[provider].allow/deny` および `agents.list[].tools.byProvider[provider].allow/deny`
- **サンドボックス ツール ポリシー** (サンドボックスの場合にのみ適用): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` および `agents.list[].tools.sandbox.tools.*`

経験則:- `deny` が常に勝ちます。

- `allow` が空でない場合、他のすべてはブロックされたものとして扱われます。
- ツール ポリシーはハード ストップです: `/exec` は、拒否された `exec` ツールをオーバーライドできません。
- `/exec` は、承認された送信者のセッションのデフォルトのみを変更します。ツールへのアクセスは許可されません。
  プロバイダー ツール キーは、`provider` (例: `google-antigravity`) または `provider/model` (例: `openai/gpt-5.2`) のいずれかを受け入れます。

### ツールグループ (略記)

ツール ポリシー (グローバル、エージェント、サンドボックス) は、複数のツールに拡張される `group:*` エントリをサポートします。

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

- `group:runtime`: `exec`、`bash`、`process`
- `group:fs`: `read`、`write`、`edit`、`apply_patch`
- `group:sessions`: `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- `group:memory`: `memory_search`、`memory_get`
- `group:ui`: `browser`、`canvas`
- `group:automation`: `cron`、`gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: すべての組み込み OpenClaw ツール (プロバイダー プラグインを除く)

## 昇格: 実行のみ「ホスト上で実行」

昇格では追加のツールは**許可されません**。 `exec` にのみ影響します。- サンドボックス化されている場合、`/elevated on` (または `exec` と `elevated: true`) がホスト上で実行されます (承認が引き続き適用される場合があります)。

- `/elevated full` を使用して、セッションの幹部承認をスキップします。
- すでに直接実行している場合、昇格は事実上何も操作しません (ゲートされたままです)。
- 昇格はスキルスコープではなく**、ツールの許可/拒否をオーバーライドしません**。
- `/exec` は高架とは別のものです。承認された送信者のセッションごとの実行デフォルトのみを調整します。

ゲート:

- 有効化: `tools.elevated.enabled` (およびオプションで `agents.list[].tools.elevated.enabled`)
- 送信者の許可リスト: `tools.elevated.allowFrom.<provider>` (およびオプションで `agents.list[].tools.elevated.allowFrom.<provider>`)

[昇格モード](/tools/elevated) を参照してください。

## 一般的な「サンドボックス刑務所」の修正

### 「ツール X はサンドボックス ツール ポリシーによってブロックされました」

Fix-it キー (1 つ選択):

- サンドボックスを無効にする: `agents.defaults.sandbox.mode=off` (またはエージェントごとの `agents.list[].sandbox.mode=off`)
- サンドボックス内でのツールの使用を許可します。
  - `tools.sandbox.tools.deny` (またはエージェントごとの `agents.list[].tools.sandbox.tools.deny`) から削除します。
  - または `tools.sandbox.tools.allow` に追加します (またはエージェントごとの許可)

### 「これがメインだと思っていたのに、なぜサンドボックス化されているのですか?」

`"non-main"` モードでは、グループ/チャンネル キーはメインではありません。メイン セッション キー (`sandbox explain` で表示) を使用するか、モードを `"off"` に切り替えます。
