---
summary: "macOS UI 自動化のための PeekabooBridge 統合"
read_when:
  - OpenClaw.app で PeekabooBridge をホストするとき
  - Swift Package Manager 経由で Peekaboo を統合するとき
  - PeekabooBridge のプロトコルやパスを変更するとき
title: "Peekaboo Bridge"
x-i18n:
  source_hash: "b5b9ddb9a7c59e153a1d5d23c33616bb1542b5c7dadedc3af340aeee9ba03487"
---
OpenClaw は、ローカルで動作する権限認識型の UI 自動化 broker として **PeekabooBridge** をホストできます。これにより、`peekaboo` CLI は macOS アプリ側の TCC 権限を再利用しながら UI 自動化を実行できます。

## これは何で、何ではないか

- **Host**: OpenClaw.app は PeekabooBridge のホストになれます。
- **Client**: 利用するのは `peekaboo` CLI であり、別個の `openclaw ui ...` インターフェースはありません。
- **UI**: 可視オーバーレイは Peekaboo.app 側に残り、OpenClaw は薄い broker host として振る舞います。

## ブリッジを有効にする

macOS アプリで次を有効にします。

- Settings → **Enable Peekaboo Bridge**

有効にすると、OpenClaw はローカルの UNIX ソケット サーバーを起動します。無効にするとホストは停止し、`peekaboo` は利用可能な別ホストへフォールバックします。

## クライアントの検出順序

Peekaboo クライアントは通常、次の順序でホストを探します。

1. Peekaboo.app（完全な UX を提供）
2. Claude.app（インストールされている場合）
3. OpenClaw.app（薄い broker）

どのホストがアクティブで、どのソケット パスが使われているかは `peekaboo bridge status --verbose` で確認できます。必要に応じて、次の環境変数で上書きできます。

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## セキュリティと権限

- ブリッジは **呼び出し元のコード署名** を検証します。許可される Team ID の allowlist を強制し、Peekaboo host の Team ID と OpenClaw app の Team ID を受け付けます。
- リクエストはおよそ 10 秒でタイムアウトします。
- 必要な権限が不足している場合、System Settings を勝手に開くのではなく、明確なエラー メッセージを返します。

## スナップショットの挙動（自動化）

スナップショットはメモリ上に保持され、短時間で自動的に失効します。より長く保持したい場合は、クライアント側で再取得してください。

## トラブルシューティング

- `peekaboo` が `bridge client is not authorized` と報告する場合は、クライアントが正しく署名されているか確認してください。`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` を使うのは **debug** モード限定にしてください。
- ホストが見つからない場合は、Peekaboo.app または OpenClaw.app を起動し、必要な権限が付与済みか確認してください。
