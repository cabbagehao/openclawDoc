---
summary: "オンボーディングウィザードと構成スキーマに関する RPC プロトコルの仕様メモ"
read_when:
  - オンボーディングウィザードのステップや構成スキーマのエンドポイントを変更する場合
title: "OpenClawのオンボーディングと構成プロトコル の狙い・設計案・検証ポイント"
description: "目的: CLI、macOS アプリ、および Web UI の間で共有される、オンボーディングと構成（Config）操作のための共通プロトコルを定義すること。コンポーネント、ゲートウェイ RPC、UI ヒント (UI Hints)を確認できます。"
x-i18n:
  source_hash: "0e324d71e0e7df239f146c3e3a47acfa8ad92f2afbf4370d42c248d55fc926d7"
---
目的: CLI、macOS アプリ、および Web UI の間で共有される、オンボーディングと構成（Config）操作のための共通プロトコルを定義すること。

## コンポーネント

- ウィザードエンジン: 共有セッション、プロンプト、およびオンボーディング状態を管理します。
- CLI オンボーディング: UI クライアント（アプリ等）と同じウィザードフローを使用します。
- ゲートウェイ RPC: ウィザード操作および構成スキーマ取得用のエンドポイントを公開します。
- macOS オンボーディング: ウィザードのステップモデルを採用しています。
- Web UI: JSON スキーマと UI ヒント（UI Hints）を元に、構成設定用のフォームを自動生成します。

## ゲートウェイ RPC

- `wizard.start` パラメータ: `{ mode?: "local"|"remote", workspace?: string }`
- `wizard.next` パラメータ: `{ sessionId, answer?: { stepId, value? } }`
- `wizard.cancel` パラメータ: `{ sessionId }`
- `wizard.status` パラメータ: `{ sessionId }`
- `config.schema` パラメータ: `{}`
- `config.schema.lookup` パラメータ: `{ path }`
  - `path` は標準の構成セグメントに加え、スラッシュ区切りのプラグイン ID（例: `plugins.entries.pack/one.config`）を受け入れます。

レスポンスの構造:

- ウィザード: `{ sessionId, done, step?, status?, error? }`
- 構成スキーマ: `{ schema, uiHints, version, generatedAt }`
- スキーマ検索 (lookup): `{ path, schema, hint?, hintPath?, children[] }`

## UI ヒント (UI Hints)

- `uiHints` はパスをキーとした、オプションのメタデータ（`label`, `help`, `group`, `order`, `advanced`, `sensitive`, `placeholder`）です。
- `sensitive`（機密）フィールドは、UI 上ではパスワード入力としてレンダリングされます。伏せ字処理のレイヤーは別途存在しません。
- 未対応のスキーマノードは、生の JSON エディターにフォールバックして表示されます。

## 補足事項

- 本ドキュメントは、オンボーディングおよび構成に関するプロトコルのリファクタリング状況を一元管理するためのものです。
