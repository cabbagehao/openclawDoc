---
summary: "リファクタリング計画: 実行ホストルーティング、ノード承認、ヘッドレスランナー"
read_when:
  - 実行ホストルーティングまたは実行承認の設計
  - ノードランナー + UI IPC の実装
  - 実行ホストセキュリティモードとスラッシュコマンドの追加
title: "実行ホストリファクタリング"
seoTitle: "OpenClawの実行ホスト改修の目的と設計論点を整理するガイド"
description: "従来のホワイトリストの移行や従来のスキーマのサポートはありません。ノード実行の PTY/ストリーミングなし (集約出力のみ)。目標、非目標、決定 (ロック済み)- 構成キー: exec.host + exec.security。"
x-i18n:
  source_hash: "53a9059cbeb1f3f1dbb48c2b5345f88ca92372654fef26f8481e651609e45e3a"
---
## 目標

- **サンドボックス**、**ゲートウェイ**、**ノード**全体で実行をルーティングするために、`exec.host` + `exec.security` を追加します。
- デフォルトを維持 **安全**: 明示的に有効にしない限り、クロスホスト実行はありません。
- ローカル IPC 経由で、オプションの UI (macOS アプリ) を備えた **ヘッドレス ランナー サービス** に実行を分割します。
- **エージェントごと** ポリシー、許可リスト、質問モード、およびノー​​ド バインディングを提供します。
- ホワイトリストありまたはなしで機能する **ask モード** をサポートします。
- クロスプラットフォーム: Unix ソケット + トークン認証 (macOS/Linux/Windows パリティ)。

## 非目標

- 従来のホワイトリストの移行や従来のスキーマのサポートはありません。
- ノード実行の PTY/ストリーミングなし (集約出力のみ)。
- 既存のブリッジ + ゲートウェイを超える新しいネットワーク層はありません。

## 決定 (ロック済み)- **構成キー:** `exec.host` + `exec.security` (エージェントごとのオーバーライドが可能)

- **昇格:** `/elevated` をゲートウェイのフル アクセスのエイリアスとして保持します。
- **デフォルトを尋ねる:** `on-miss`。
- **承認ストア:** `~/.openclaw/exec-approvals.json` (JSON、レガシー移行なし)。
- **ランナー:** ヘッドレス システム サービス; UI アプリは承認用の Unix ソケットをホストします。
- **ノード ID:** 既存の `nodeId` を使用します。
- **ソケット認証:** Unix ソケット + トークン (クロスプラットフォーム)。必要に応じて後で分割します。
- **ノード ホストの状態:** `~/.openclaw/node.json` (ノード ID + ペアリング トークン)。
- **macOS 実行ホスト:** macOS アプリ内で `system.run` を実行します。ノード ホスト サービスはローカル IPC 経由でリクエストを転送します。
- **XPC ヘルパーなし:** Unix ソケット + トークン + ピア チェックに固執します。

## 主要な概念

### ホスト

- `sandbox`: Docker exec (現在の動作)。
- `gateway`: ゲートウェイ ホスト上で実行します。
- `node`: ブリッジ経由でノード ランナー上で実行します (`system.run`)。

### セキュリティモード

- `deny`: 常にブロックします。
- `allowlist`: 一致のみを許可します。
- `full`: すべてを許可します (昇格と同等)。

### 質問モード

- `off`: 決して質問しないでください。
- `on-miss`: ホワイトリストが一致しない場合にのみ質問します。
- `always`: 毎回尋ねます。

Ask はホワイトリストから**独立**しています。ホワイトリストは `always` または `on-miss` とともに使用できます。

### ポリシー解決 (実行ごと)1. `exec.host` (ツール パラメーター → エージェント オーバーライド → グローバル デフォルト) を解決します

2. `exec.security` および `exec.ask` を解決します (優先順位は同じ)。
3. ホストが `sandbox` の場合は、ローカルのサンドボックス実行に進みます。
4. ホストが `gateway` または `node` の場合、そのホストに security + ask ポリシーを適用します。

## デフォルトの安全性

