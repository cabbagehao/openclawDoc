---
summary: "実行ツールの使用法、標準入力モード、および TTY サポート"
read_when:
  - 実行ツールの使用または変更
  - 標準入力または TTY 動作のデバッグ
title: "実行ツール"
seoTitle: "OpenClaw execツールの使い方と承認・TTY挙動を整理するガイド"
description: "ワークスペースでシェル コマンドを実行します。process によるフォアグラウンド + バックグラウンド実行をサポートします。process が許可されていない場合、exec は同期的に実行され、yieldMs/background は無視されます。"
x-i18n:
  source_hash: "2d13ad90933276ffc408cc1e207ca9e1b3a9b6f6c6f754333a87a3ac36c0f651"
---
ワークスペースでシェル コマンドを実行します。 `process` によるフォアグラウンド + バックグラウンド実行をサポートします。
`process` が許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` は無視されます。
バックグラウンド セッションはエージェントごとにスコープが定められています。 `process` は、同じエージェントからのセッションのみを参照します。

## パラメータ

- `command` (必須)
- `workdir` (デフォルトは cwd)
- `env` (キー/値の上書き)
- `yieldMs` (デフォルト 10000): 遅延後の自動背景
- `background` (ブール値): すぐにバックグラウンドにします
- `timeout` (秒、デフォルトは 1800): 期限切れで強制終了
- `pty` (ブール値): 利用可能な場合は疑似端末で実行します (TTY のみの CLI、コーディング エージェント、端末 UI)
- `host` (`sandbox | gateway | node`): 実行場所
- `security` (`deny | allowlist | full`): `gateway`/`node` の強制モード
- `ask` (`off | on-miss | always`): `gateway`/`node` の承認プロンプト
- `node` (文字列): `host=node` のノード ID/名前
- `elevated` (ブール値): 昇格モードを要求します (ゲートウェイ ホスト)。 `security=full` は、昇格が `full` に解決される場合にのみ強制されます。

注:- `host` のデフォルトは `sandbox` です。

- サンドボックスがオフの場合 (ホスト上で実行がすでに実行されている場合)、`elevated` は無視されます。
- `gateway`/`node` の承認は `~/.openclaw/exec-approvals.json` によって制御されます。
- `node` にはペアリングされたノード (コンパニオン アプリまたはヘッドレス ノード ホスト) が必要です。
- 複数のノードが使用可能な場合は、`exec.node` または `tools.exec.node` を設定して 1 つを選択します。
- Windows 以外のホストでは、exec は設定時に `SHELL` を使用します。 `SHELL` が `fish` の場合、`bash` (または `sh`) が優先されます。
  `PATH` から、fish と互換性のないスクリプトを回避し、どちらも存在しない場合は `SHELL` に戻ります。
- Windows ホストでは、exec は PowerShell 7 (`pwsh`) 検出を優先します (Program Files、ProgramW6432、PATH)。
  その後、Windows PowerShell 5.1 に戻ります。
- ホストの実行 (`gateway`/`node`) は `env.PATH` を拒否し、ローダーはオーバーライド (`LD_*`/`DYLD_*`) を実行します。
  バイナリのハイジャックやコードの挿入を防ぎます。
- OpenClaw は、生成されたコマンド環境 (PTY およびサンドボックス実行を含む) に `OPENCLAW_SHELL=exec` を設定するため、シェル/プロファイル ルールは実行ツール コンテキストを検出できます。
- 重要: サンドボックスは **デフォルトではオフになっています**。サンドボックスがオフで、`host=sandbox` が明示的に設定されている場合
  構成/要求された場合、exec はゲートウェイ ホスト上でサイレントに実行されるのではなく、フェール クローズされるようになりました。サンドボックスを有効にするか、承認付きの `host=gateway` を使用します。
- スクリプトのプリフライト チェック (一般的な Python/Node シェル構文の間違い) は、ファイル内のファイルのみを検査します。
  有効な `workdir` 境界。スクリプト パスが `workdir` の外側で解決される場合、プリフライトはスキップされます。
  そのファイル。

## 構成- `tools.exec.notifyOnExit` (デフォルト: true): true の場合、バックグラウンド実行セッションはシステム イベントをキューに入れ、終了時にハートビートを要求します

- `tools.exec.approvalRunningNoticeMs` (デフォルト: 10000): 承認ゲート型 exec がこれより長く実行される場合、単一の「実行中」通知を発行します (0 は無効になります)。
- `tools.exec.host` (デフォルト: `sandbox`)
- `tools.exec.security` (デフォルト: サンドボックスの場合は `deny`、未設定の場合はゲートウェイ + ノードの場合は `allowlist`)
- `tools.exec.ask` (デフォルト: `on-miss`)
- `tools.exec.node` (デフォルト: 未設定)
- `tools.exec.pathPrepend`: 実行実行のために `PATH` の前に追加するディレクトリのリスト (ゲートウェイ + サンドボックスのみ)。
- `tools.exec.safeBins`: 明示的なホワイトリスト エントリなしで実行できる標準入力のみの安全なバイナリ。動作の詳細については、[金庫](/tools/exec-approvals#safe-bins-stdin-only) を参照してください。
- `tools.exec.safeBinTrustedDirs`: `safeBins` パス チェックで信頼される追加の明示的なディレクトリ。 `PATH` エントリは自動信頼されません。組み込みのデフォルトは `/bin` および `/usr/bin` です。
- `tools.exec.safeBinProfiles`: 金庫ごとのオプションのカスタム argv ポリシー (`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`)。

例:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH の処理- `host=gateway`: ログインシェル `PATH` を実行環境にマージします。 `env.PATH` オーバーライドは

ホストの実行が拒否されました。デーモン自体は引き続き最小限の `PATH` で実行されます。

- macOS: `/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
- Linux: `/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`: コンテナ内で `sh -lc` (ログイン シェル) を実行するため、`/etc/profile` は `PATH` をリセットする可能性があります。
  OpenClaw は、内部環境変数 (シェル補間なし) によるプロファイル ソースの後に `env.PATH` を付加します。
  `tools.exec.pathPrepend` はここにも当てはまります。
