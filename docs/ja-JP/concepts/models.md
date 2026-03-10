---
summary: "モデル CLI: リスト、セット、エイリアス、フォールバック、スキャン、ステータス"
read_when:
  - モデル CLI の追加または変更 (モデル リスト/セット/スキャン/エイリアス/フォールバック)
  - モデルのフォールバック動作または選択 UX の変更
  - モデル スキャン プローブ (ツール/イメージ) の更新
title: "モデル CLI"
x-i18n:
  source_hash: "f1cd7e092e0f722bb0109873d52dbdaba87bfd74a2b4199371f43488c9dce2e4"
---

# モデル CLI

認証プロファイルについては、[/concepts/model-failover](/concepts/model-failover) を参照してください。
ローテーション、クールダウン、およびそれがフォールバックとどのように相互作用するか。
プロバイダーの簡単な概要 + 例: [/concepts/model-providers](/concepts/model-providers)。

## モデル選択の仕組み

OpenClaw は次の順序でモデルを選択します。

1. **プライマリ** モデル (`agents.defaults.model.primary` または `agents.defaults.model`)。
2. `agents.defaults.model.fallbacks` の **フォールバック** (順番に)。
3. **プロバイダー認証フェイルオーバー**は、プロバイダーに移行する前にプロバイダー内で発生します。
   次のモデル。

関連:

- `agents.defaults.models` は、OpenClaw が使用できるモデル (およびエイリアス) の許可リスト/カタログです。
- `agents.defaults.imageModel` は、**プライマリ モデルが画像を受け入れられない場合にのみ**使用されます。
- エージェントごとのデフォルトは、`agents.list[].model` とバインディングを介して `agents.defaults.model` をオーバーライドできます ([/concepts/multi-agent](/concepts/multi-agent) を参照)。

## クイック モデル ポリシー

- プライマリを、利用可能な最も強力な最新世代モデルに設定します。
- コスト/遅延に敏感なタスクやリスクの低いチャットにはフォールバックを使用します。
- ツール対応エージェントまたは信頼できない入力の場合は、古い/弱いモデル層を避けてください。

## セットアップ ウィザード (推奨)

構成を手動で編集したくない場合は、オンボーディング ウィザードを実行します。

```bash
openclaw onboard
```

**OpenAI コード (Codex) を含む一般的なプロバイダーのモデル + 認証を設定できます。
サブスクリプション** (OAuth) および **Anthropic** (API キーまたは `claude setup-token`)。

## 設定キー (概要)- `agents.defaults.model.primary` および `agents.defaults.model.fallbacks`

- `agents.defaults.imageModel.primary` および `agents.defaults.imageModel.fallbacks`
- `agents.defaults.models` (許可リスト + エイリアス + プロバイダー パラメーター)
- `models.providers` (`models.json` に書き込まれたカスタム プロバイダー)

モデル参照は小文字に正規化されます。 `z.ai/*` のようなプロバイダー エイリアスは正規化されます
`zai/*` まで。

