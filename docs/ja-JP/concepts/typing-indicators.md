---
summary: "OpenClaw がタイピング インジケーターを表示する場合とその調整方法"
read_when:
  - 入力インジケーターの動作またはデフォルトの変更
title: "タイピングインジケーター"
x-i18n:
  source_hash: "8ee82d02829c4ff58462be8bf5bb52f23f519aeda816c2fd8a583e7a317a2e98"
---

# タイピングインジケーター

タイピング インジケーターは、実行がアクティブな間、チャット チャネルに送信されます。使用する
`agents.defaults.typingMode` は入力開始**時期**を制御し、`typingIntervalSeconds`
**更新の頻度**を制御します。

## デフォルト

`agents.defaults.typingMode` が **未設定** の場合、OpenClaw は従来の動作を維持します。

- **直接チャット**: モデルループが始まるとすぐに入力が始まります。
- **メンション付きのグループ チャット**: すぐに入力が始まります。
- **メンションなしのグループ チャット**: メッセージ テキストのストリーミングが開始された場合にのみ入力が開始されます。
- **ハートビートが実行されます**: 入力は無効になります。

## モード

`agents.defaults.typingMode` を次のいずれかに設定します。

- `never` — タイピングインジケーターはありません。
- `instant` — 実行が開始されても、**モデル ループが開始したらすぐに** 入力を開始します。
  その後、サイレント応答トークンのみが返されます。
- `thinking` — **最初の推論デルタ** の入力を開始します (必須
  実行には `reasoningLevel: "stream"`)。
- `message` — **最初の非サイレント テキスト デルタ** から入力を開始します (無視します)
  `NO_REPLY` サイレント トークン)。

「どれくらい早く点火するか」の順序:
`never` → `message` → `thinking` → `instant`

## 構成

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

セッションごとにモードまたはケイデンスをオーバーライドできます。

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事項- `message` モードでは、サイレントのみの返信の入力は表示されません (例: `NO_REPLY`

出力を抑制するために使用されるトークン)。

- `thinking` は、実行ストリーム推論 (`reasoningLevel: "stream"`) の場合にのみ起動されます。
  モデルが推論デルタを生成しない場合、入力は開始されません。
- モードに関係なく、ハートビートにはタイピングが表示されません。
- `typingIntervalSeconds` は、開始時間ではなく、**更新頻度**を制御します。
  デフォルトは 6 秒です。
