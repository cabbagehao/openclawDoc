---
summary: "テストキット: unit/e2e/live スイート、Docker ランナー、各テストの対象範囲"
read_when:
  - ローカルまたは CI でテストを実行するとき
  - モデルやプロバイダーの不具合に対する回帰を追加するとき
  - ゲートウェイとエージェントの挙動をデバッグするとき
title: "テスト"
x-i18n:
  source_hash: "0ae8b68d1649d80f9d9fe515415e66b706629532b5b8aadbfb31512e250835cd"
---

# テスト

OpenClaw には、Vitest ベースの 3 つのスイート (unit/integration、e2e、live) と、少数の Docker ランナーがあります。

このページは、「どのようにテストするか」を説明するガイドです。

* 各スイートが何を対象にしており、何を意図的に対象外としているか
* よくあるワークフローごとにどのコマンドを実行すべきか
* live テストがどのように認証情報を見つけ、モデルやプロバイダーを選ぶか
* 実運用で見つかったモデルやプロバイダーの問題に対して、どう回帰テストを追加するか

## クイックスタート

普段は次だけで十分です。

* フルゲート (push 前の標準): `pnpm build && pnpm check && pnpm test`

テスト周りを触ったときや、もう一段確認したいときは次を追加します。

* カバレッジゲート: `pnpm test:coverage`
* E2E スイート: `pnpm test:e2e`

実際のプロバイダーやモデルを使って調査するときは、実際の認証情報が必要です。

* live スイート (モデル + ゲートウェイのツール/画像プローブ): `pnpm test:live`

ヒント: 失敗ケースを 1 件だけ追いたい場合は、後述の allowlist 系環境変数で live テストを絞り込む方が効率的です。

## テストスイート (どこで何が走るか)

各スイートは、「現実に近づくほどコストや不安定さも増える」と考えると整理しやすくなります。

### Unit / integration (デフォルト)

* コマンド: `pnpm test`
* 設定: `scripts/test-parallel.mjs` (`vitest.unit.config.ts`、`vitest.extensions.config.ts`、`vitest.gateway.config.ts` を実行)
* ファイル: `src/**/*.test.ts`、`extensions/**/*.test.ts`
* 対象:
  * 純粋なユニットテスト
  * プロセス内の統合テスト (ゲートウェイ認証、ルーティング、ツール、パース、設定)
  * 既知不具合に対する決定的な回帰テスト
* 期待値:
  * CI で実行されます
  * 実際のキーは不要です
  * 高速かつ安定していることが前提です
* プールに関する補足:
  * OpenClaw は、unit シャード高速化のため、Node 22/23 では Vitest の `vmForks` を使います。
  * Node 24 以降では、Node VM のリンクエラー (`ERR_VM_MODULE_LINK_FAILURE` / `module is already linked`) を避けるため、自動的に通常の `forks` にフォールバックします。
  * `OPENCLAW_TEST_VM_FORKS=0` で `forks` を強制し、`OPENCLAW_TEST_VM_FORKS=1` で `vmForks` を強制できます。

### E2E (ゲートウェイスモーク)

* コマンド: `pnpm test:e2e`
* 設定: `vitest.e2e.config.ts`
* ファイル: `src/**/*.e2e.test.ts`
* 実行時のデフォルト:
  * ファイル起動を速くするため、Vitest の `vmForks` を使います。
  * ワーカー数は環境に応じて自動調整されます (CI: 2-4、ローカル: 4-8)。
  * コンソール I/O の負荷を減らすため、既定では silent モードで実行されます。
* 便利な上書き設定:
  * `OPENCLAW_E2E_WORKERS=<n>` でワーカー数を固定できます (上限 16)。
  * `OPENCLAW_E2E_VERBOSE=1` で詳細なコンソール出力を再度有効にできます。
* 対象:
  * 複数インスタンス構成のゲートウェイにおける end-to-end の挙動
  * WebSocket/HTTP の表面、ノードのペアリング、やや重めのネットワーク処理
* 期待値:
  * パイプラインで有効な場合は CI でも実行されます
  * 実際のキーは不要です
  * unit テストより構成要素が多く、遅くなる場合があります

### Live (実プロバイダー + 実モデル)

* コマンド: `pnpm test:live`
* 設定: `vitest.live.config.ts`
* ファイル: `src/**/*.live.test.ts`
* デフォルト: `pnpm test:live` で **有効** になります (`OPENCLAW_LIVE_TEST=1` を設定)
* 対象:
  * 「このプロバイダー/モデルは、今日の時点で、実際の認証情報を使って本当に動くか」
  * プロバイダー側のフォーマット変更、ツール呼び出しの癖、認証の問題、レート制限の挙動
