---
title: "デフォルトのAGENTS.md"
summary: "パーソナル アシスタント設定用のデフォルトの OpenClaw エージェントの指示とスキル名簿"
read_when:
  - 新しい OpenClaw エージェント セッションの開始
  - デフォルトのスキルの有効化または監査
x-i18n:
  source_hash: "7d544c51781ee5b635f36a5e393ffbc92652769bd296e2c63ea3445db518a0a2"
---
## 最初の実行 (推奨)

OpenClaw は、エージェント専用のワークスペース ディレクトリを使用します。デフォルト: `~/.openclaw/workspace` (`agents.defaults.workspace` 経由で構成可能)。

1. ワークスペースを作成します (まだ存在しない場合)。

```bash
mkdir -p ~/.openclaw/workspace
```

2. デフォルトのワークスペース テンプレートをワークスペースにコピーします。

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. オプション: パーソナル アシスタントのスキル名簿が必要な場合は、AGENTS.md を次のファイルに置き換えます。

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. オプション: `agents.defaults.workspace` を設定して別のワークスペースを選択します (`~` をサポート):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全性のデフォルト

- ディレクトリや秘密をチャットにダンプしないでください。
- 明示的に要求されない限り、破壊的なコマンドを実行しないでください。
- 外部メッセージング サーフェスに部分/ストリーミング返信を送信しないでください (最終返信のみ)。

## セッションの開始 (必須)

- `SOUL.md`、`USER.md`、`memory.md`、および `memory/` の今日と昨日を読み取ります。
- 応答する前に実行してください。

## ソウル (必須)

- `SOUL.md` は、アイデンティティ、トーン、境界を定義します。最新の状態に保ってください。
- `SOUL.md` を変更する場合は、ユーザーに伝えてください。
- あなたはセッションごとに新しいインスタンスになります。これらのファイルには連続性が存在します。

## 共有スペース (推奨)

- あなたはユーザーの声ではありません。グループチャットや公開チャンネルでは注意してください。
- 個人データ、連絡先情報、社内メモなどを共有しないでください。

## メモリ システム (推奨)- 日次ログ: `memory/YYYY-MM-DD.md` (必要に応じて `memory/` を作成します)

- 長期記憶: 永続的な事実、好み、意思決定のための `memory.md`。
- セッションの開始時に、今日 + 昨日 + `memory.md` (存在する場合) を読み取ります。
- キャプチャ: 決定、好み、制約、オープンループ。
- 明示的に要求されない限り、秘密は避けてください。

## ツールとスキル

- ツールはスキルに組み込まれています。必要に応じて、各スキルの `SKILL.md` に従ってください。
- 環境固有のメモを `TOOLS.md` (スキルに関するメモ) に保管します。

## バックアップのヒント (推奨)

このワークスペースを Clawd の「メモリ」として扱う場合は、`AGENTS.md` とメモリ ファイルがバックアップされるように、ワークスペースを git リポジトリ (理想的にはプライベート) にします。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw の機能

- WhatsApp ゲートウェイ + Pi コーディング エージェントを実行することで、アシスタントはホスト Mac 経由でチャットの読み取り/書き込み、コンテキストの取得、スキルの実行が可能になります。
- macOS アプリは権限 (画面録画、通知、マイク) を管理し、バンドルされたバイナリを介して `openclaw` CLI を公開します。
- デフォルトでは、ダイレクト チャットはエージェントの `main` セッションに組み込まれます。グループは `agent:<agentId>:<channel>:group:<id>` (ルーム/チャネル: `agent:<agentId>:<channel>:channel:<id>`) として隔離されたままになります。ハートビートはバックグラウンド タスクを維持します。

## コア スキル ([設定] → [スキル] で有効にします)- **mcporter** — 外部スキル バックエンドを管理するためのツール サーバー ランタイム/CLI

- **Peekaboo** — オプションの AI ビジョン分析を備えた高速 macOS スクリーンショット。
- **camsnap** — RTSP/ONVIF セキュリティ カメラからフレーム、クリップ、またはモーション アラートをキャプチャします。
- **oracle** — セッション再生とブラウザ制御を備えた OpenAI 対応エージェント CLI。
- **eightctl** — 端末から睡眠を制御します。
- **imsg** — iMessage と SMS を送信、読み取り、ストリーミングします。
- **wacli** — WhatsApp CLI: 同期、検索、送信。
- **discord** — Discord アクション: 反応、ステッカー、投票。 `user:<id>` または `channel:<id>` ターゲットを使用します (裸の数値 ID は曖昧です)。
- **gog** — Google Suite CLI: Gmail、カレンダー、ドライブ、連絡先。
- **spotify-player** — 再生を検索/キューに追加/制御するためのターミナル Spotify クライアント。
- **sag** — Mac スタイルの Say UX を使用した イレブンラボのスピーチ。デフォルトでスピーカーにストリーミングします。
- **Sonos CLI** — スクリプトから Sonos スピーカー (検出/ステータス/再生/音量/グループ化) を制御します。
- **blucli** — スクリプトから BluOS プレーヤーを再生、グループ化、自動化します。
- **OpenHue CLI** — シーンおよびオートメーション用の Philips Hue 照明制御。
- **OpenAI Whisper** — ローカルの音声をテキストに変換して、迅速なディクテーションとボイスメールのトランスクリプトを作成します。
- **Gemini CLI** — 端末からの Google Gemini モデルによる迅速な Q&A。
- **agent-tools** — 自動化およびヘルパー スクリプト用のユーティリティ ツールキット。

## 使用上の注意- スクリプト作成には `openclaw` CLI を優先します。 Mac アプリが権限を処理します

- [スキル] タブからインストールを実行します。バイナリがすでに存在する場合、ボタンは非表示になります。
- アシスタントがリマインダーをスケジュールし、受信トレイを監視し、カメラ キャプチャをトリガーできるように、ハートビートを有効にしたままにします。
- Canvas UI はネイティブ オーバーレイを使用して全画面で実行されます。重要なコントロールを左上/右上/下端に配置することは避けてください。レイアウトに明示的なガターを追加し、安全領域のインセットに依存しないでください。
- ブラウザ駆動の検証の場合は、OpenClaw で管理される Chrome プロファイルで `openclaw browser` (タブ/ステータス/スクリーンショット) を使用します。
- DOM 検査の場合は、`openclaw browser eval|query|dom|snapshot` (マシン出力が必要な場合は `--json`/`--out`) を使用します。
- インタラクションの場合は、`openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` を使用します (スナップショット参照が必要をクリック/入力します。CSS セレクターには `evaluate` を使用します)。
