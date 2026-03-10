---
summary: "明示的な所有権、統一されたライフサイクル、決定論的なクリーンアップを備えた、信頼性の高い対話型プロセス監視 (PTY + 非 PTY) のための生産計画"
read_when:
  - 実行/プロセスのライフサイクルの所有権とクリーンアップに取り組む
  - PTY および非 PTY 監視動作のデバッグ
owner: "openclaw"
status: "in-progress"
last_updated: "2026-02-15"
title: "PTY およびプロセス監督計画"
x-i18n:
  source_hash: "cc45c8a9862d59261f3f3ef57a6a332f3b7691613bf338e1088c924c43dc103f"
---

# PTY およびプロセス監督計画

## 1. 問題と目標

以下の範囲で長時間コマンドを実行するには、信頼性の高い 1 つのライフサイクルが必要です。

- `exec` フォアグラウンド実行
- `exec` バックグラウンドで実行
- `process` フォローアップ アクション (`poll`、`log`、`send-keys`、`paste`、`submit`、`kill`、 `remove`)
- CLI エージェント ランナーのサブプロセス

目標は PTY をサポートすることだけではありません。目標は、ヒューリスティックに一致する危険なプロセスを排除した、予測可能な所有権、キャンセル、タイムアウト、クリーンアップです。

## 2. 範囲と境界

- `src/process/supervisor` の内部実装を維持します。
- これに対して新しいパッケージを作成しないでください。
- 実用的な場合は、現在の動作の互換性を維持します。
- ターミナルの再生や tmux スタイルのセッション永続化に範囲を広げないでください。

## 3. このブランチで実装されます

### スーパーバイザーのベースラインはすでに存在します

- スーパーバイザ モジュールは `src/process/supervisor/*` の下に配置されます。
- Exec ランタイムと CLI ランナーは、スーパーバイザの生成と待機を介してすでにルーティングされています。
- レジストリのファイナライゼーションは冪等です。

### このパスは完了しました

1. 明示的な PTY コマンド コントラクト- `SpawnInput` は、`src/process/supervisor/types.ts` の区別共用体になりました。

- PTY の実行には、汎用の `argv` を再利用するのではなく、`ptyCommand` が必要です。
- スーパーバイザーは、`src/process/supervisor/supervisor.ts` の argv 結合から PTY コマンド文字列を再構築しなくなりました。
- Exec ランタイムは `ptyCommand` を `src/agents/bash-tools.exec-runtime.ts` に直接渡すようになりました。

2. プロセス層タイプのデカップリング

- スーパーバイザー タイプは、エージェントから `SessionStdin` をインポートしなくなりました。
- プロセス ローカル stdin コントラクトは `src/process/supervisor/types.ts` (`ManagedRunStdin`) にあります。
- アダプターはプロセス レベルのタイプのみに依存するようになりました。
  - `src/process/supervisor/adapters/child.ts`
  - `src/process/supervisor/adapters/pty.ts`

3. プロセスツールのライフサイクルオーナーシップの向上

- `src/agents/bash-tools.process.ts` は、最初にスーパーバイザーを通じてキャンセルを要求するようになりました。
- `process kill/remove` では、スーパーバイザーの検索が失敗した場合にプロセス ツリーのフォールバック終了を使用するようになりました。
- `remove` は、終了が要求された直後に実行中のセッション エントリを削除することで、決定的な削除動作を維持します。

4. 単一ソース ウォッチドッグのデフォルト

- `src/agents/cli-watchdog-defaults.ts` に共有デフォルトを追加しました。
- `src/agents/cli-backends.ts` は共有デフォルトを使用します。
- `src/agents/cli-runner/reliability.ts` は同じ共有デフォルトを使用します。

5. 死んだヘルパーのクリーンアップ

- 未使用の `killSession` ヘルパー パスを `src/agents/bash-tools.shared.ts` から削除しました。

6. 直接スーパーバイザ パス テストを追加

- スーパーバイザのキャンセルによるルーティングの強制終了と削除をカバーする `src/agents/bash-tools.process.supervisor.test.ts` を追加しました。

7. 信頼性ギャップの修正が完了しました- `src/agents/bash-tools.process.ts` は、スーパーバイザーの検索が失敗した場合に、実際の OS レベルのプロセス終了にフォールバックするようになりました。

- `src/process/supervisor/adapters/child.ts` は、デフォルトのキャンセル/タイムアウト キル パスにプロセス ツリー終了セマンティクスを使用するようになりました。
- `src/process/kill-tree.ts` に共有プロセス ツリー ユーティリティを追加しました。

8. PTY契約のエッジケース補償を追加

- 逐語的な PTY コマンド転送と空のコマンド拒否のために `src/process/supervisor/supervisor.pty-command.test.ts` を追加しました。
- 子アダプターのキャンセルにおけるプロセス ツリーの強制終了動作に `src/process/supervisor/adapters/child.test.ts` を追加しました。

## 4. 残りのギャップと決定

### 信頼性ステータス

このパスに必要な 2 つの信頼性ギャップが解消されました。

- `process kill/remove` には、スーパーバイザ検索が失敗した場合の実際の OS 終了フォールバックが含まれるようになりました。
- 子のキャンセル/タイムアウトは、デフォルトの Kill パスにプロセス ツリーの Kill セマンティクスを使用するようになりました。
- 両方の動作に対して回帰テストが追加されました。