* 期待値:
  * 実ネットワーク、実プロバイダーのポリシー、クォータ、障害に依存するため、CI で安定する前提ではありません
  * 課金やレート制限が発生します
  * 全件実行より、対象を絞った実行を優先してください
  * live 実行時には、欠けている API キーを拾うために `~/.profile` を読み込みます
* API キーのローテーション (プロバイダー別):
  * `*_API_KEYS` にカンマ区切りまたはセミコロン区切りで複数キーを設定できます
  * `*_API_KEY_1`、`*_API_KEY_2` の形式も利用できます
  * 例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`
  * live テスト専用の上書きとして `OPENCLAW_LIVE_*_KEY` も使えます
  * レート制限応答を受けた場合、テストは再試行します

## どのスイートを実行すべきか

次の基準で選んでください。

* ロジックやテストを編集した: `pnpm test` を実行します。変更が大きい場合は `pnpm test:coverage` も追加します
* ゲートウェイのネットワーク、WS プロトコル、ペアリングを触った: `pnpm test:e2e` も追加します
* 「ボットが落ちている」、プロバイダー固有の失敗、ツール呼び出し不具合を調べる: 対象を絞った `pnpm test:live` を実行します

## Live: Android ノード機能スイープ

* テスト: `src/gateway/android-node.capabilities.live.test.ts`
* スクリプト: `pnpm android:test:integration`
* 目的: 接続済み Android ノードが **現在 advertise しているすべてのコマンド** を呼び出し、コマンド契約の挙動を検証します
* 対象:
  * 事前条件付きの手動セットアップです。スイート自体はアプリのインストール、起動、ペアリングを行いません
  * 選択した Android ノードに対する、コマンド単位の `node.invoke` 検証を行います
* 必須の事前準備:
  * Android アプリがすでにゲートウェイへ接続・ペアリング済みであること
  * アプリをフォアグラウンドに維持すること
  * 通過させたい機能に必要な権限やキャプチャ同意が付与されていること
* 任意のターゲット上書き:
  * `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`
  * `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`
* Android 側の詳細なセットアップ: [Android App](/platforms/android)

## Live: モデルスモーク (プロファイルキー)

live テストは、障害を切り分けやすくするために 2 層に分かれています。

* 「Direct model」は、指定したキーでそのプロバイダー/モデルが最低限応答できるかを確認します
* 「Gateway smoke」は、そのモデルで完全なゲートウェイ + エージェントのパイプライン (セッション、履歴、ツール、サンドボックス方針など) が動くかを確認します

### Layer 1: Direct model completion (ゲートウェイなし)

* テスト: `src/agents/models.profiles.live.test.ts`
* 目的:
  * 検出されたモデルを列挙します
  * `getApiKeyForModel` を使って、認証情報があるモデルを選びます
  * 各モデルに対して小さな completion を実行し、必要なら個別回帰も走らせます
* 有効化:
  * `pnpm test:live` (`Vitest` を直接起動する場合は `OPENCLAW_LIVE_TEST=1`)
* このスイートを実際に走らせるには `OPENCLAW_LIVE_MODELS=modern` を設定します
  * `all` も利用できますが、意味としては `modern` の別名です
  * 未設定の場合、`pnpm test:live` をゲートウェイスモーク中心に保つため、このスイートは skip されます
* モデルの選び方:
  * `OPENCLAW_LIVE_MODELS=modern` で modern allowlist を実行します
  * 対象は Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.5、Grok 4 です
  * `OPENCLAW_LIVE_MODELS=all` は modern allowlist の別名です
  * あるいは `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."` のようなカンマ区切り allowlist も使えます
* プロバイダーの絞り込み:
  * `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` のようにカンマ区切りで指定できます
