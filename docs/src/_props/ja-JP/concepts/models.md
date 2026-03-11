---
summary: "モデル関連の CLI: 一覧表示、モデル設定、エイリアス、フォールバック、スキャン、ステータス確認"
read_when:
  - モデル操作用の CLI（models list/set/scan/aliases/fallbacks）を追加・変更する場合
  - モデルのフォールバック動作や選択 UI を変更する場合
  - モデルのスキャン（ツールや画像の対応状況チェック）を更新する場合
title: "モデル CLI"
x-i18n:
  source_hash: "f1cd7e092e0f722bb0109873d52dbdaba87bfd74a2b4199371f43488c9dce2e4"
---

# モデル CLI

認証プロファイルの切り替え、クールダウン、およびフォールバックとの連携については、[モデルフェイルオーバー](/concepts/model-failover) を参照してください。
プロバイダーの概要と構成例については、[モデルプロバイダー](/concepts/model-providers) を参照してください。

## モデル選択の仕組み

OpenClaw は以下の順序でモデルを選択します:

1. **メインモデル** (`agents.defaults.model.primary` または `agents.defaults.model`)。
2. `agents.defaults.model.fallbacks` に指定された **フォールバックモデル** (記述順)。
3. 次のモデルへ移行する前に、現在のプロバイダー内で **認証プロファイルの切り替え** を試みます。

関連事項:

* `agents.defaults.models` は、OpenClaw が使用できるモデルの許可リスト（カタログ）およびエイリアスの定義です。
* `agents.defaults.imageModel` は、メインモデルが画像入力を受け付けない場合に **のみ** 使用されます。
* `agents.list[].model` を設定することで、エージェントごとにデフォルト設定を上書きできます（[マルチエージェント](/concepts/multi-agent) を参照）。

## モデル運用の指針

* メインモデルには、現在利用可能な最新世代の最も強力なモデルを設定してください。
* フォールバックモデルは、コストや遅延を抑えたいタスクや、重要度の低いチャット用に使用します。
* ツールを使用するエージェントや、信頼できない入力を扱う場合は、古いモデルや能力の低いモデルの使用を避けてください。

## セットアップウィザード (推奨)

構成ファイルを直接編集したくない場合は、オンボーディングウィザードを実行してください:

```bash
openclaw onboard
```

このウィザードでは、**OpenAI Code (Codex) サブスクリプション** (OAuth) や **Anthropic** (API キーまたは `claude setup-token`) を含む、主要なプロバイダーのモデルと認証設定をガイドに沿って行えます。

## 設定項目 (概要)

* `agents.defaults.model.primary` および `agents.defaults.model.fallbacks`
* `agents.defaults.imageModel.primary` および `agents.defaults.imageModel.fallbacks`
* `agents.defaults.models` (許可リスト + エイリアス + プロバイダー用パラメータ)
* `models.providers` (`models.json` に書き込まれるカスタムプロバイダー設定)

モデルの指定は小文字に正規化されます。`z.ai/*` などのプロバイダー別名は `zai/*` に正規化されます。

