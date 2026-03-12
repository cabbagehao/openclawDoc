---
summary: "ゲートウェイ + CLI 経由の投票送信"
read_when:
  - 投票サポートの追加または変更時
  - CLI やゲートウェイからの投票送信をデバッグする場合
title: "OpenClawの投票メッセージ機能の送信方法と対応チャネル設定ガイド"
description: "--channel: whatsapp（デフォルト）、telegram、discord、または msteams --poll-multi: 複数選択を許可。対応チャンネル、CLI、ゲートウェイ RPCを確認できます。"
x-i18n:
  source_path: "automation/poll.md"
  source_hash: "b2dfc8c649d24cfd3b2bf1c7af52709a34db87109b842cfdeda74ff74063ff3e"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T05:51:25.864Z"
---
## 対応チャンネル

- Telegram
- WhatsApp（Web チャンネル）
- Discord
- MS Teams（Adaptive Cards）

## CLI

```bash
# Telegram
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300

# WhatsApp
openclaw message poll --target +15555550123 \
  --poll-question "Lunch today?" --poll-option "Yes" --poll-option "No" --poll-option "Maybe"
openclaw message poll --target 123456789@g.us \
  --poll-question "Meeting time?" --poll-option "10am" --poll-option "2pm" --poll-option "4pm" --poll-multi

# Discord
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Snack?" --poll-option "Pizza" --poll-option "Sushi"
openclaw message poll --channel discord --target channel:123456789 \
  --poll-question "Plan?" --poll-option "A" --poll-option "B" --poll-duration-hours 48

# MS Teams
openclaw message poll --channel msteams --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" --poll-option "Pizza" --poll-option "Sushi"
```

オプション:

- `--channel`: `whatsapp`（デフォルト）、`telegram`、`discord`、または `msteams`
- `--poll-multi`: 複数選択を許可
- `--poll-duration-hours`: Discord 専用（省略時のデフォルトは 24）
- `--poll-duration-seconds`: Telegram 専用（5〜600 秒）
- `--poll-anonymous` / `--poll-public`: Telegram 専用の投票公開設定

## ゲートウェイ RPC

メソッド: `poll`

パラメータ:

- `to`（string、必須）
- `question`（string、必須）
- `options`（string[]、必須）
- `maxSelections`（number、任意）
- `durationHours`（number、任意）
- `durationSeconds`（number、任意、Telegram 専用）
- `isAnonymous`（boolean、任意、Telegram 専用）
- `channel`（string、任意、デフォルト: `whatsapp`）
- `idempotencyKey`（string、必須）

## チャンネルごとの違い

- Telegram: 選択肢は 2〜10 個。`threadId` または `:topic:` ターゲットによるフォーラムトピックに対応。`durationHours` の代わりに `durationSeconds` を使用し、5〜600 秒に制限される。匿名投票と公開投票に対応。
- WhatsApp: 選択肢は 2〜12 個。`maxSelections` は選択肢の数以内である必要がある。`durationHours` は無視される。
- Discord: 選択肢は 2〜10 個。`durationHours` は 1〜768 時間にクランプされる（デフォルト 24）。`maxSelections > 1` で複数選択が有効になる。Discord は厳密な選択数の制限に対応していない。
- MS Teams: Adaptive Card による投票（OpenClaw 管理）。ネイティブの投票 API はなく、`durationHours` は無視される。

## エージェントツール（Message）

`message` ツールの `poll` アクションを使用する（`to`、`pollQuestion`、`pollOption`、任意で `pollMulti`、`pollDurationHours`、`channel`）。

Telegram の場合、ツールは `pollDurationSeconds`、`pollAnonymous`、`pollPublic` も受け付ける。

投票作成には `action: "poll"` を使用する。`action: "send"` で投票フィールドを渡すと拒否される。

注意: Discord には「ちょうど N 個を選択」するモードがなく、`pollMulti` は複数選択にマッピングされる。
Teams の投票は Adaptive Cards としてレンダリングされ、投票を `~/.openclaw/msteams-polls.json` に記録するため、ゲートウェイがオンラインである必要があります。