* キーの取得元:
  * 既定ではプロファイルストアと環境変数フォールバックを使います
  * **プロファイルストアのみ** に限定したい場合は `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定します
* この層を分けている理由:
  * 「プロバイダー API が壊れている / キーが無効」と、「ゲートウェイのエージェントパイプラインが壊れている」を分離できます
  * OpenAI Responses/Codex Responses の推論 replay + ツール呼び出しフローのような、小さく独立した回帰もここに置けます

### Layer 2: Gateway + dev agent smoke (実際の `@openclaw` の挙動)

* テスト: `src/gateway/gateway-models.profiles.live.test.ts`
* 目的:
  * プロセス内ゲートウェイを立ち上げます
  * `agent:dev:*` セッションを作成または patch し、実行ごとにモデル上書きを適用します
  * 認証情報があるモデルを順に回し、次を検証します
  * ツールなしでも意味のある応答が返ること
  * 実際のツール呼び出しが通ること (`read` プローブ)
  * 任意の追加ツールプローブが通ること (`exec+read` プローブ)
  * OpenAI 系の回帰経路 (tool-call-only → follow-up) が壊れていないこと
* プローブの内容:
  * `read` プローブ: テストがワークスペースに nonce ファイルを書き込み、エージェントにそのファイルを `read` して nonce を返させます
  * `exec+read` プローブ: エージェントに `exec` で一時ファイルへ nonce を書かせ、その後 `read` で読み戻させます
  * image プローブ: 生成した PNG (cat + ランダムコード) を添付し、モデルが `cat <CODE>` を返すことを期待します
  * 実装参照: `src/gateway/gateway-models.profiles.live.test.ts` と `src/gateway/live-image-probe.ts`
* 有効化:
  * `pnpm test:live` (`Vitest` を直接起動する場合は `OPENCLAW_LIVE_TEST=1`)
* モデルの選び方:
  * 既定では modern allowlist を使います
  * 対象は Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.5、Grok 4 です
  * `OPENCLAW_LIVE_GATEWAY_MODELS=all` は modern allowlist の別名です
  * あるいは `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` またはカンマ区切りリストで絞り込めます
* プロバイダーの絞り込み:
  * `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` のように指定します
  * 「OpenRouter の全部乗せ」は避けてください
* この live テストでは、ツールと画像のプローブは常時有効です
  * `read` プローブ + `exec+read` プローブでツール周りを強めに確認します
  * 画像入力対応を advertise するモデルでは image プローブも実行されます
  * 流れの概要:
    * テストが `src/gateway/live-image-probe.ts` で "CAT" とランダムコードを含む小さな PNG を生成します
    * `agent` の `attachments: [{ mimeType: "image/png", content: "<base64>" }]` として送信します
    * ゲートウェイが添付ファイルを `images[]` に変換します (`src/gateway/server-methods/agent.ts` と `src/gateway/chat-attachments.ts`)
    * 埋め込みエージェントがマルチモーダルなユーザーメッセージをモデルへ転送します
    * 検証では、返答に `cat` とコードが含まれていることを見ます (OCR の軽微な誤りは許容します)

ローカル環境で何がテスト対象になるか、正確な `provider/model` ID を確認したい場合は、次を実行してください。

```bash
openclaw models list
openclaw models list --json
```

## Live: Anthropic setup-token smoke

* テスト: `src/agents/anthropic.setup-token.live.test.ts`
* 目的: Claude Code CLI の setup-token、または貼り付けた setup-token プロファイルで、Anthropic へのプロンプトが完了できることを確認します
* 有効化:
  * `pnpm test:live` (`Vitest` を直接起動する場合は `OPENCLAW_LIVE_TEST=1`)
  * `OPENCLAW_LIVE_SETUP_TOKEN=1`
* トークンの取得元 (いずれか 1 つ):
  * プロファイル: `OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  * 生トークン: `OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
* モデル上書き (任意):
  * `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

設定例:

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## Live: CLI backend smoke (Claude Code CLI またはその他のローカル CLI)

* テスト: `src/gateway/gateway-cli-backend.live.test.ts`
* 目的: 既定設定を汚さずに、ローカル CLI バックエンドを使ったゲートウェイ + エージェントパイプラインを検証します
* 有効化:
  * `pnpm test:live` (`Vitest` を直接起動する場合は `OPENCLAW_LIVE_TEST=1`)
  * `OPENCLAW_LIVE_CLI_BACKEND=1`
* デフォルト:
  * モデル: `claude-cli/claude-sonnet-4-6`
  * コマンド: `claude`
  * 引数: `["-p","--output-format","json","--permission-mode","bypassPermissions"]`
* 上書き設定 (任意):
  * `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  * `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  * `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  * `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  * `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  * `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` で実ファイルの画像添付を送信します (パスはプロンプトへ埋め込まれます)
  * `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` で、画像ファイルパスをプロンプト挿入ではなく CLI 引数として渡します
  * `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` または `"list"` で、`IMAGE_ARG` 設定時の画像引数の渡し方を制御できます
  * `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` で 2 ターン目を送り、resume フローを検証します
* `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` を指定すると、Claude Code CLI の MCP 設定を有効なままにできます
  * 既定では、一時的な空ファイルを使って MCP 設定を無効化します

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### 推奨 live レシピ

限定的で明示的な allowlist の方が、速く、かつ不安定さも小さくなります。

* 単一モデル、direct (ゲートウェイなし):
  * `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`
* 単一モデル、ゲートウェイスモーク:
  * `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