OpenCode Zen を含むプロバイダーの構成例は、[ゲートウェイ構成](/gateway/configuration#opencode-zen-multi-model-proxy) を参照してください。

## 「Model is not allowed」エラーについて

`agents.defaults.models` が設定されている場合、それが `/model` コマンドやセッション上書きで使用できる **許可リスト** となります。このリストに含まれていないモデルをユーザーが選択した場合、OpenClaw は以下のエラーを返します:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

このチェックは返信が生成される **前** に行われるため、メッセージが無視されたように感じることがあります。以下のいずれかの方法で解決してください:

* そのモデルを `agents.defaults.models` に追加する。
* 許可リストをクリア（`agents.defaults.models` を削除）する。
* `/model list` で表示されるモデルから選択する。

許可リストの構成例:

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

## チャット内でのモデル切り替え (`/model`)

ゲートウェイを再起動することなく、現在のセッションで使用するモデルを切り替えられます:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

補足事項:

* `/model` (および `/model list`) は、モデルファミリーと利用可能なプロバイダーを番号付きで表示するコンパクトなピッカーです。
* Discord では、プロバイダーとモデルを選択して送信する、インタラクティブな選択メニューが開きます。
* `/model <番号>` で、そのピッカーからモデルを選択できます。
* `/model status` では、詳細な情報（認証の候補、構成済みの場合はプロバイダーの `baseUrl` や API モード）を表示します。
* モデルの指定は、**最初**に出現する `/` で分割して解析されます。`/model <ref>` と入力する際は `provider/model` の形式にしてください。
* モデル ID 自体に `/` が含まれる場合（OpenRouter 形式など）は、プロバイダーのプレフィックスを含める必要があります（例: `/model openrouter/moonshotai/kimi-k2`）。
* プロバイダーを省略した場合、OpenClaw は入力をエイリアス、あるいは **デフォルトプロバイダー** のモデルとして扱います（モデル ID 内に `/` が含まれない場合にのみ機能します）。

詳細な仕様: [スラッシュコマンド](/tools/slash-commands)

## CLI コマンド一覧

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

サブコマンドなしの `openclaw models` は、`models status` の短縮形です。

### `models list`

デフォルトで構成されているモデルを表示します。便利なフラグ:

* `--all`: すべてのカタログを表示
* `--local`: ローカルプロバイダーのみを表示
* `--provider <name>`: 指定したプロバイダーでフィルタリング
* `--plain`: 1 行に 1 モデルの形式で出力
* `--json`: 機械可読な JSON 形式で出力

### `models status`

解決済みのメインモデル、フォールバックモデル、画像モデル、および構成済みプロバイダーの認証状況の概要を表示します。また、認証ストア内の OAuth プロファイルの有効期限も表示されます（デフォルトでは 24 時間以内に切れる場合に警告します）。
認証情報がないプロバイダーがある場合は、**Missing auth** セクションが表示されます。
JSON 出力には `auth.oauth`（警告期間とプロファイル）および `auth.providers`（実際に有効な認証方法）が含まれます。
オートメーション用途には `--check` を使用してください（認証欠落/期限切れ時は `1`、期限間近は `2` で終了します）。

例 (Anthropic setup-token):

```bash
claude setup-token
openclaw models status
```

## モデルスキャン (OpenRouter 無料モデル)

`openclaw models scan` は、OpenRouter の **無料モデルカタログ** をスキャンし、必要に応じてツール使用や画像のサポート状況を調査（プローブ）します。

主なフラグ:

* `--no-probe`: 実際の調査を行わずメタデータのみを取得
* `--min-params <b>`: 最小パラメータ数（10億単位）でフィルタリング
* `--max-age-days <days>`: 更新が古いモデルを除外
* `--provider <name>`: プロバイダー名のプレフィックスでフィルタリング
* `--max-candidates <n>`: フォールバックリストに含める最大数
* `--set-default`: 最初の候補を `agents.defaults.model.primary` に設定
* `--set-image`: 最初の画像対応候補を `agents.defaults.imageModel.primary` に設定

調査には OpenRouter の API キーが必要です。キーがない場合は `--no-probe` を使用してください。

スキャン結果は以下の優先度でランク付けされます:

1. 画像サポート
2. ツール実行の遅延
3. コンテキストサイズ
4. パラメータ数

TTY 端末で実行した場合は、インタラクティブにフォールバックモデルを選択できます。非対話モードの場合は `--yes` を指定してデフォルト設定を受け入れてください。

## モデルレジストリ (`models.json`)

`models.providers` で設定されたカスタムプロバイダー情報は、各エージェントディレクトリ内の `models.json` (デフォルトは `~/.openclaw/agents/<agentId>/models.json`) に書き込まれます。`models.mode` が `replace` に設定されていない限り、このファイルは実行時にマージされます。

プロバイダー ID が一致する場合のマージ優先順位:

* エージェントディレクトリの `models.json` に既にある空でない `baseUrl` が最優先されます。
* `apiKey` は、そのプロバイダーが SecretRef で管理されていない場合にのみ、エージェントディレクトリの `models.json` の値が優先されます。
* SecretRef 管理下のプロバイダーの `apiKey` は、解決後のシークレットではなく、ソースマーカー（環境変数参照なら変数名、その他なら `secretref-managed`）として保存されます。
* 他のフィールドは構成ファイルや正規化されたカタログデータから更新されます。

このマーカーベースの保存処理は、`openclaw agent` コマンドなどの実行時に `models.json` が再生成される際にも適用されます。
