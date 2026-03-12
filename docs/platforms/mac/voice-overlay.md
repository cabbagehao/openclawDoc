---
summary: "ウェイクワードとプッシュトゥトークが重複する場合の音声オーバーレイのライフサイクル"
read_when:
  - 音声オーバーレイの挙動を調整するとき
title: "音声オーバーレイ"
seoTitle: "OpenClawのmacOS 音声オーバーレイ の仕組み・設定手順・運用ガイド"
description: "対象読者は macOS アプリのコントリビューターです。目的は、ウェイクワードとプッシュトゥトークが重なった場合でも、音声オーバーレイの挙動を予測可能に保つことです。"
x-i18n:
  source_hash: "1efcc26ec05d2f421cb2cf462077d002381995b338d00db77d5fdba9b8d938b6"
---
対象読者は macOS アプリのコントリビューターです。目的は、ウェイクワードとプッシュトゥトークが重なった場合でも、音声オーバーレイの挙動を予測可能に保つことです。

## 現在の意図

- オーバーレイがウェイクワードで既に表示されている状態でユーザーがホットキーを押した場合、ホットキー セッションは既存テキストをリセットせず、その内容を引き継ぎます。ホットキーを押している間はオーバーレイを維持し、キーを離したときに、トリミング後のテキストがあれば送信し、なければ閉じます。
- ウェイクワード単体では無音時に自動送信し、プッシュトゥトークはキーを離した時点で即送信します。

## 実装済み (2025-12-09)

- オーバーレイ セッションは、各キャプチャ (ウェイクワードまたはプッシュトゥトーク) ごとにトークンを持つようになりました。トークンが一致しない partial / final / send / dismiss / level の更新は破棄されるため、古いコールバックが残って誤動作するのを防げます。
- プッシュトゥトークは、表示中のオーバーレイ テキストを prefix として引き継ぎます。つまり、ウェイク オーバーレイが表示されている間にホットキーを押すと、既存テキストを保持したまま新しい発話を追加できます。最終 transcript を待つ時間は最大 1.5 秒で、それを過ぎた場合は現在のテキストへフォールバックします。
- chime / overlay のログは、`voicewake.overlay`、`voicewake.ptt`、`voicewake.chime` の各 category で `info` レベル出力されます。対象は session start、partial、final、send、dismiss、chime reason です。

## 次のステップ

1. **VoiceSessionCoordinator (actor)**
   - 常に 1 つの `VoiceSession` だけを管理します。
   - API はトークン ベースで、`beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown` を提供します。
   - 古いトークンを伴うコールバックは破棄し、古い recognizer がオーバーレイを再表示するのを防ぎます。
2. **VoiceSession (model)**
   - `token`、`source` (`wakeWord|pushToTalk`)、確定 / 未確定テキスト、chime flags、timer (auto-send、idle)、`overlayMode` (`display|editing|sending`)、cooldown deadline を持ちます。
3. **オーバーレイの binding**
   - `VoiceSessionPublisher` (`ObservableObject`) が active session を SwiftUI へ反映します。
   - `VoiceWakeOverlayView` は publisher 経由でのみ描画し、global singleton を直接変更しません。
   - オーバーレイのユーザー操作 (`sendNow`、`dismiss`、`edit`) は、session token とともに coordinator へ戻します。
4. **統一された送信パス**
   - `endCapture` 時に、トリミング後のテキストが空なら dismiss し、そうでなければ `performSend(session:)` を呼びます。ここで send chime を 1 回だけ鳴らし、転送後に閉じます。
   - プッシュトゥトークでは遅延なし、ウェイクワードでは auto-send 用の任意の遅延を許可します。
   - プッシュトゥトーク完了後は、ウェイク runtime に短い cooldown を適用し、ウェイクワードが直後に再トリガーされないようにします。
5. **ロギング**
   - coordinator は subsystem `ai.openclaw`、category `voicewake.overlay` と `voicewake.chime` に `.info` ログを出力します。
   - 主なイベントは `session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown` です。

## デバッグ チェックリスト

- オーバーレイが張り付く問題を再現しながら、次のログを流します。

  ```bash
  sudo log stream --predicate 'subsystem == "ai.openclaw" AND category CONTAINS "voicewake"' --level info --style compact
  ```

- active な session token が 1 つしか存在しないことを確認します。古いコールバックは coordinator により破棄されるはずです。
- プッシュトゥトークを離したとき、常に active token を使って `endCapture` が呼ばれていることを確認します。テキストが空なら、chime も送信も行わず `dismiss` になるのが期待動作です。

## 移行手順 (推奨)

1. `VoiceSessionCoordinator`、`VoiceSession`、`VoiceSessionPublisher` を追加します。
2. `VoiceWakeRuntime` をリファクタリングし、`VoiceWakeOverlayController` を直接操作せずに session を作成 / 更新 / 終了するようにします。
3. `VoicePushToTalk` をリファクタリングし、既存 session を引き継ぎ、キーを離したときに `endCapture` を呼ぶようにします。あわせて runtime cooldown も適用します。
4. `VoiceWakeOverlayController` を publisher に接続し、runtime / PTT からの直接呼び出しを取り除きます。
5. session adoption、cooldown、空テキスト時の dismiss を対象とした統合テストを追加します。