* 複数プロバイダーでツール呼び出しを確認:
  * `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
* Google を重点的に確認:
  * Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  * Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

補足:

* `google/...` は Gemini API (API key) を使います
* `google-antigravity/...` は Antigravity OAuth bridge (Cloud Code Assist 風の agent endpoint) を使います
* `google-gemini-cli/...` はローカルマシン上の Gemini CLI を使います。認証やツール挙動の癖は別系統です
* Gemini API と Gemini CLI の違い:
  * API: OpenClaw が Google 提供の Gemini API を HTTP で直接呼びます。多くの利用者が「Gemini」と言うときはこちらを指します
  * CLI: OpenClaw がローカルの `gemini` バイナリを実行します。独自の認証があり、ストリーミング、ツール対応、バージョン差分などで挙動が変わることがあります

## Live: モデルマトリクス (何をカバーするか)

固定の「CI モデル一覧」はありません。live は opt-in です。ただし、認証情報がある開発マシンで定期的に確認したい **推奨** モデル群はあります。

### Modern smoke set (ツール呼び出し + 画像)

継続的に動作していてほしい「共通モデル」セットです。

* OpenAI (non-Codex): `openai/gpt-5.2` (任意で `openai/gpt-5.1`)
* OpenAI Codex: `openai-codex/gpt-5.4`
* Anthropic: `anthropic/claude-opus-4-6` (または `anthropic/claude-sonnet-4-5`)
* Google (Gemini API): `google/gemini-3.1-pro-preview` と `google/gemini-3-flash-preview` (古い Gemini 2.x は避けてください)
* Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` と `google-antigravity/gemini-3-flash`
* Z.AI (GLM): `zai/glm-4.7`
* MiniMax: `minimax/minimax-m2.5`

ツール + 画像込みのゲートウェイスモーク実行例:

`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + optional Exec)

少なくとも各プロバイダーファミリーから 1 つは選んでください。

* OpenAI: `openai/gpt-5.2` (または `openai/gpt-5-mini`)
* Anthropic: `anthropic/claude-opus-4-6` (または `anthropic/claude-sonnet-4-5`)
* Google: `google/gemini-3-flash-preview` (または `google/gemini-3.1-pro-preview`)
* Z.AI (GLM): `zai/glm-4.7`
* MiniMax: `minimax/minimax-m2.5`

追加であるとよい候補:

* xAI: `xai/grok-4` (または利用可能な最新版)
* Mistral: `mistral/...` のうち、ツール対応モデルを 1 つ
* Cerebras: `cerebras/...` (利用できる場合)
* LM Studio: `lmstudio/...` (ローカル実行。ツール呼び出し可否は API モードに依存します)

### Vision: 画像送信 (添付ファイル → マルチモーダルメッセージ)

image プローブを通すには、`OPENCLAW_LIVE_GATEWAY_MODELS` に少なくとも 1 つ、画像入力対応モデル (Claude、Gemini、OpenAI の vision 対応モデルなど) を含めてください。

### Aggregators / alternate gateways

認証情報があれば、次の経路もテストできます。

* OpenRouter: `openrouter/...`
  * 対象モデルは非常に多いため、`openclaw models scan` で tool+image 対応候補を探してください
* OpenCode Zen: `opencode/...`
  * 認証は `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` を使います

live マトリクスに追加できるプロバイダー群 (認証情報や設定がある場合):

* 組み込み: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、`zai`、`openrouter`、`opencode`、`xai`、`groq`、`cerebras`、`mistral`、`github-copilot`
* `models.providers` 経由のカスタムエンドポイント: `minimax` (cloud/API)、および OpenAI/Anthropic 互換プロキシ (LM Studio、vLLM、LiteLLM など)

ヒント: ドキュメントに「全モデル一覧」を固定で書こうとしないでください。権威ある一覧は、各環境で `discoverModels(...)` が返す結果と、利用可能なキーの組み合わせです。

## 認証情報 (コミットしない)

live テストは CLI と同じ方法で認証情報を見つけます。実務上の意味は次のとおりです。

* CLI が動くなら、live テストも同じキーを見つけられるはずです

* live テストで「認証情報がない」と出た場合は、`openclaw models list` やモデル選択を調べるときと同じ手順で切り分けてください

* プロファイルストア: `~/.openclaw/credentials/`
  * これが推奨です。テスト内でいう「profile keys」はこれを指します

* 設定ファイル: `~/.openclaw/openclaw.json`
  * あるいは `OPENCLAW_CONFIG_PATH`

`~/.profile` などで export した環境変数キーに頼る場合は、`source ~/.profile` の後にローカルテストを実行するか、後述の Docker ランナーを使ってください。Docker ランナーでは `~/.profile` をコンテナへマウントできます。

## Deepgram live (音声文字起こし)

* テスト: `src/media-understanding/providers/deepgram/audio.live.test.ts`
* 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

* テスト: `src/agents/byteplus.live.test.ts`
* 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
* 任意のモデル上書き: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Docker ランナー (任意の Linux 動作確認)

これらは、リポジトリの Docker イメージ内で `pnpm test:live` を実行します。ローカルの設定ディレクトリとワークスペースをマウントし、`~/.profile` がマウントされていればそれも読み込みます。

* Direct models: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
* Gateway + dev agent: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
* Onboarding wizard (TTY、完全な scaffolding): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
* Gateway networking (2 コンテナ、WS 認証 + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
* Plugins (カスタム拡張ロード + レジストリスモーク): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

live-model 用の Docker ランナーは、現在の checkout も read-only で bind mount し、コンテナ内の一時 workdir へ stage します。これにより、ランタイムイメージを肥大化させずに、手元の正確なソースと設定に対して Vitest を実行できます。

手動 ACP plain-language thread smoke (CI ではありません):

* `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
* これは回帰確認やデバッグ用のスクリプトです。ACP スレッドルーティングの検証で再利用する可能性があるため、削除しないでください

