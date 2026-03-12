---
summary: "macOS 上の OpenClaw のメニューバー アイコン状態とアニメーション"
read_when:
  - メニュー バー アイコンの動作を変更するとき
title: "OpenClawのmacOS メニュー バー アイコン の仕組み・設定手順・運用ガイド"
description: "Author: steipete · Updated: 2025-12-06 · Scope: macOS app (apps/macos) Wiring points。"
x-i18n:
  source_hash: "a67a6e6bbdc2b611ba365d3be3dd83f9e24025d02366bc35ffcce9f0b121872b"
---
Author: steipete · Updated: 2025-12-06 · Scope: macOS app (`apps/macos`)

- **Idle:** 通常時のアイコン アニメーションです。まばたきを行い、ときどき軽く揺れます。
- **Paused:** ステータス項目は `appearsDisabled` を使い、動きは停止します。
- **Voice trigger（big ears）:** ウェイク ワードを検出すると、音声ウェイク検出器が `AppState.triggerVoiceEars(ttl: nil)` を呼び出します。発話を取り込んでいる間は `earBoostActive=true` を維持し、耳は 1.9 倍に拡大され、視認性向上のため `earHoles` が有効になります。1 秒間無音が続くと `stopVoiceEars()` により元へ戻ります。この挙動はアプリ内の音声パイプラインからのみ発火します。
- **Working（agent running）:** `AppState.isWorking=true` により、しっぽと脚が慌ただしく動くマイクロアニメーションが有効になります。処理中は脚の揺れが速くなり、位置もわずかに変化します。現在は WebChat のエージェント実行に合わせて切り替えており、他の長時間タスクでも同じトグルを追加してください。

Wiring points

- Voice wake: runtime / tester は、トリガー時に `AppState.triggerVoiceEars(ttl: nil)` を呼び出し、キャプチャ ウィンドウに合わせて 1 秒の無音後に `stopVoiceEars()` を呼び出します。
- Agent activity: 作業区間の前後で `AppStateStore.shared.setWorking(true/false)` を設定します。これは WebChat のエージェント呼び出しではすでに実装されています。アニメーションが戻らなくなるのを防ぐため、区間は短く保ち、`defer` ブロックで必ず解除してください。

Shapes & sizes

- ベース アイコンは `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` で描画されます。
- 耳のスケール既定値は `1.0` です。音声ブースト時はフレーム全体の大きさを変えずに `earScale=1.9` と `earHoles=true` を設定します。テンプレート画像は 18×18 pt で、36×36 px の Retina バッキング ストアへ描画されます。
- Scurry では脚の揺れが最大でおよそ 1.0 まで増え、水平方向の小さな揺れも加わります。これは既存の Idle アニメーションに加算されます。

Behavioral notes

- 耳や作業中アニメーションを外部 CLI や broker から切り替える仕組みはありません。意図しない過剰な切り替えを避けるため、アプリ内部のシグナルだけで制御してください。
- ジョブがハングした場合でもアイコンが速やかに通常状態へ戻るよう、TTL は短く保ってください（10 秒未満）。
