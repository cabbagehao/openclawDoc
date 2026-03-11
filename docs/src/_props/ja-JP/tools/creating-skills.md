---
title: "スキルの作成"
summary: "SKILL.md を使用してカスタム ワークスペース スキルを構築してテストする"
read_when:
  - ワークスペースで新しいカスタム スキルを作成しています
  - SKILL.md ベースのスキルのクイック スターター ワークフローが必要です
x-i18n:
  source_hash: "96de482d2a534b9220f2cea4130ce540cb732a13731764df9eb1748787f3acb8"
---

# カスタムスキルの作成 🛠

OpenClaw は、簡単に拡張できるように設計されています。 「スキル」は、アシスタントに新しい機能を追加する主な方法です。

## スキルとは何ですか?

スキルは、`SKILL.md` ファイル (LLM に指示とツール定義を提供する) と、オプションでいくつかのスクリプトまたはリソースを含むディレクトリです。

## ステップバイステップ: 最初のスキル

### 1. ディレクトリを作成する

スキルはワークスペース (通常は `~/.openclaw/workspace/skills/`) に存在します。スキル用の新しいフォルダーを作成します。

```bash
mkdir -p ~/.openclaw/workspace/skills/hello-world
```

### 2. `SKILL.md` を定義します

そのディレクトリに `SKILL.md` ファイルを作成します。このファイルは、メタデータに YAML フロントマッターを使用し、命令に Markdown を使用します。

```markdown
---
name: hello_world
description: A simple skill that says hello.
---

# Hello World Skill

When the user asks for a greeting, use the `echo` tool to say "Hello from your custom skill!".
```

### 3. ツールの追加 (オプション)

フロントマターでカスタム ツールを定義したり、既存のシステム ツール (`bash` や `browser` など) を使用するようにエージェントに指示したりできます。

### 4. OpenClaw を更新する

エージェントに「スキルを更新」するか、ゲートウェイを再起動するように依頼してください。 OpenClaw は新しいディレクトリを検出し、`SKILL.md` にインデックスを付けます。

## ベストプラクティス

* **簡潔にする**: AI になる方法ではなく、何をするかについてモデルに指示します。
* **安全第一**: スキルで `bash` を使用する場合は、信頼できないユーザー入力による任意のコマンド インジェクションがプロンプトで許可されていないことを確認してください。
* **ローカルでテスト**: `openclaw agent --message "use my new skill"` を使用してテストします。

## 共有スキル[ClawHub](https://clawhub.com) でスキルを参照して投稿することもできます
