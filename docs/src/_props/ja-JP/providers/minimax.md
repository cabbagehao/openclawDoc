---
summary: "OpenClaw で MiniMax M2.5 を使用する"
read_when:
  - OpenClaw で MiniMax モデルが必要な場合
  - MiniMax セットアップ ガイドが必要です
title: "ミニマックス"
x-i18n:
  source_hash: "e3c3db884be3a8876a0434009953c7afa5381c46023782ac3cf6d6d42c3dd2ff"
---

# ミニマックス

MiniMax は、**M2/M2.5** モデル ファミリを構築する AI 企業です。現在の
コーディングに重点を置いたリリースは **MiniMax M2.5** (2025 年 12 月 23 日) です。
現実世界の複雑なタスク。

出典: [MiniMax M2.5 リリースノート](https://www.minimax.io/news/minimax-m25)

## モデル概要（M2.5）

MiniMax は、M2.5 の次の改善点を強調しています。

* より強力な **多言語コーディング** (Rust、Java、Go、C++、Kotlin、Objective-C、TS/JS)。
* **Web/アプリ開発**と美的出力品質 (ネイティブ モバイルを含む) の向上。
* オフィス スタイルのワークフロー向けに **複合命令** の処理を改善しました。
  インターリーブされた思考と統合された制約の実行。
* **より簡潔な応答**により、トークンの使用量が減り、反復ループが高速化されます。
* **ツール/エージェント フレームワーク**の互換性とコンテキスト管理の強化 (Claude Code、
  Droid/Factory AI、Cline、Kilo コード、Roo コード、BlackBox)。
* 高品質の **ダイアログおよびテクニカル ライティング** の出力。

## MiniMax M2.5 と MiniMax M2.5 ハイスピード

* **速度:** `MiniMax-M2.5-highspeed` は、MiniMax ドキュメントの公式の高速層です。
* **コスト:** MiniMax の価格には、入力コストは同じですが、高速の場合は出力コストが高くなります。
* **現在のモデル ID:** `MiniMax-M2.5` または `MiniMax-M2.5-highspeed` を使用します。

## セットアップを選択してください

### MiniMax OAuth (コーディング プラン) — 推奨

**最適な用途:** OAuth 経由の MiniMax コーディング プランによる迅速なセットアップ。API キーは必要ありません。バンドルされている OAuth プラグインを有効にして認証します。

```bash
openclaw plugins enable minimax-portal-auth  # skip if already loaded.
openclaw gateway restart  # restart if gateway is already running
openclaw onboard --auth-choice minimax-portal
```

エンドポイントを選択するように求められます。

* **グローバル** - 海外のユーザー (`api.minimax.io`)
* **CN** - 中国のユーザー (`api.minimaxi.com`)

詳細については、[MiniMax OAuth プラグインの README](https://github.com/openclaw/openclaw/tree/main/extensions/minimax-portal-auth) を参照してください。

### MiniMax M2.5 (API キー)

**最適な用途:** Anthropic 互換 API を使用してホストされた MiniMax。

CLI 経由で設定します。

* `openclaw configure` を実行します
* **モデル/認証**を選択します
* **MiniMax M2.5** を選択してください

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.5" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
          {
            id: "MiniMax-M2.5-highspeed",
            name: "MiniMax M2.5 Highspeed",
            reasoning: true,
            input: ["text"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.03, cacheWrite: 0.12 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### MiniMax M2.5 をフォールバックとして使用する (例)

**最適な用途:** 最も強力な最新世代モデルをプライマリとして保持し、MiniMax M2.5 にフェイルオーバーします。
以下の例では、具体的なプライマリとして Opus を使用しています。ご希望の最新世代のプライマリ モデルに交換してください。

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.5": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.5"],
      },
    },
  },
}
```

### オプション: LM Studio 経由でローカル (手動)

**最適な用途:** LM Studio を使用したローカル推論。
強力なハードウェア (例:
デスクトップ/サーバー)、LM Studio のローカルサーバーを使用します。

`openclaw.json` 経由で手動で構成します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: { "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## `openclaw configure` 経由で構成します

対話型構成ウィザードを使用して、JSON を編集せずに MiniMax を設定します。

1. `openclaw configure` を実行します。
2. **モデル/認証**を選択します。
3. **MiniMax M2.5** を選択します。
4. プロンプトが表示されたら、デフォルトのモデルを選択します。

## 構成オプション- `models.providers.minimax.baseUrl`: `https://api.minimax.io/anthropic` を優先します (Anthropic 互換)。 `https://api.minimax.io/v1` は、OpenAI 互換ペイロードの場合はオプションです

* `models.providers.minimax.api`: `anthropic-messages` を優先します。 `openai-completions` は、OpenAI 互換ペイロードの場合はオプションです。
* `models.providers.minimax.apiKey`: MiniMax API キー (`MINIMAX_API_KEY`)。
* `models.providers.minimax.models`: `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` を定義します。
* `agents.defaults.models`: ホワイトリストに含めるエイリアス モデル。
* `models.mode`: ビルトインと一緒に MiniMax を追加する場合は、`merge` を保持します。

## 注意事項

* モデル参照番号は `minimax/<model>` です。
* 推奨モデル ID: `MiniMax-M2.5` および `MiniMax-M2.5-highspeed`。
* コーディング プランの使用 API: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (コーディング プラン キーが必要)。
* 正確なコスト追跡が必要な場合は、`models.json` の価格設定値を更新します。
* MiniMax コーディング プランの紹介リンク (10% オフ): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb\&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb\&source=link)
* プロバイダーのルールについては、[/concepts/model-providers](/concepts/model-providers) を参照してください。
* `openclaw models list` と `openclaw models set minimax/MiniMax-M2.5` を使用して切り替えます。

## トラブルシューティング

### 「不明なモデル: minimax/MiniMax-M2.5」

これは通常、**MiniMax プロバイダーが構成されていない** (プロバイダー エントリがないことを意味します)
MiniMax 認証プロファイル/環境キーが見つかりません)。この検出に対する修正は次のとおりです。
**2026.1.12** (執筆時点では未公開)。修正方法:- **2026.1.12** にアップグレード (またはソース `main` から実行) し、ゲートウェイを再起動します。

* `openclaw configure` を実行し、**MiniMax M2.5** を選択する、または
* `models.providers.minimax` ブロックを手動で追加する、または
* プロバイダーを挿入できるように `MINIMAX_API_KEY` (または MiniMax 認証プロファイル) を設定します。

モデル ID が **大文字と小文字を区別している**ことを確認してください。

* `minimax/MiniMax-M2.5`
* `minimax/MiniMax-M2.5-highspeed`

次に、次のように再確認します。

```bash
openclaw models list
```