便利な環境変数:

* `OPENCLAW_CONFIG_DIR=...` (デフォルト: `~/.openclaw`)
  * `/home/node/.openclaw` にマウントされます
* `OPENCLAW_WORKSPACE_DIR=...` (デフォルト: `~/.openclaw/workspace`)
  * `/home/node/.openclaw/workspace` にマウントされます
* `OPENCLAW_PROFILE_FILE=...` (デフォルト: `~/.profile`)
  * `/home/node/.profile` にマウントされ、テスト実行前に読み込まれます
* `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`
  * 実行対象を絞り込めます
* `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`
  * 認証情報の取得元をプロファイルストアのみに制限できます

## Docs sanity

ドキュメントを編集したら、`pnpm docs:list` で docs チェックを実行してください。

## Offline regression (CI-safe)

実プロバイダーを使わずに、実際のパイプラインに近い回帰を確認するテストです。

* Gateway のツール呼び出し (モック OpenAI、実際のゲートウェイ + agent loop):
  * `src/gateway/gateway.test.ts`
  * ケース名: "runs a mock OpenAI tool call end-to-end via gateway agent loop"
* Gateway wizard (WS `wizard.start` / `wizard.next`、設定ファイル書き込み、認証強制):
  * `src/gateway/gateway.test.ts`
  * ケース名: "runs wizard over ws and writes auth token config"

## Agent reliability evals (skills)

すでにいくつかの CI-safe なテストがあり、「エージェント信頼性評価」に近い役割を果たしています。

* 実際のゲートウェイ + agent loop を通した、モックのツール呼び出し (`src/gateway/gateway.test.ts`)
* セッション配線と設定反映を検証する end-to-end の wizard フロー (`src/gateway/gateway.test.ts`)

[Skills](/tools/skills) に関して、まだ不足している観点は次のとおりです。

* **Decisioning:** プロンプトにスキル一覧があるとき、エージェントが正しいスキルを選び、不要なものを避けられるか
* **Compliance:** 使用前に `SKILL.md` を読み、必要な手順や引数に従えるか
* **Workflow contracts:** ツール実行順、セッション履歴の引き継ぎ、サンドボックス境界を複数ターンで検証できるか

今後の eval は、まず決定的であることを優先してください。

* モックプロバイダーを使い、ツール呼び出しと順序、skill ファイルの読み取り、セッション配線を検証するシナリオランナー
* スキルに特化した小規模シナリオ集 (使うべき場合と避けるべき場合、ゲーティング、プロンプトインジェクション)
* live eval は、CI-safe なスイートが先に整ってから opt-in の env-gated で追加します

## 回帰の追加 (ガイダンス)

live テストで見つかったプロバイダー/モデル不具合を修正したら、次の方針で回帰を追加してください。

* 可能なら CI-safe な回帰を追加します
  * モックまたはスタブプロバイダーを使う
  * リクエスト変換の形そのものを固定する
* 本質的に live 専用の問題 (レート制限、認証ポリシーなど) であれば、live テストを狭く保ち、環境変数で opt-in にします
* 不具合を捉えられる最小レイヤーを狙ってください
  * プロバイダー要求の変換や replay の不具合なら direct models テスト
  * ゲートウェイのセッション、履歴、ツールパイプラインの不具合なら gateway live smoke、または CI-safe な gateway mock テスト
