---
summary: "明示的な所有権、統一されたライフサイクル、決定論的なクリーンアップを備えた、信頼性の高い対話型プロセス監視（PTY + 非 PTY）の実装計画"
read_when:
  - exec / process のライフサイクル所有権とクリーンアップを扱うとき
  - PTY および非 PTY の監視挙動をデバッグするとき
owner: "openclaw"
status: "in-progress"
last_updated: "2026-02-15"
title: "PTY とプロセス監視の計画"
x-i18n:
  source_hash: "cc45c8a9862d59261f3f3ef57a6a332f3b7691613bf338e1088c924c43dc103f"
---

# PTY とプロセス監視の計画

## 1. 問題と目標

次の長時間コマンド実行をまたいで、単一で信頼できるライフサイクルが必要です。

* `exec` のフォアグラウンド実行
* `exec` のバックグラウンド実行
* `process` の後続アクション（`poll`、`log`、`send-keys`、`paste`、`submit`、`kill`、`remove`）
* CLI エージェントランナーのサブプロセス

目標は単に PTY をサポートすることではありません。危険なプロセス照合ヒューリスティクスに頼らず、所有権、キャンセル、タイムアウト、クリーンアップを予測可能にすることが目的です。

## 2. スコープと境界

* 実装は `src/process/supervisor` 内部に閉じる
* このために新しい package は作らない
* 実用上可能な範囲で現行挙動との互換性を維持する
* terminal replay や tmux 風の session 永続化までスコープを広げない

## 3. このブランチで実装済みの内容

### すでに存在する supervisor の基盤

* supervisor モジュールは `src/process/supervisor/*` に配置済み
* exec runtime と CLI runner は、すでに supervisor の spawn / wait を経由する構成になっている
* registry の finalize は冪等である

### この実装パスで完了した項目

1. 明示的な PTY コマンド契約

* `SpawnInput` は `src/process/supervisor/types.ts` で判別共用体になった
* PTY 実行では汎用 `argv` の再利用ではなく `ptyCommand` を必須とした
* supervisor は `src/process/supervisor/supervisor.ts` で `argv` の join から PTY コマンド文字列を再構築しなくなった
* exec runtime は `src/agents/bash-tools.exec-runtime.ts` から `ptyCommand` を直接渡すようになった

2. process 層の型の分離

* supervisor の型は agent 層から `SessionStdin` を import しなくなった
* process ローカルの stdin 契約は `src/process/supervisor/types.ts` の `ManagedRunStdin` に置かれた
* adapter は process 層の型だけに依存するようになった
  * `src/process/supervisor/adapters/child.ts`
  * `src/process/supervisor/adapters/pty.ts`

3. process ツールのライフサイクル所有権の改善

* `src/agents/bash-tools.process.ts` は、まず supervisor 経由で cancel を要求するようになった
* `process kill/remove` は、supervisor lookup に失敗した場合に process-tree ベースのフォールバック終了を使うようになった
* `remove` は、終了要求を出した直後に実行中 session entry を削除することで、決定的な remove 動作を維持している

4. watchdog デフォルトの単一ソース化

* `src/agents/cli-watchdog-defaults.ts` に共有デフォルトを追加した
* `src/agents/cli-backends.ts` はその共有デフォルトを利用するようになった
* `src/agents/cli-runner/reliability.ts` も同じ共有デフォルトを利用するようになった

5. 死んだ helper の削除

* 未使用の `killSession` helper 経路を `src/agents/bash-tools.shared.ts` から削除した

6. supervisor 直結経路のテスト追加

* supervisor cancel を経由した kill / remove のルーティングを確認する `src/agents/bash-tools.process.supervisor.test.ts` を追加した

7. 信頼性ギャップの修正完了

* `src/agents/bash-tools.process.ts` は、supervisor lookup に失敗したとき OS レベルの実プロセス終了へフォールバックするようになった
* `src/process/supervisor/adapters/child.ts` は、標準の cancel / timeout kill 経路で process-tree 終了セマンティクスを使うようになった
* 共通の process-tree utility を `src/process/kill-tree.ts` に追加した

8. PTY 契約のエッジケース検証を追加

* `src/process/supervisor/supervisor.pty-command.test.ts` を追加し、PTY コマンドのそのまま転送と空コマンド拒否を検証した
* `src/process/supervisor/adapters/child.test.ts` を追加し、child adapter cancel 時の process-tree kill 挙動を検証した

## 4. 残るギャップと判断

### 信頼性の状態

この実装パスで必須だった 2 つの信頼性ギャップは解消済みです。

* `process kill/remove` には、supervisor lookup miss 時の実プロセス終了フォールバックが入った
* child cancel / timeout は、標準 kill 経路で process-tree kill を使うようになった
* 両挙動に対する回帰テストも追加済み

