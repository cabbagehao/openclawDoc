---
summary: "何がお金を費やす可能性があるか、どのキーが使用されるか、使用状況を確認する方法を監査する"
read_when:
  - どの機能が有料 API を呼び出す可能性があるかを理解したい
  - キー、コスト、使用状況の可視性を監査する必要がある
  - /status または /usage Cost レポートについて説明しています
title: "APIの使用量とコスト"
seoTitle: "OpenClaw API使用量とコスト発生箇所を監査する確認ガイド"
description: "このドキュメントには、API キーを呼び出すことができる機能とそのコストが発生する場所がリストされています。焦点を当てているのは、 プロバイダーの使用状況または有料 API 呼び出しを生成できる OpenClaw 機能。"
x-i18n:
  source_hash: "2377e392fbeb4805c3689a3a710ee8613082c8844c744b1f812b2e2fdc17e050"
---
このドキュメントには、**API キーを呼び出すことができる機能**とそのコストが発生する場所がリストされています。焦点を当てているのは、
プロバイダーの使用状況または有料 API 呼び出しを生成できる OpenClaw 機能。

## コストが発生する場所 (チャット + CLI)

**セッションごとのコストのスナップショット**

- `/status` は、現在のセッション モデル、コンテキストの使用状況、および最後の応答トークンを示します。
- モデルが **API キー認証**を使用している場合、`/status` には最後の応答の **推定コスト** も表示されます。

**メッセージごとのコストフッター**

- `/usage full` は、**推定コスト** (API キーのみ) を含む使用状況フッターをすべての返信に追加します。
- `/usage tokens` はトークンのみを表示します。 OAuth フローはコストを隠します。

**CLI 使用ウィンドウ (プロバイダー クォータ)**

- `openclaw status --usage` および `openclaw channels list` はプロバイダーの **使用ウィンドウ** を表示します
  (メッセージごとのコストではなく、クォータのスナップショット)。

詳細と例については、[トークンの使用とコスト](/reference/token-use) を参照してください。

## キーの発見方法

OpenClaw は以下から認証情報を取得できます。

- **認証プロファイル** (エージェントごと、`auth-profiles.json` に保存)。
- **環境変数** (例: `OPENAI_API_KEY`、`BRAVE_API_KEY`、`FIRECRAWL_API_KEY`)。
- **構成** (`models.providers.*.apiKey`、`tools.web.search.*`、`tools.web.fetch.firecrawl.*`、
  `memorySearch.*`、`talk.apiKey`)。
- **スキル** (`skills.entries.<name>.apiKey`) キーをスキル プロセス環境にエクスポートする可能性があります。

## キーを使用できる機能

### 1) コアモデルの応答 (チャット + ツール)すべての応答またはツール呼び出しでは、**現在のモデル プロバイダー** (OpenAI、Anthropic など) が使用されます。これは、

使用量とコストの主なソース。

価格設定については [モデル](/providers/models) を、表示については [トークンの使用とコスト](/reference/token-use) を参照してください。

### 2) メディア理解 (音声/画像/ビデオ)

受信メディアは、応答が実行される前に要約/転写できます。これにはモデル/プロバイダー API が使用されます。

- オーディオ: OpenAI / Groq / Deepgram (キーが存在する場合は **自動有効**)。
- 画像: OpenAI / Anthropic / Google。
- ビデオ: Google。

[メディアの理解](/nodes/media-understanding) を参照してください。

### 3) メモリ埋め込み + セマンティック検索

セマンティック メモリ検索は、リモート プロバイダー用に構成されている場合に **埋め込み API** を使用します。

- `memorySearch.provider = "openai"` → OpenAI 埋め込み
- `memorySearch.provider = "gemini"` → Gemini 埋め込み
- `memorySearch.provider = "voyage"` → Voyage の埋め込み
- `memorySearch.provider = "mistral"` → ミストラル埋め込み
- `memorySearch.provider = "ollama"` → Ollama 埋め込み (ローカル/セルフホスト。通常、ホスト API の課金はありません)
- ローカルの埋め込みが失敗した場合のリモートプロバイダーへのオプションのフォールバック

`memorySearch.provider = "local"` を使用してローカルに維持できます (API は使用しません)。

[メモリ](/concepts/memory) を参照してください。

### 4) Web検索ツール

`web_search` は API キーを使用するため、プロバイダーによっては使用料金が発生する場合があります。- **Brave Search API**: `BRAVE_API_KEY` または `tools.web.search.apiKey`

- **ジェミニ (Google 検索)**: `GEMINI_API_KEY`
- **Grok (xAI)**: `XAI_API_KEY`
- **キミ (ムーンショット)**: `KIMI_API_KEY` または `MOONSHOT_API_KEY`
- **複雑性検索 API**: `PERPLEXITY_API_KEY`

**Brave Search の無料クレジット:** 各 Brave プランには、月額 5 ドルの更新料が含まれています
無料のクレジット。検索プランの料金は 1,000 リクエストあたり 5 ドルなので、クレジットでカバーされます。
1,000 件のリクエスト/月は無料です。 Brave ダッシュボードで使用制限を設定します
予期せぬ請求を避けるため。

[Web ツール](/tools/web) を参照してください。

### 5) Web 取得ツール (Firecrawl)

API キーが存在する場合、`web_fetch` は **Firecrawl** を呼び出すことができます。

- `FIRECRAWL_API_KEY` または `tools.web.fetch.firecrawl.apiKey`

Firecrawl が構成されていない場合、ツールは直接フェッチ + 可読性にフォールバックします (有料 API なし)。

[Web ツール](/tools/web) を参照してください。

### 6) プロバイダーの使用状況のスナップショット (ステータス/健全性)

一部のステータス コマンドは、**プロバイダー使用状況エンドポイント**を呼び出して、クォータ ウィンドウまたは認証の状態を表示します。
これらは通常、少量の呼び出しですが、それでもプロバイダー API にヒットします。

- `openclaw status --usage`
- `openclaw models status --json`

[モデル CLI](/cli/models) を参照してください。

### 7) 圧縮セーフガードの概要

圧縮セーフガードは、**現在のモデル** を使用してセッション履歴を要約できます。
実行時にプロバイダー API を呼び出します。

[セッション管理 + 圧縮](/reference/session-management-compaction) を参照してください。

### 8) モデルスキャン/プローブ`openclaw models scan` は OpenRouter モデルをプローブでき、次の場合に `OPENROUTER_API_KEY` を使用します

プロービングが有効になっています。

[モデル CLI](/cli/models) を参照してください。

### 9) トーク（スピーチ）

トーク モードは、構成時に **イレブンラボ** を呼び出すことができます。

- `ELEVENLABS_API_KEY` または `talk.apiKey`

[トークモード](/nodes/talk)を参照してください。

### 10) スキル (サードパーティ API)

スキルは `apiKey` を `skills.entries.<name>.apiKey` に保存できます。スキルがそのキーを外部に使用する場合
API の場合、スキルのプロバイダーに応じてコストが発生する可能性があります。

[スキル](/tools/skills) を参照してください。
