---
summary: "テスト キット: ユニット/e2e/ライブ スイート、Docker ランナー、および各テストの内容"
read_when:
  - ローカルまたはCIでテストを実行する
  - モデル/プロバイダーのバグに対する回帰の追加
  - ゲートウェイ + エージェントの動作のデバッグ
title: "テスト"
x-i18n:
  source_hash: "0ae8b68d1649d80f9d9fe515415e66b706629532b5b8aadbfb31512e250835cd"
---

# テスト

OpenClaw には 3 つの Vitest スイート (ユニット/統合、e2e、ライブ) と少数の Docker ランナーのセットがあります。

このドキュメントは「テスト方法」ガイドです。

- 各スイートがカバーする内容 (および意図的にカバーしない内容)
- 一般的なワークフローで実行するコマンド (ローカル、プリプッシュ、デバッグ)
- ライブ テストで認証情報を検出し、モデル/プロバイダーを選択する方法
- 現実世界のモデル/プロバイダーの問題に対する回帰を追加する方法

## クイックスタート

ほとんどの日:

- フルゲート (プッシュ前に予想される): `pnpm build && pnpm check && pnpm test`

テストに取り組むとき、またはさらなる自信が必要なとき:

- カバレッジ ゲート: `pnpm test:coverage`
- E2E スイート: `pnpm test:e2e`

実際のプロバイダー/モデルをデバッグする場合 (実際の認証情報が必要):

- ライブ スイート (モデル + ゲートウェイ ツール/イメージ プローブ): `pnpm test:live`

ヒント: 失敗するケースが 1 つだけ必要な場合は、以下で説明する許可リスト環境変数を使用してライブ テストを絞り込むことを好みます。

## テスト スイート (何がどこで実行されるか)

スイートを「リアリズムの増大」(そして不安定さ/コストの増大) と考えてください。

### ユニット/統合 (デフォルト)- コマンド: `pnpm test`

- 構成: `scripts/test-parallel.mjs` (`vitest.unit.config.ts`、`vitest.extensions.config.ts`、`vitest.gateway.config.ts` を実行)
- ファイル: `src/**/*.test.ts`、`extensions/**/*.test.ts`
- 範囲:
  - 純粋な単体テスト
  - インプロセス統合テスト (ゲートウェイ認証、ルーティング、ツール、解析、構成)
  - 既知のバグに対する決定論的回帰
- 期待:
  - CIで実行
  - 実際のキーは必要ありません
  - 高速かつ安定している必要があります
- プールに関する注意事項:
  - OpenClaw は、ユニット シャードを高速化するためにノード 22/23 で Vitest `vmForks` を使用します。
  - ノード 24 以降では、ノード VM リンク エラー (`ERR_VM_MODULE_LINK_FAILURE` / `module is already linked`) を回避するために、OpenClaw は自動的に通常の `forks` にフォールバックします。
  - `OPENCLAW_TEST_VM_FORKS=0` (強制 `forks`) または `OPENCLAW_TEST_VM_FORKS=1` (強制 `vmForks`) を使用して手動でオーバーライドします。

### E2E (ゲートウェイスモーク)- コマンド: `pnpm test:e2e`

- 構成: `vitest.e2e.config.ts`
- ファイル: `src/**/*.e2e.test.ts`
- 実行時のデフォルト:
  - ファイルの起動を高速化するために Vitest `vmForks` を使用します。
  - アダプティブ ワーカーを使用します (CI: 2 ～ 4、ローカル: 4 ～ 8)。
  - コンソール I/O オーバーヘッドを削減するために、デフォルトでサイレント モードで実行されます。
- 便利なオーバーライド:
  - `OPENCLAW_E2E_WORKERS=<n>` はワーカー数を強制します (上限は 16)。
  - `OPENCLAW_E2E_VERBOSE=1` は、詳細なコンソール出力を再度有効にします。
- 範囲:
  - マルチインスタンス ゲートウェイのエンドツーエンドの動作
  - WebSocket/HTTP サーフェス、ノード ペアリング、およびより重いネットワーク