### 永続性と起動時の整合

再起動時の挙動は、明示的に「メモリ内ライフサイクルのみ」と定義されました。

* `reconcileOrphans()` は `src/process/supervisor/supervisor.ts` で設計上 no-op のまま維持する
* プロセス再起動後に active run は復元しない
* この境界は、中途半端な永続化によるリスクを避けるため、この実装パスでは意図的に残している

### 保守性のフォローアップ

1. `src/agents/bash-tools.exec-runtime.ts` の `runExecProcess` は依然として複数責務を持っており、後続で責務ごとの helper に分割できる

## 5. 実装計画

必須だった信頼性項目と契約項目の実装は完了しています。

完了済み:

* `process kill/remove` のフォールバック実終了
* child adapter の標準 kill 経路における process-tree cancel
* フォールバック kill と child adapter kill 経路の回帰テスト
* 明示的な `ptyCommand` に基づく PTY コマンドのエッジケーステスト
* `reconcileOrphans()` を no-op とする、明示的なメモリ内再起動境界

任意の後続作業:

* `runExecProcess` を、挙動を変えずに責務別 helper へ分割する

## 6. ファイルマップ

### process supervisor

* `src/process/supervisor/types.ts` は、判別された spawn input と process ローカル stdin 契約を持つよう更新された
* `src/process/supervisor/supervisor.ts` は、明示的な `ptyCommand` を使うよう更新された
* `src/process/supervisor/adapters/child.ts` と `src/process/supervisor/adapters/pty.ts` は、agent 層の型から切り離された
* `src/process/supervisor/registry.ts` の冪等 finalize は変更せず維持した

### exec と process の統合

* `src/agents/bash-tools.exec-runtime.ts` は、PTY コマンドを明示的に渡しつつフォールバック経路を維持するよう更新された
* `src/agents/bash-tools.process.ts` は、supervisor 経由の cancel と、必要時の実 process-tree 終了フォールバックを使うよう更新された
* `src/agents/bash-tools.shared.ts` から直接 kill helper 経路を削除した

### CLI の信頼性

* `src/agents/cli-watchdog-defaults.ts` を共有ベースラインとして追加した
* `src/agents/cli-backends.ts` と `src/agents/cli-runner/reliability.ts` は同じデフォルト値を参照するようになった

## 7. この実装パスでの検証

単体テスト:

* `pnpm vitest src/process/supervisor/registry.test.ts`
* `pnpm vitest src/process/supervisor/supervisor.test.ts`
* `pnpm vitest src/process/supervisor/supervisor.pty-command.test.ts`
* `pnpm vitest src/process/supervisor/adapters/child.test.ts`
* `pnpm vitest src/agents/cli-backends.test.ts`
* `pnpm vitest src/agents/bash-tools.exec.pty-cleanup.test.ts`
* `pnpm vitest src/agents/bash-tools.process.poll-timeout.test.ts`
* `pnpm vitest src/agents/bash-tools.process.supervisor.test.ts`
* `pnpm vitest src/process/exec.test.ts`

E2E 対象:

* `pnpm vitest src/agents/cli-runner.test.ts`
* `pnpm vitest run src/agents/bash-tools.exec.pty-fallback.test.ts src/agents/bash-tools.exec.background-abort.test.ts src/agents/bash-tools.process.send-keys.test.ts`

型チェックに関する注意:

* このリポジトリでは `pnpm build` を使います。lint / docs を含む完全なゲートには `pnpm check` を使ってください
* `pnpm tsgo` に言及している古いメモは廃止済みです

## 8. 維持される運用保証

* exec env の hardening 挙動は変わらない
* 承認と allowlist のフローは変わらない
* 出力のサニタイズと出力上限は変わらない
* PTY adapter は、強制 kill 時の wait 完了と listener 解放を引き続き保証する

## 9. 完了の定義

1. supervisor が managed run のライフサイクル所有者であること
2. PTY spawn が、`argv` 再構築を行わない明示的なコマンド契約を使うこと
3. process 層が、supervisor stdin 契約に関して agent 層へ型依存しないこと
4. watchdog デフォルトが単一ソースであること
5. 対象の unit / e2e テストが green を維持すること
6. 再起動時の永続性境界が明示的に文書化されているか、完全に実装されていること

## 10. まとめ

このブランチの監視構成は、より一貫性があり安全な形になっています。

* 明示的な PTY 契約
* より整理された process layering
* process 操作に対する supervisor 主導の cancel 経路
* supervisor lookup miss 時の実フォールバック終了
* child run の標準 kill 経路における process-tree cancel
* 単一化された watchdog デフォルト
* 明示的なメモリ内再起動境界（この実装パスでは、再起動をまたぐ orphan reconcile は行わない）