- デフォルトは `exec.host = sandbox` です。
- `gateway` および `node` のデフォルト `exec.security = deny`。
- デフォルト `exec.ask = on-miss` (セキュリティが許可する場合にのみ関係します)。
- ノード バインディングが設定されていない場合、**エージェントは任意のノードをターゲットにすることができます**。ただし、ポリシーで許可されている場合に限ります。

## 構成サーフェス

### ツールパラメータ

- `exec.host` (オプション): `sandbox | gateway | node`。
- `exec.security` (オプション): `deny | allowlist | full`。
- `exec.ask` (オプション): `off | on-miss | always`。
- `exec.node` (オプション): `host=node` の場合に使用するノード ID/名。

### 構成キー (グローバル)

- `tools.exec.host`
- `tools.exec.security`
- `tools.exec.ask`
- `tools.exec.node` (デフォルトのノードバインディング)

### 構成キー (エージェントごと)

- `agents.list[].tools.exec.host`
- `agents.list[].tools.exec.security`
- `agents.list[].tools.exec.ask`
- `agents.list[].tools.exec.node`

### エイリアス

- `/elevated on` = エージェント セッションの `tools.exec.host=gateway`、`tools.exec.security=full` を設定します。
- `/elevated off` = エージェント セッションの以前の実行設定を復元します。

## 承認ストア (JSON)

パス: `~/.openclaw/exec-approvals.json`

目的:- **実行ホスト** (ゲートウェイまたはノード ランナー) のローカル ポリシー + ホワイトリスト。

- 利用可能な UI がない場合はフォールバックを要求します。
- UI クライアントの IPC 資格情報。

