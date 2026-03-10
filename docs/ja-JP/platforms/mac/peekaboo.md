---
summary: "macOS UI 自動化のための PeekabooBridge の統合"
read_when:
  - OpenClaw.app で PeekabooBridge をホスティングする
  - Swift Package Managerを介したPeekabooの統合
  - PeekabooBridge プロトコル/パスの変更
title: "いないいないばあ橋"
x-i18n:
  source_hash: "b5b9ddb9a7c59e153a1d5d23c33616bb1542b5c7dadedc3af340aeee9ba03487"
---

# ピーカブーブリッジ (macOS UI オートメーション)

OpenClaw は、**PeekabooBridge** をローカルの権限認識型 UI オートメーションとしてホストできます
ブローカー。これにより、`peekaboo` CLI は、
macOS アプリの TCC 権限。

## これは何ですか (そしてそうではありません)

- **ホスト**: OpenClaw.app は PeekabooBridge ホストとして機能できます。
- **クライアント**: `peekaboo` CLI を使用します (個別の `openclaw ui ...` サーフェスはありません)。
- **UI**: ビジュアル オーバーレイは Peekaboo.app に残ります。 OpenClaw はシン ブローカー ホストです。

## ブリッジを有効にする

macOS アプリの場合:

- 設定 → **ピーカブーブリッジを有効にする**

有効にすると、OpenClaw はローカルの UNIX ソケット サーバーを起動します。無効にすると、ホストは
が停止され、`peekaboo` は他の利用可能なホストにフォールバックします。

## クライアントの検出順序

Peekaboo クライアントは通常、次の順序でホストを試行します。

1. Peekaboo.app (フル UX)
2. Claude.app (インストールされている場合)
3. OpenClaw.app (シンブローカー)

`peekaboo bridge status --verbose` を使用して、どのホストがアクティブであるかを確認します。
ソケットパスが使用中です。次のものでオーバーライドできます。

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは **発信者コードの署名**を検証します。 TeamID の許可リストは
  強制 (Peekaboo ホストの TeamID + OpenClaw アプリの TeamID)。
- リクエストは約 10 秒後にタイムアウトします。
- 必要な権限が不足している場合、ブリッジは明確なエラー メッセージを返します。
  システム設定を起動するのではなく、

## スナップショットの動作 (自動化)スナップショットはメモリに保存され、短い時間が経過すると自動的に期限切れになります

より長い保存期間が必要な場合は、クライアントから再取得してください。

## トラブルシューティング

- `peekaboo` が「ブリッジ クライアントが承認されていない」と報告した場合は、クライアントが承認されていることを確認してください。
  適切に署名されているか、`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` を使用してホストを実行しています
  **デバッグ** モードのみ。
- ホストが見つからない場合は、いずれかのホスト アプリ (Peekaboo.app または OpenClaw.app) を開きます。
  権限が付与されていることを確認します。