- 期待:
  - CI で実行 (パイプラインで有効な場合)
  - 実際のキーは必要ありません
  - 単体テストよりも可動部分が多い (遅くなる可能性がある)

### ライブ (実際のプロバイダー + 実際のモデル)- コマンド: `pnpm test:live`

- 構成: `vitest.live.config.ts`
- ファイル: `src/**/*.live.test.ts`
- デフォルト: `pnpm test:live` により **有効** (`OPENCLAW_LIVE_TEST=1` を設定)
- 範囲:
  - 「このプロバイダー/モデルは、実際の認証情報を使用して実際に今日でも機能しますか?」
  - プロバイダー形式の変更、ツール呼び出しの癖、認証の問題、レート制限の動作をキャッチします
- 期待:
  - 設計上、CI 安定ではありません (実際のネットワーク、実際のプロバイダー ポリシー、クォータ、停止)
  - お金がかかる/レート制限を使用する
  - 「すべて」ではなく、絞り込んだサブセットを実行することを好みます。
  - ライブ実行では、不足している API キーを取得するために `~/.profile` をソースとします。
- API キーのローテーション (プロバイダー固有): `*_API_KEYS` をカンマ/セミコロン形式で設定するか、`*_API_KEY_1`、`*_API_KEY_2` (例: `OPENAI_API_KEYS`、`ANTHROPIC_API_KEYS`、`GEMINI_API_KEYS`) または`OPENCLAW_LIVE_*_KEY` によるライブごとのオーバーライド。テストはレート制限応答で再試行します。

## どのスイートを実行すればよいですか?

この決定表を使用します。

- ロジック/テストの編集: `pnpm test` (大幅に変更した場合は `pnpm test:coverage`) を実行します。
- タッチゲートウェイネットワーキング / WS プロトコル / ペアリング: `pnpm test:e2e` を追加
- 「ボットがダウンしています」/プロバイダー固有のエラー/ツール呼び出しのデバッグ: 絞り込まれた `pnpm test:live` を実行します。

## ライブ: Android ノードの機能スイープ- テスト: `src/gateway/android-node.capabilities.live.test.ts`

- スクリプト: `pnpm android:test:integration`
- 目標: 接続された Android ノードによって **現在アドバタイズされているすべてのコマンド**を呼び出し、コマンド コントラクトの動作をアサートします。
- 範囲:
  - 事前条件付き/手動セットアップ (スイートはアプリをインストール/実行/ペアリングしません)。
  - 選択した Android ノードのコマンドごとのゲートウェイ `node.invoke` 検証。
- 必要な事前設定:
  - Android アプリはすでにゲートウェイに接続され、ペアリングされています。
  - アプリはフォアグラウンドに保持されます。
  - 渡すことが期待される機能に対して付与されるアクセス許可/キャプチャ同意。
- オプションのターゲット オーバーライド:
  - `OPENCLAW_ANDROID_NODE_ID` または `OPENCLAW_ANDROID_NODE_NAME`。
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`。
- Android セットアップの詳細: [Android アプリ](/platforms/android)

## ライブ: モデルの煙 (プロファイル キー)

ライブ テストは 2 つのレイヤーに分割されているため、障害を分離できます。

- 「直接モデル」は、プロバイダー/モデルが指定されたキーでまったく応答できることを示します。
- 「ゲートウェイ スモーク」は、完全なゲートウェイ + エージェント パイプラインがそのモデル (セッション、履歴、ツール、サンドボックス ポリシーなど) で機能することを示します。

### レイヤ 1: 直接モデルの完成 (ゲートウェイなし)- テスト: `src/agents/models.profiles.live.test.ts`

- 目標:
  - 発見されたモデルを列挙する
  - `getApiKeyForModel` を使用して、信頼できるモデルを選択してください
  - モデルごとに小規模な完了を実行します (必要に応じてターゲットを絞った回帰も実行します)。
- 有効にする方法:
  - `pnpm test:live` (Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`)