### 耐久性と起動時の調整

再起動動作は、メモリ内ライフサイクルのみとして明示的に定義されるようになりました。

- `reconcileOrphans()` は、仕様により `src/process/supervisor/supervisor.ts` においても no-op のままです。
- アクティブな実行はプロセスの再起動後に回復されません。
- この境界は、部分的な永続化のリスクを回避するために、この実装パスで意図的に設けられています。

### 保守性のフォローアップ

1. `src/agents/bash-tools.exec-runtime.ts` の `runExecProcess` は引き続き複数の責任を処理し、フォローアップでは焦点を絞ったヘルパーに分割できます。

## 5. 実施計画必要な信頼性と契約項目の実装パスが完了しました

完了:

- `process kill/remove` フォールバック実際の終了
- 子アダプタのデフォルトのkillパスのプロセスツリーのキャンセル
- フォールバックキルおよび子アダプタキルパスの回帰テスト
- 明示的な `ptyCommand` に基づく PTY コマンドのエッジケース テスト
- `reconcileOrphans()` の明示的なメモリ内再起動境界は設計により no-op です

オプションのフォローアップ:

- `runExecProcess` を動作ドリフトのない焦点を絞ったヘルパーに分割します

## 6. ファイルマップ

### プロセススーパーバイザー

- `src/process/supervisor/types.ts` は、判別されたスポーン入力とプロセスのローカル stdin コントラクトで更新されました。
- 明示的な `ptyCommand` を使用するように `src/process/supervisor/supervisor.ts` が更新されました。
- `src/process/supervisor/adapters/child.ts` および `src/process/supervisor/adapters/pty.ts` はエージェント タイプから分離されました。
- `src/process/supervisor/registry.ts` べき等ファイナライズは変更されずに保持されます。

### 実行とプロセスの統合

- `src/agents/bash-tools.exec-runtime.ts` は、PTY コマンドを明示的に渡し、フォールバック パスを維持するように更新されました。
- `src/agents/bash-tools.process.ts` は、実際のプロセス ツリーのフォールバック終了でスーパーバイザ経由でキャンセルするように更新されました。
- `src/agents/bash-tools.shared.ts` は、直接 Kill ヘルパー パスを削除しました。

### CLI の信頼性

- `src/agents/cli-watchdog-defaults.ts` が共有ベースラインとして追加されました。
- `src/agents/cli-backends.ts` と `src/agents/cli-runner/reliability.ts` は同じデフォルトを使用するようになりました。

## 7. このパスでの検証の実行

単体テスト:- `pnpm vitest src/process/supervisor/registry.test.ts`

- `pnpm vitest src/process/supervisor/supervisor.test.ts`
- `pnpm vitest src/process/supervisor/supervisor.pty-command.test.ts`
- `pnpm vitest src/process/supervisor/adapters/child.test.ts`
- `pnpm vitest src/agents/cli-backends.test.ts`
- `pnpm vitest src/agents/bash-tools.exec.pty-cleanup.test.ts`
- `pnpm vitest src/agents/bash-tools.process.poll-timeout.test.ts`
- `pnpm vitest src/agents/bash-tools.process.supervisor.test.ts`
- `pnpm vitest src/process/exec.test.ts`

E2E のターゲット:

- `pnpm vitest src/agents/cli-runner.test.ts`
- `pnpm vitest run src/agents/bash-tools.exec.pty-fallback.test.ts src/agents/bash-tools.exec.background-abort.test.ts src/agents/bash-tools.process.send-keys.test.ts`

タイプチェックのメモ:

- このリポジトリでは `pnpm build` (および完全な lint/docs ゲートには `pnpm check`) を使用します。 `pnpm tsgo` について言及している古いメモは廃止されました。

## 8. 動作保証は維持されます

- Exec env の強化動作は変更されていません。
- 承認と許可リストのフローは変更されません。
- 出力のサニタイズと出力キャップは変更されません。
- PTY アダプターは、強制終了およびリスナー破棄時の待機解決を引き続き保証します。

## 9. 完了の定義

1. スーパーバイザーは、管理された実行のライフサイクル所有者です。
2. PTY スポーンは、argv 再構築を行わない明示的なコマンド コントラクトを使用します。
3. プロセス層には、スーパーバイザ標準入力コントラクトのエージェント層に対するタイプの依存関係がありません。
4. ウォッチドッグのデフォルトは単一ソースです。
5. 対象の単体テストと e2e テストは緑色のままです。
6. 再起動耐久性の境界が明示的に文書化されているか、完全に実装されています。

## 10. まとめ

ブランチは現在、一貫性のあるより安全な監視形状を持っています。- 明示的なPTY契約

- よりクリーンなプロセスの階層化
- プロセス操作のスーパーバイザ主導のキャンセル パス
- スーパーバイザ検索が失敗した場合の実際のフォールバック終了
- 子実行のデフォルトのkillパスのプロセスツリーのキャンセル
- 統合されたウォッチドッグのデフォルト
- 明示的なメモリ内再起動境界 (このパスでは再起動間で孤立した調整は行われません)