提案されたスキーマ (v1):

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64-opaque-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny"
  },
  "agents": {
    "agent-id-1": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [
        {
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 0,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

注:

- 従来の許可リスト形式はありません。
- `askFallback` は、`ask` が必要で、UI にアクセスできない場合にのみ適用されます。
- ファイル権限: `0600`。

## ランナー サービス (ヘッドレス)

### 役割

- `exec.security` + `exec.ask` をローカルで適用します。
- システムコマンドを実行し、出力を返します。
- 実行ライフサイクルのブリッジ イベントを発行します (オプションですが推奨)。

### サービスのライフサイクル

- macOS で Launchd/daemon を実行します。 Linux/Windows 上のシステム サービス。
- 承認 JSON は実行ホストに対してローカルです。
- UI はローカル Unix ソケットをホストします。ランナーはオンデマンドで接続します。

## UI 統合 (macOS アプリ)

### IPC

- `~/.openclaw/exec-approvals.sock` (0600) の Unix ソケット。
- トークンは `exec-approvals.json` (0600) に保存されます。
- ピア チェック: 同じ UID のみ。
- チャレンジ/レスポンス: リプレイを防ぐための nonce + HMAC(トークン、リクエスト ハッシュ)。
- 短い TTL (例: 10 秒) + 最大ペイロード + レート制限。

### Ask フロー (macOS アプリ実行ホスト)

1. ノード サービスがゲートウェイから `system.run` を受信します。
2. ノード サービスはローカル ソケットに接続し、プロンプト/実行リクエストを送信します。
3. アプリはピア + トークン + HMAC + TTL を検証し、必要に応じてダイアログを表示します。
4. アプリは UI コンテキストでコマンドを実行し、出力を返します。
5. ノード サービスは出力をゲートウェイに返します。UI が見つからない場合:

- `askFallback` (`deny|allowlist|full`) を適用します。

### ダイアグラム (SCI)

```
Agent -> Gateway -> Bridge -> Node Service (TS)
                         |  IPC (UDS + token + HMAC + TTL)
                         v
                     Mac App (UI + TCC + system.run)
```

## ノード ID + バインディング

- ブリッジ ペアリングの既存の `nodeId` を使用します。
- バインディングモデル:
  - `tools.exec.node` は、エージェントを特定のノードに制限します。
  - 設定されていない場合、エージェントは任意のノードを選択できます (ポリシーは引き続きデフォルトを適用します)。
- ノード選択の解像度:
  - `nodeId` 完全一致
  - `displayName` (正規化)
  - `remoteIp`
  - `nodeId` プレフィックス (>= 6 文字)

## 総合馬術

### イベントを閲覧する人

- システム イベントは **セッションごと**であり、次のプロンプトでエージェントに表示されます。
- ゲートウェイのメモリ内キュー (`enqueueSystemEvent`) に保存されます。

### イベントテキスト

- `Exec started (node=<id>, id=<runId>)`
- `Exec finished (node=<id>, id=<runId>, code=<code>)` + オプションの出力テール
- `Exec denied (node=<id>, id=<runId>, <reason>)`

### 輸送

オプション A (推奨):

- ランナーはブリッジ `event` フレーム `exec.started` / `exec.finished` を送信します。
- ゲートウェイ `handleBridgeEvent` は、これらを `enqueueSystemEvent` にマップします。

オプション B:

- ゲートウェイ `exec` ツールは、ライフサイクルを直接処理します (同期のみ)。

## 実行フロー

### サンドボックスホスト

- 既存の `exec` 動作 (サンドボックス化されていない場合の Docker またはホスト)。
- PTY は非サンドボックス モードでのみサポートされます。

### ゲートウェイホスト

- ゲートウェイ プロセスは独自のマシン上で実行されます。
- ローカル `exec-approvals.json` (セキュリティ/アスク/許可リスト) を強制します。

### ノードホスト- ゲートウェイは `system.run` を使用して `node.invoke` を呼び出します

- ランナーはローカルの承認を強制します。
- ランナーは集約された stdout/stderr を返します。
- 開始/終了/拒否のオプションのブリッジ イベント。

## 出力キャップ

- 標準出力と標準エラー出力の合計を **200k** に制限します。イベント用に **テール 20,000** を維持します。
- 明確なサフィックスを付けて切り詰めます (例: `"… (truncated)"`)。

## スラッシュコマンド

- `/exec host=<sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`
- エージェントごと、セッションごとの上書き。設定経由で保存しない限り永続的ではありません。
- `/elevated on|off|ask|full` は `host=gateway security=full` のショートカットのままです (`full` は承認をスキップします)。

## クロスプラットフォームのストーリー

- ランナー サービスはポータブルな実行ターゲットです。
- UI はオプションです。欠落している場合は、`askFallback` が適用されます。
- Windows/Linux は、同じ承認 JSON + ソケット プロトコルをサポートします。

## 実装フェーズ

### フェーズ 1: config + exec ルーティング

- `exec.host`、`exec.security`、`exec.ask`、`exec.node` の構成スキーマを追加します。
- `exec.host` を尊重するようにツール配管を更新します。
- `/exec` スラッシュ コマンドを追加し、`/elevated` エイリアスを保持します。

### フェーズ 2: 承認ストア + ゲートウェイの適用

- `exec-approvals.json` リーダー/ライターを実装します。
- `gateway` ホストに許可リスト + 要求モードを適用します。
- 出力キャップを追加します。

### フェーズ 3: ノード ランナーの強制

- ノード ランナーを更新して、許可リストと確認を適用します。
- Unix ソケット プロンプト ブリッジを macOS アプリ UI に追加します。
- `askFallback` を配線します。

### フェーズ 4: イベント- 実行ライフサイクルのノード → ゲートウェイ ブリッジ イベントを追加します

- エージェント プロンプトの場合は `enqueueSystemEvent` にマップします。

### フェーズ 5: UI の改良

- Mac アプリ: ホワイトリスト エディター、エージェントごとのスイッチャー、ポリシー UI を尋ねます。
- ノード バインディング コントロール (オプション)。

## テスト計画

- 単体テスト: ホワイトリストのマッチング (グロブ + 大文字と小文字を区別しない)。
- 単体テスト: ポリシー解決の優先順位 (ツール パラメーター → エージェント オーバーライド → グローバル)。
- 統合テスト: ノード ランナーのフローの拒否/許可/要求。
- ブリッジ イベント テスト: ノード イベント → システム イベント ルーティング。

## 未解決のリスク

- UI の利用不可: `askFallback` が尊重されていることを確認します。
- 長時間実行されるコマンド: タイムアウト + 出力上限に依存します。
- マルチノードのあいまいさ: ノード バインディングまたは明示的なノード パラメータがない場合はエラー。

## 関連ドキュメント

- [実行ツール](/tools/exec)
- [幹部の承認](/tools/exec-approvals)
- [ノード](/nodes)
- [昇格モード](/tools/elevated)
