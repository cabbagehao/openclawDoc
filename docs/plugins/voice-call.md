---
summary: "音声通話プラグイン: Twilio / Telnyx / Plivo 経由の発信・着信通話（インストール、設定、CLI）"
read_when:
  - OpenClaw から音声通話を発信したいとき
  - voice-call プラグインを設定または開発しているとき
title: "音声通話プラグイン"
seoTitle: "OpenClawの音声通話プラグインの設定方法と活用シーンガイド"
description: "このプラグインは、OpenClaw に音声通話機能を追加します。発信通知と、着信ポリシーを伴う複数ターンの会話をサポートします。全体の流れは次のとおりです。実行場所（local / remote）、インストール、Option A: npm。"
x-i18n:
  source_hash: "5417fbfcdca2ed10a1e478715604cdc4e9fdace2fa0d50924e6a1da58d604444"
---
このプラグインは、OpenClaw に音声通話機能を追加します。発信通知と、着信ポリシーを伴う複数ターンの会話をサポートします。

現在利用できる provider:

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（開発用 / ネットワーク不要）

全体の流れは次のとおりです。

- plugin をインストールする
- ゲートウェイを再起動する
- `plugins.entries.voice-call.config` に設定を書く
- `openclaw voicecall ...` または `voice_call` ツールを使う

## 実行場所（local / remote）

Voice Call plugin は **ゲートウェイ プロセス内** で動作します。

remote ゲートウェイを使う場合は、**ゲートウェイが動作しているマシン** にインストールと設定を行い、その後ゲートウェイを再起動して読み込ませてください。

## インストール

### Option A: npm からインストールする（推奨）

```bash
openclaw plugins install @openclaw/voice-call
```

その後、ゲートウェイを再起動してください。

### Option B: ローカル フォルダーからインストールする（開発向け、コピーなし）

```bash
openclaw plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

その後、ゲートウェイを再起動してください。

## 設定

設定は `plugins.entries.voice-call.config` 配下に置きます。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            streamPath: "/voice/stream",
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

注意:

- Twilio / Telnyx では、**public に到達可能な** webhook URL が必要です。
- Plivo でも、**public に到達可能な** webhook URL が必要です。
- `mock` はローカル開発用 provider で、ネットワーク呼び出しを行いません。
- Telnyx では、`skipSignatureVerification` が true でない限り、`telnyx.publicKey`（または `TELNYX_PUBLIC_KEY`）が必要です。
- `skipSignatureVerification` はローカル テスト専用です。
- ngrok の無料プランを使う場合は、`publicUrl` に実際の ngrok URL を正確に設定してください。署名検証は常に有効です。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` かつ `serve.bind` が loopback（ngrok local agent）の場合に限り、無効な署名を持つ Twilio webhook を許可します。ローカル開発専用です。
- ngrok の無料 URL は変わる場合があり、interstitial が入ることもあります。`publicUrl` がずれると Twilio の署名検証は失敗します。本番では安定した独自ドメインか Tailscale funnel を推奨します。
- streaming セキュリティの既定値:
  - `streaming.preStartTimeoutMs` は、有効な `start` frame を送らない socket を閉じます。
  - `streaming.maxPendingConnections` は、未認証の pre-start socket 総数を制限します。
  - `streaming.maxPendingConnectionsPerIp` は、送信元 IP ごとの未認証 pre-start socket 数を制限します。
  - `streaming.maxConnections` は、開いている media stream socket の総数（pending + active）を制限します。

## Stale call reaper

`staleCallReaperSeconds` を使うと、終端 webhook を受け取らない通話を終了できます。たとえば、完了しない notify-mode の通話が対象です。既定値は `0`（無効）です。

推奨レンジ:

- **本番:** notify 系フローなら `120`〜`300` 秒
- 正常な通話を途中で刈り取らないよう、この値は **`maxDurationSeconds` より大きく** 設定してください。目安は `maxDurationSeconds + 30〜60` 秒です。

例:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook Security

proxy や tunnel がゲートウェイの前段にある場合、plugin は署名検証のために public URL を再構築します。ここでは、どの forwarded header を信頼するかを制御します。

`webhookSecurity.allowedHosts` は、forwarding header 由来の host を allowlist します。

`webhookSecurity.trustForwardingHeaders` は、allowlist なしで forwarded header を信頼します。

`webhookSecurity.trustedProxyIPs` は、request の remote IP が一致した場合にのみ forwarded header を信頼します。

Webhook replay protection は Twilio と Plivo で有効です。正しい署名を持つ replay 済み webhook は受理されますが、副作用処理はスキップされます。

Twilio の会話ターンでは、`<Gather>` callback にターンごとのトークンを含めるため、古い / replay 済みの音声 callback が、新しい待機中 transcript turn を満たすことはありません。

安定した public host を使う例:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## 通話時の TTS

Voice Call は、コアの `messages.tts` 設定（OpenAI または ElevenLabs）を使って通話中の音声ストリーミングを行います。plugin 側で **同じ構造** のまま上書きでき、その内容は `messages.tts` と deep-merge されます。

```json5
{
  tts: {
    provider: "elevenlabs",
    elevenlabs: {
      voiceId: "pMsXgVXv3BLzUgSXRplE",
      modelId: "eleven_multilingual_v2",
    },
  },
}
```

注意:

- **音声通話では Edge TTS は使われません。** 電話音声は PCM を必要とし、Edge の出力は安定しないためです。
- Twilio media streaming が有効なら core TTS を使い、そうでない場合は provider の native voice へフォールバックします。

### 追加例

core TTS のみを使う場合（override なし）:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: { voice: "alloy" },
    },
  },
}
```

通話だけ ElevenLabs に切り替える場合（コア既定値は他で維持）:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            elevenlabs: {
              apiKey: "elevenlabs_key",
              voiceId: "pMsXgVXv3BLzUgSXRplE",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

通話向けに OpenAI model だけを override する場合（deep-merge の例）:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            openai: {
              model: "gpt-4o-mini-tts",
              voice: "marin",
            },
          },
        },
      },
    },
  },
}
```

## 着信通話

着信ポリシーの既定値は `disabled` です。着信を有効化するには次のように設定します。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

自動応答は agent system を使います。主な調整項目:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall expose --mode funnel
```

## Agent tool

tool 名: `voice_call`

actions:

- `initiate_call`（message, to?, mode?）
- `continue_call`（callId, message）
- `speak_to_user`（callId, message）
- `end_call`（callId）
- `get_status`（callId）

この repository には対応する skill doc が `skills/voice-call/SKILL.md` として含まれています。

## Gateway RPC

- `voicecall.initiate`（`to?`, `message`, `mode?`）
- `voicecall.continue`（`callId`, `message`）
- `voicecall.speak`（`callId`, `message`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）
