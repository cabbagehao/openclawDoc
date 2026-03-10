---
summary: "オンボーディング ウィザードと構成スキーマに関する RPC プロトコルのメモ"
read_when: "Changing onboarding wizard steps or config schema endpoints"
title: "オンボーディングと構成プロトコル"
x-i18n:
  source_hash: "0e324d71e0e7df239f146c3e3a47acfa8ad92f2afbf4370d42c248d55fc926d7"
---

# オンボーディング + 構成プロトコル

目的: CLI、macOS アプリ、Web UI にわたる共有オンボーディング + 構成サーフェス。

## コンポーネント

- ウィザード エンジン (共有セッション + プロンプト + オンボーディング状態)。
- CLI オンボーディングでは、UI クライアントと同じウィザード フローを使用します。
- ゲートウェイ RPC は、ウィザード + 構成スキーマ エンドポイントを公開します。
- macOS のオンボーディングでは、ウィザード ステップ モデルが使用されます。
- Web UI は、JSON スキーマ + UI ヒントから構成フォームをレンダリングします。

## ゲートウェイ RPC

- `wizard.start` パラメータ: `{ mode?: "local"|"remote", workspace?: string }`
- `wizard.next` パラメータ: `{ sessionId, answer?: { stepId, value? } }`
- `wizard.cancel` パラメータ: `{ sessionId }`
- `wizard.status` パラメータ: `{ sessionId }`
- `config.schema` パラメータ: `{}`
- `config.schema.lookup` パラメータ: `{ path }`
  - `path` は、標準の構成セグメントとスラッシュで区切られたプラグイン ID (`plugins.entries.pack/one.config` など) を受け入れます。

応答（形状）

- ウィザード: `{ sessionId, done, step?, status?, error? }`
- 構成スキーマ: `{ schema, uiHints, version, generatedAt }`
- 構成スキーマのルックアップ: `{ path, schema, hint?, hintPath?, children[] }`

## UI ヒント

- `uiHints` パスによってキー指定されます。オプションのメタデータ (label/help/group/order/advanced/sensitive/placeholder)。
- 機密フィールドはパスワード入力として表示されます。墨消しレイヤーはありません。
- サポートされていないスキーマ ノードは、生の JSON エディターにフォールバックします。

## 注意事項

- このドキュメントは、オンボーディング/構成のプロトコル リファクタリングを追跡するための単一の場所です。