プロバイダー構成例 (OpenCode Zen を含む) は以下にあります。
[/ゲートウェイ/構成](/gateway/configuration#opencode-zen-multi-model-proxy)。

## 「モデルは許可されていません」 (および返信が停止する理由)

`agents.defaults.models` が設定されている場合、それは `/model` と
セッションのオーバーライド。ユーザーがその許可リストにないモデルを選択すると、
OpenClaw は以下を返します:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

これは通常の応答が生成される**前**に発生するため、メッセージは次のように感じられます。
「応答しませんでした」のように。修正方法は次のいずれかです。

- モデルを `agents.defaults.models` に追加するか、
- 許可リストをクリアする (`agents.defaults.models` を削除する)、または
- `/model list` からモデルを選択します。

許可リスト設定の例:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-5" },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## チャットでのモデルの切り替え (`/model`)

再起動せずに現在のセッションのモデルを切り替えることができます。

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

注:- `/model` (および `/model list`) は、コンパクトな番号付きピッカー (モデル ファミリ + 利用可能なプロバイダー) です。

- Discord では、`/model` と `/models` は、プロバイダーとモデルのドロップダウンと送信ステップを備えた対話型ピッカーを開きます。
- `/model <#>` はピッカーから選択します。
- `/model status` は詳細ビューです (認証候補、および構成されている場合はプロバイダー エンドポイント `baseUrl` + `api` モード)。
- モデル参照は、**最初** `/` で分割することによって解析されます。 `/model <ref>` と入力する場合は、`provider/model` を使用してください。
- モデル ID 自体に `/` (OpenRouter スタイル) が含まれる場合、プロバイダーのプレフィックスを含める必要があります (例: `/model openrouter/moonshotai/kimi-k2`)。
- プロバイダーを省略した場合、OpenClaw は入力をエイリアスまたは **デフォルト プロバイダー** のモデルとして扱います (モデル ID に `/` がない場合にのみ機能します)。

完全なコマンド動作/構成: [スラッシュ コマンド](/tools/slash-commands)。

## CLI コマンド

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (サブコマンドなし) は `models status` のショートカットです。

### `models list`

デフォルトで構成されたモデルを表示します。便利なフラグ:

- `--all`: フルカタログ
- `--local`: ローカルプロバイダーのみ
- `--provider <name>`: プロバイダーによるフィルター
- `--plain`: 1 行につき 1 つのモデル
- `--json`: 機械可読出力

### `models status`解決されたプライマリ モデル、フォールバック、イメージ モデル、および認証の概要を示します

構成されたプロバイダーの数。また、見つかったプロファイルの OAuth 有効期限ステータスも明らかになります
認証ストア内 (デフォルトでは 24 時間以内に警告します)。 `--plain` は、
解決されたプライマリ モデル。
OAuth ステータスは常に表示されます (`--json` 出力にも含まれます)。設定されている場合
プロバイダーに認証情報がない場合、`models status` は **認証がありません** セクションを出力します。
JSON には `auth.oauth` (警告ウィンドウ + プロファイル) および `auth.providers` が含まれます
(プロバイダーごとに有効な認証)。
自動化には `--check` を使用します (欠落または期限切れの場合は `1` を終了し、期限切れの場合は `2` を終了します)。

認証の選択はプロバイダー/アカウントによって異なります。常時接続のゲートウェイ ホストの場合、通常は API キーが最も予測可能です。サブスクリプション トークン フローもサポートされています。

例 (Anthropic セットアップ トークン):

```bash
claude setup-token
openclaw models status
```

## スキャン (OpenRouter 無料モデル)

`openclaw models scan` は、OpenRouter の **無料モデル カタログ**を検査し、
オプションで、ツールとイメージのサポートについてモデルを調査します。

主要なフラグ:- `--no-probe`: ライブ プローブをスキップします (メタデータのみ)

- `--min-params <b>`: パラメータの最小サイズ (10 億)
- `--max-age-days <days>`: 古いモデルをスキップします
- `--provider <name>`: プロバイダープレフィックスフィルター
- `--max-candidates <n>`: フォールバック リストのサイズ
- `--set-default`: `agents.defaults.model.primary` を最初の選択に設定します
- `--set-image`: `agents.defaults.imageModel.primary` を最初の画像選択に設定します

プローブには OpenRouter API キーが必要です (認証プロファイルまたは
`OPENROUTER_API_KEY`)。キーを使用しない場合は、`--no-probe` を使用して候補のみをリストします。

スキャン結果は次の基準でランク付けされます。

1. 画像のサポート
2. ツールの遅延
3. コンテキストのサイズ
4. パラメータ数

入力

- OpenRouter `/models` リスト (フィルター `:free`)
- 認証プロファイルまたは `OPENROUTER_API_KEY` からの OpenRouter API キーが必要です ([/environment](/help/environment) を参照)
- オプションのフィルター: `--max-age-days`、`--min-params`、`--provider`、`--max-candidates`
- プローブ制御: `--timeout`、`--concurrency`

TTY で実行する場合、フォールバックを対話的に選択できます。非インタラクティブな場合
モードの場合は、`--yes` を渡してデフォルトを受け入れます。

## モデル レジストリ (`models.json`)

`models.providers` のカスタム プロバイダーは、
エージェント ディレクトリ (デフォルト `~/.openclaw/agents/<agentId>/models.json`)。このファイル
`models.mode` が `replace` に設定されていない限り、デフォルトでマージされます。

一致するプロバイダー ID のマージ モードの優先順位:- エージェント `models.json` にすでに存在する空ではない `baseUrl` が優先されます。

- エージェント `models.json` 内の空でない `apiKey` は、そのプロバイダーが現在の構成/認証プロファイル コンテキストで SecretRef で管理されていない場合にのみ優先されます。
- SecretRef 管理プロバイダーの `apiKey` 値は、解決されたシークレットを保持するのではなく、ソース マーカー (環境参照の場合は `ENV_VAR_NAME`、ファイル/実行参照の場合は `secretref-managed`) から更新されます。
- 空または欠落しているエージェント `apiKey`/`baseUrl` は、構成 `models.providers` にフォールバックします。
- 他のプロバイダー フィールドは、構成および正規化されたカタログ データから更新されます。

このマーカーベースの永続性は、`openclaw agent` のようなコマンド駆動のパスを含め、OpenClaw が `models.json` を再生成するたびに適用されます。