- このスイートを実際に実行するには、`OPENCLAW_LIVE_MODELS=modern` (または `all`、モダンの別名) を設定します。それ以外の場合は、`pnpm test:live` をゲートウェイの煙に集中させるためにスキップされます。
- モデルの選択方法:
  - 最新の許可リストを実行する `OPENCLAW_LIVE_MODELS=modern` (Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.5、Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` は最新のホワイトリストのエイリアスです
  - または `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,..."` (カンマ許可リスト)
- プロバイダーの選択方法:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (カンマ許可リスト)
- キーの出所:
  - デフォルト: プロファイル ストアと環境フォールバック
  - **プロファイル ストア**のみを強制するように `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` を設定します
- これが存在する理由:
  - 「プロバイダー API が壊れている / キーが無効です」と「ゲートウェイ エージェント パイプラインが壊れている」を分離します
  - 小規模な個別の回帰が含まれます (例: OpenAI Responses/Codex Responses 推論リプレイ + ツール呼び出しフロー)

### レイヤ 2: ゲートウェイ + 開発エージェントのスモーク (「@openclaw」が実際に行うこと)- テスト: `src/gateway/gateway-models.profiles.live.test.ts`

- 目標:
  - インプロセスゲートウェイをスピンアップする
  - `agent:dev:*` セッションの作成/パッチ適用 (実行ごとにモデルをオーバーライド)
  - キーを含むモデルを反復し、次のようにアサートします。
    - 「意味のある」応答 (ツールなし)
    - 実際のツールの呼び出しが機能する (プローブの読み取り)
    - オプションの追加ツール プローブ (exec+read プローブ)
    - OpenAI 回帰パス (ツール呼び出しのみ → フォローアップ) が機能し続ける
- プローブの詳細 (失敗をすぐに説明できるように):
  - `read` プローブ: テストはワークスペースに nonce ファイルを書き込み、エージェントにそれを `read` して nonce をエコーバックするように要求します。
  - `exec+read` プローブ: テストは、エージェントに、ノンスを一時ファイルに `exec` 書き込み、その後 `read` 戻すように要求します。
  - 画像プローブ: テストは生成された PNG (cat + ランダム化されたコード) を添付し、モデルが `cat <CODE>` を返すことを期待します。
  - 実装リファレンス: `src/gateway/gateway-models.profiles.live.test.ts` および `src/gateway/live-image-probe.ts`。
- 有効にする方法:
  - `pnpm test:live` (Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`)
- モデルの選択方法:
  - デフォルト: 最新のホワイトリスト (Opus/Sonnet/Haiku 4.5、GPT-5.x + Codex、Gemini 3、GLM 4.7、MiniMax M2.5、Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` は最新のホワイトリストのエイリアスです
  - または、`OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (またはカンマリスト) を狭く設定します。
- プロバイダーの選択方法 (「OpenRouter everything」は避けてください):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (カンマ許可リスト)
- このライブ テストでは、ツール + イメージ プローブが常にオンになっています。- `read` プローブ + `exec+read` プローブ (工具応力)
  - モデルが画像入力サポートをアドバタイズするときに画像プローブが実行されます
  - フロー (高レベル):
    - テストでは、「CAT」 + ランダム コード (`src/gateway/live-image-probe.ts`) を含む小さな PNG を生成します。
    - `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]` 経由で送信します
    - ゲートウェイは添付ファイルを `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`) に解析します。
    - 埋め込みエージェントがマルチモーダル ユーザー メッセージをモデルに転送します
    - アサーション: 返信には `cat` + コードが含まれています (OCR 耐性: 軽微なミスは許容されます)

ヒント: マシンでテストできる内容 (および正確な `provider/model` ID) を確認するには、次のコマンドを実行します。

```bash
openclaw models list
openclaw models list --json
```

## ライブ: Anthropic セットアップ トークンの煙

- テスト: `src/agents/anthropic.setup-token.live.test.ts`
- 目標: Claude Code CLI セットアップ トークン (または貼り付けられたセットアップ トークン プロファイル) が Anthropic プロンプトを完了できることを確認します。
- 有効にする:
  - `pnpm test:live` (Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_SETUP_TOKEN=1`
- トークン ソース (1 つ選択):
  - プロフィール: `OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test`
  - 生のトークン: `OPENCLAW_LIVE_SETUP_TOKEN_VALUE=sk-ant-oat01-...`
- モデル オーバーライド (オプション):
  - `OPENCLAW_LIVE_SETUP_TOKEN_MODEL=anthropic/claude-opus-4-6`

設定例：

```bash
openclaw models auth paste-token --provider anthropic --profile-id anthropic:setup-token-test
OPENCLAW_LIVE_SETUP_TOKEN=1 OPENCLAW_LIVE_SETUP_TOKEN_PROFILE=anthropic:setup-token-test pnpm test:live src/agents/anthropic.setup-token.live.test.ts
```

## ライブ: CLI バックエンド スモーク (Claude Code CLI または他のローカル CLI)- テスト: `src/gateway/gateway-cli-backend.live.test.ts`

- 目標: デフォルト設定を変更せずに、ローカル CLI バックエンドを使用してゲートウェイ + エージェント パイプラインを検証します。
- 有効にする:
  - `pnpm test:live` (Vitest を直接呼び出す場合は `OPENCLAW_LIVE_TEST=1`)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- デフォルト:
  - モデル: `claude-cli/claude-sonnet-4-6`
  - コマンド: `claude`
  - 引数: `["-p","--output-format","json","--permission-mode","bypassPermissions"]`
- オーバーライド (オプション):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","json","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` 実際のイメージ添付ファイルを送信します (パスがプロンプトに挿入されます)。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` は、プロンプト挿入の代わりにイメージ ファイル パスを CLI 引数として渡します。
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (または `"list"`) は、`IMAGE_ARG` が設定されている場合にイメージ引数がどのように渡されるかを制御します。
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` は 2 番目のターンを送信し、再開フローを検証します。
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` は、Claude Code CLI MCP 構成を有効のままにします (デフォルトでは、一時的な空のファイルを使用して MCP 構成が無効になります)。

例:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

### おすすめのライブレシピ

限定的で明示的な許可リストは、最速で不安定さが最も少ないです。

- 単一モデル、直接 (ゲートウェイなし):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- 単一モデル、ゲートウェイスモーク:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- 複数のプロバイダー間でのツール呼び出し:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google フォーカス (Gemini API キー + 反重力):
  - ジェミニ (API キー): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - 反重力 (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

注:- `google/...` は Gemini API (API キー) を使用します。

- `google-antigravity/...` は、Antigravity OAuth ブリッジ (Cloud Code Assist スタイルのエージェント エンドポイント) を使用します。
- `google-gemini-cli/...` は、マシン上のローカル Gemini CLI を使用します (個別の認証とツールの癖)。
- Gemini API と Gemini CLI:
  - API: OpenClaw は、Google がホストする Gemini API を HTTP 経由で呼び出します (API キー/プロファイル認証)。これが、ほとんどのユーザーが「Gemini」という言葉で意味するものです。
  - CLI: OpenClaw はローカルの `gemini` バイナリにシェルアウトします。独自の認証があり、異なる動作をする可能性があります (ストリーミング/ツール サポート/バージョン スキュー)。

## ライブ: モデル マトリックス (説明する内容)

固定の「CI モデル リスト」はありません (ライブはオプトインです) が、これらはキー付きの開発マシンで定期的にカバーする **推奨** モデルです。

### モダンスモークセット (ツール呼び出し + 画像)

これは、引き続き機能すると予想される「共通モデル」の実行です。

- OpenAI (非 Codex): `openai/gpt-5.2` (オプション: `openai/gpt-5.1`)
- OpenAI コーデックス: `openai-codex/gpt-5.4`
- 人間性: `anthropic/claude-opus-4-6` (または `anthropic/claude-sonnet-4-5`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` および `google/gemini-3-flash-preview` (古い Gemini 2.x モデルは避けてください)
- Google (反重力): `google-antigravity/claude-opus-4-6-thinking` および `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- ミニマックス: `minimax/minimax-m2.5`

ツール + イメージを使用してゲートウェイ スモークを実行します。
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/minimax-m2.5" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### ベースライン: ツール呼び出し (読み取り + オプションの実行)

プロバイダー ファミリごとに少なくとも 1 つ選択します。- OpenAI: `openai/gpt-5.2` (または `openai/gpt-5-mini`)

- 人間性: `anthropic/claude-opus-4-6` (または `anthropic/claude-sonnet-4-5`)
- Google: `google/gemini-3-flash-preview` (または `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- ミニマックス: `minimax/minimax-m2.5`

オプションの追加補償 (あると便利):

- xAI: `xai/grok-4` (または利用可能な最新のもの)
- ミストラル: `mistral/`… (有効にした「ツール」対応モデルを 1 つ選択してください)
- 大脳: `cerebras/`… (アクセス権がある場合)
- LM Studio: `lmstudio/`… (ローカル; ツール呼び出しは API モードに依存します)

### ビジョン: 画像送信 (添付ファイル → マルチモーダル メッセージ)

画像プローブを実行するには、`OPENCLAW_LIVE_GATEWAY_MODELS` に少なくとも 1 つの画像対応モデル (Claude/Gemini/OpenAI ビジョン対応バリアントなど) を含めます。

### アグリゲータ/代替ゲートウェイ

キーが有効になっている場合は、次の方法によるテストもサポートされます。

- OpenRouter: `openrouter/...` (数百のモデル。ツール + イメージ対応の候補を見つけるには `openclaw models scan` を使用します)
- OpenCode Zen: `opencode/...` (`OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY` による認証)

ライブ マトリックスに追加できるプロバイダー (creds/config がある場合):- 内蔵: `openai`、`openai-codex`、`anthropic`、`google`、`google-vertex`、`google-antigravity`、`google-gemini-cli`、 `zai`、`openrouter`、`opencode`、`xai`、`groq`、`cerebras`、`mistral`、 `github-copilot`

- `models.providers` (カスタム エンドポイント) 経由: `minimax` (クラウド/API)、および OpenAI/Anthropic 互換プロキシ (LM Studio、vLLM、LiteLLM など)

ヒント: ドキュメント内で「すべてのモデル」をハードコーディングしようとしないでください。権限のあるリストは、マシン上で `discoverModels(...)` が返すものと、使用可能なキーすべてです。

## 認証情報 (決してコミットしない)

ライブ テストは、CLI と同じ方法で認証情報を検出します。実際的な意味:

- CLI が機能する場合、ライブ テストで同じキーが見つかるはずです。
- ライブ テストで「認証情報がありません」と表示された場合は、`openclaw models list` / モデルの選択をデバッグするのと同じ方法でデバッグします。

- プロファイル ストア: `~/.openclaw/credentials/` (推奨。テストにおける「プロファイル キー」の意味)
- 構成: `~/.openclaw/openclaw.json` (または `OPENCLAW_CONFIG_PATH`)

env キー (`~/.profile` でエクスポートされたものなど) に依存したい場合は、`source ~/.profile` の後にローカル テストを実行するか、以下の Docker ランナーを使用します (`~/.profile` をコンテナーにマウントできます)。

## Deepgram ライブ (音声転写)

- テスト: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- 有効化: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus コーディング プランがライブ中- テスト: `src/agents/byteplus.live.test.ts`

- 有効化: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- オプションのモデル オーバーライド: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Docker ランナー (オプションの「Linux で動作する」チェック)

これらはリポジトリの Docker イメージ内で `pnpm test:live` を実行し、ローカル構成ディレクトリとワークスペースをマウントします (マウントされている場合は `~/.profile` を取得します)。

- 直接モデル: `pnpm test:docker:live-models` (スクリプト: `scripts/test-live-models-docker.sh`)
- ゲートウェイ + 開発エージェント: `pnpm test:docker:live-gateway` (スクリプト: `scripts/test-live-gateway-models-docker.sh`)
- オンボーディング ウィザード (TTY、完全なスキャフォールディング): `pnpm test:docker:onboard` (スクリプト: `scripts/e2e/onboard-docker.sh`)
- ゲートウェイ ネットワーキング (2 つのコンテナー、WS 認証 + ヘルス): `pnpm test:docker:gateway-network` (スクリプト: `scripts/e2e/gateway-network-docker.sh`)
- プラグイン (カスタム拡張機能ロード + レジストリ スモーク): `pnpm test:docker:plugins` (スクリプト: `scripts/e2e/plugins-docker.sh`)

ライブモデルの Docker ランナーは、現在のチェックアウトを読み取り専用でバインドマウントします。
それをコンテナ内の一時的な作業ディレクトリにステージングします。これによりランタイムが維持されます
正確なローカルソース/構成に対して Vitest を実行しながら、イメージをスリムにします。

手動 ACP 平文スレッド スモーク (CI ではありません):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- このスクリプトは回帰/デバッグ ワークフロー用に保管してください。 ACP スレッド ルーティングの検証に再度必要になる可能性があるため、削除しないでください。

便利な環境変数:- `OPENCLAW_CONFIG_DIR=...` (デフォルト: `~/.openclaw`) が `/home/node/.openclaw` にマウントされました

- `OPENCLAW_WORKSPACE_DIR=...` (デフォルト: `~/.openclaw/workspace`) が `/home/node/.openclaw/workspace` にマウントされました
- `OPENCLAW_PROFILE_FILE=...` (デフォルト: `~/.profile`) は `/home/node/.profile` にマウントされ、テストを実行する前にソースされます。
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` で実行を絞り込みます
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` 認証情報がプロファイル ストア (env ではなく) から取得されていることを確認します。

## ドキュメントの健全性

ドキュメントの編集後にドキュメント チェックを実行します: `pnpm docs:list`。

## オフライン回帰 (CI セーフ)

これらは、実際のプロバイダーを使用しない「実際のパイプライン」回帰です。

- ゲートウェイ ツール呼び出し (模擬 OpenAI、実際のゲートウェイ + エージェント ループ): `src/gateway/gateway.test.ts` (ケース: 「ゲートウェイ エージェント ループを介してエンドツーエンドで模擬 OpenAI ツール呼び出しを実行する」)
- ゲートウェイ ウィザード (WS `wizard.start`/`wizard.next`、構成書き込み + 認証強制): `src/gateway/gateway.test.ts` (ケース: 「WS 上でウィザードを実行し、認証トークン構成を書き込む」)

## エージェントの信頼性評価 (スキル)

「エージェントの信頼性評価」のように動作する CI セーフなテストがすでにいくつかあります。

- 実際のゲートウェイ + エージェント ループを介した模擬ツール呼び出し (`src/gateway/gateway.test.ts`)。
- セッションのワイヤリングと構成の効果を検証するエンドツーエンドのウィザード フロー (`src/gateway/gateway.test.ts`)。

スキルにまだ欠けているもの ([スキル](/tools/skills) を参照):- **意思決定:** スキルがプロンプトにリストされている場合、エージェントは正しいスキルを選択しますか (または無関係なスキルは避けますか)?

- **コンプライアンス:** エージェントは使用前に `SKILL.md` を読み、必要な手順/引数に従っていますか?
- **ワークフロー契約:** ツールの順序、セッション履歴の引き継ぎ、サンドボックスの境界を主張するマルチターン シナリオ。

今後の eval は、まず決定論的である必要があります。

- モック プロバイダーを使用してツールの呼び出しと順序、スキル ファイルの読み取り、およびセッションのワイヤリングをアサートするシナリオ ランナー。
- スキルに焦点を当てた小さなシナリオ スイート (使用 vs 回避、ゲート、プロンプト インジェクション)。
- CI セーフ スイートが導入された後にのみ、オプションのライブ評価 (オプトイン、env-gated)。

## 回帰の追加 (ガイダンス)

ライブで発見されたプロバイダー/モデルの問題を修正する場合:

- 可能であれば、CI セーフな回帰を追加します (モック/スタブ プロバイダー、または正確なリクエスト形状変換をキャプチャします)。
- 本質的にライブ専用 (レート制限、認証ポリシー) の場合は、ライブ テストの範囲を狭くし、環境変数を介してオプトインします。
- バグをキャッチする最小のレイヤーをターゲットにすることを好みます。
  - プロバイダーリクエストの変換/再生バグ → 直接モデルテスト
  - ゲートウェイのセッション/履歴/ツール パイプラインのバグ → ゲートウェイのライブ スモークまたは CI セーフなゲートウェイの模擬テスト