- `host=node`: 渡したブロックされていない環境オーバーライドのみがノードに送信されます。 `env.PATH` オーバーライドは
  ホストの実行が拒否され、ノード ホストによって無視されます。ノード上に追加の PATH エントリが必要な場合は、
  ノードホストサービス環境 (systemd/launchd) を構成するか、標準の場所にツールをインストールします。

エージェントごとのノード バインディング (構成内のエージェント リスト インデックスを使用):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

コントロール UI: [ノード] タブには、同じ設定のための小さな [実行ノード バインディング] パネルが含まれています。

## セッションの上書き (`/exec`)

`/exec` を使用して、`host`、`security`、`ask`、および `node` の **セッションごと** のデフォルトを設定します。
現在の値を表示するには、引数なしで `/exec` を送信します。

例:

````
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```## 認可モデル

`/exec` は、**承認された送信者** (チャネル許可リスト/ペアリングと `commands.useAccessGroups`) に対してのみ受け入れられます。
**セッション状態のみ**を更新し、構成は書き込みません。実行をハード的に無効にするには、ツールを使用して実行を拒否します
ポリシー (`tools.deny: ["exec"]` またはエージェントごと)。明示的に設定しない限り、ホストの承認は引き続き適用されます。
`security=full` および `ask=off`。

## 実行承認 (コンパニオン アプリ/ノード ホスト)

サンドボックス エージェントは、ゲートウェイまたはノード ホストで `exec` を実行する前に、リクエストごとの承認を必要とする場合があります。
ポリシー、許可リスト、UI フローについては、[実行の承認](/tools/exec-approvals) を参照してください。

承認が必要な場合、実行ツールはすぐに次のコマンドを返します。
`status: "approval-pending"` と承認 ID。承認（または拒否/タイムアウト）されると、
ゲートウェイはシステム イベント (`Exec finished` / `Exec denied`) を発行します。コマンドがまだ残っている場合
`tools.exec.approvalRunningNoticeMs` の後に実行すると、単一の `Exec running` 通知が発行されます。

## ホワイトリスト + 金庫

手動による許可リストの適用は、**解決されたバイナリ パスのみ**と一致します (ベース名は一致しません)。いつ
`security=allowlist`、シェル コマンドは、すべてのパイプライン セグメントが
ホワイトリストまたは安全な箱に登録されています。チェーン (`;`、`&&`、`||`) とリダイレクトは拒否されます。
すべての最上位セグメントが許可リスト (セーフ ビンを含む) を満たす場合を除き、許可リスト モード。
リダイレクトは引き続きサポートされません。`autoAllowSkills` は、幹部の承認における別の便利なパスです。それは同じではありません
手動パスのホワイトリスト エントリ。厳密な明示的信頼を得るには、`autoAllowSkills` を無効にしておきます。

さまざまなジョブに 2 つのコントロールを使用します。

- `tools.exec.safeBins`: 小型の標準入力のみのストリーム フィルター。
- `tools.exec.safeBinTrustedDirs`: セーフビンの実行可能パス用の明示的な追加の信頼できるディレクトリ。
- `tools.exec.safeBinProfiles`: カスタム金庫の明示的な argv ポリシー。
- ホワイトリスト: 実行可能パスに対する明示的な信頼。

`safeBins` を汎用の許可リストとして扱わず、インタープリター/ランタイム バイナリ (`python3`、`node`、`ruby`、`bash` など) を追加しないでください。これらが必要な場合は、明示的な許可リスト エントリを使用し、承認プロンプトを有効のままにしてください。
`openclaw security audit` は、インタープリター/ランタイム `safeBins` エントリに明示的なプロファイルが欠落している場合に警告し、`openclaw doctor --fix` は欠落しているカスタム `safeBinProfiles` エントリをスキャフォールディングできます。

ポリシーの完全な詳細と例については、[Exec の承認](/tools/exec-approvals#safe-bins-stdin-only) および [安全な箱と許可リスト](/tools/exec-approvals#safe-bins-versus-allowlist) を参照してください。

## 例

前景:

```json
{ "tool": "exec", "command": "ls -la" }
````

背景 + 投票:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

キーを送信します (tmux スタイル):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

送信 (CR のみを送信):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

貼り付けます (デフォルトでは括弧で囲まれています):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch (実験的)`apply_patch` は、構造化された複数ファイル編集のための `exec` のサブツールです

明示的に有効にします。

```json5
{
  tools: {
    exec: {
      applyPatch: { enabled: true, workspaceOnly: true, allowModels: ["gpt-5.2"] },
    },
  },
}
```

注:

- OpenAI/OpenAI Codex モデルでのみ利用可能です。
- ツール ポリシーは引き続き適用されます。 `allow: ["exec"]` は `apply_patch` を暗黙的に許可します。
- 構成は `tools.exec.applyPatch` の下にあります。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true` (ワークスペースを含む) です。意図的に `apply_patch` をワークスペース ディレクトリの外に書き込み/削除する場合にのみ、これを `false` に設定します。
