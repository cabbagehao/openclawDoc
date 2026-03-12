---
summary: "apply_patch ツールを使用して複数ファイルのパッチを適用する"
read_when:
  - 複数のファイルにわたって構造化されたファイル編集が必要である
  - パッチベースの編集を文書化またはデバッグしたい場合
title: "apply_patch ツール"
x-i18n:
  source_hash: "a1b251e8327228ff327eda8989626421edbe75cd1483acfc6a2f2fd31ed6cfc2"
---
構造化されたパッチ形式を使用してファイルの変更を適用します。これはマルチファイルに最適です
または、単一の `edit` 呼び出しが脆弱になるマルチハンク編集。

このツールは、1 つ以上のファイル操作をラップする単一の `input` 文字列を受け入れます。

```
*** Begin Patch
*** Add File: path/to/file.txt
+line 1
+line 2
*** Update File: src/app.ts
@@
-old line
+new line
*** Delete File: obsolete.txt
*** End Patch
```

## パラメータ

- `input` (必須): `*** Begin Patch` および `*** End Patch` を含む完全なパッチ コンテンツ。

## 注意事項

- パッチ パスは、(ワークスペース ディレクトリからの) 相対パスと絶対パスをサポートします。
- `tools.exec.applyPatch.workspaceOnly` のデフォルトは `true` (ワークスペースを含む) です。意図的に `apply_patch` をワークスペース ディレクトリの外に書き込み/削除する場合にのみ、これを `false` に設定します。
- ファイルの名前を変更するには、`*** Update File:` ハンク内で `*** Move to:` を使用します。
- `*** End of File` は、必要に応じて EOF のみの挿入をマークします。
- 実験的であり、デフォルトでは無効になっています。 `tools.exec.applyPatch.enabled` で有効にします。
- OpenAI のみ (OpenAI Codex を含む)。オプションでモデルごとにゲートします。
  `tools.exec.applyPatch.allowModels`。
- 構成は `tools.exec` の下にのみあります。

## 例

```json
{
  "tool": "apply_patch",
  "input": "*** Begin Patch\n*** Update File: src/index.ts\n@@\n-const foo = 1\n+const foo = 2\n*** End Patch"
}
```
