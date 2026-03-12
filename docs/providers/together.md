---
summary: "一緒に AI セットアップ (認証 + モデル選択)"
read_when:
  - Together AI と OpenClaw を使用したい
  - API キーの環境変数または CLI 認証の選択が必要です
title: "OpenClawでTogether AIを使う認証・モデル設定ガイド"
description: "Together AI を OpenClaw で使う設定ガイドです。API キー認証、OpenAI 互換 endpoint、対応モデルの選択方法を確認できます。"
x-i18n:
  source_hash: "4f2ba5a12b03d0140feba4f54e0540bb57237cd131c8f1d826bc3629fde2d111"
---
[Together AI](https://together.ai) は、統合 API を通じて、Llama、DeepSeek、Kimi などを含む主要なオープンソース モデルへのアクセスを提供します。

- プロバイダー: `together`
- 認証: `TOGETHER_API_KEY`
- API：OpenAI互換

## クイックスタート

1. API キーを設定します (推奨: ゲートウェイ用に保存します)。

```bash
openclaw onboard --auth-choice together-api-key
```

2. デフォルトのモデルを設定します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "together/moonshotai/Kimi-K2.5" },
    },
  },
}
```

## 非対話型の例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

これにより、`together/moonshotai/Kimi-K2.5` がデフォルトのモデルとして設定されます。

## 環境に関する注意事項

ゲートウェイがデーモン (launchd/systemd) として実行されている場合は、`TOGETHER_API_KEY` であることを確認してください。
そのプロセスで利用できます (たとえば、`~/.openclaw/.env` または経由)
`env.shellEnv`)。

## 利用可能なモデル

Together AI は、多くの人気のあるオープンソース モデルへのアクセスを提供します。

- **GLM 4.7 Fp8** - 200K コンテキスト ウィンドウを備えたデフォルト モデル
- **Llama 3.3 70B Instruct Turbo** - 高速で効率的な指示に従ってください
- **Llama 4 Scout** - 画像理解機能を備えた視覚モデル
- **ラマ 4 マーベリック** - 高度なビジョンと推論
- **DeepSeek V3.1** - 強力なコーディングおよび推論モデル
- **DeepSeek R1** - 高度な推論モデル
- **Kimi K2 Instruct** - 262K コンテキスト ウィンドウを備えた高性能モデル

すべてのモデルは標準のチャット補完をサポートし、OpenAI API と互換性があります。
