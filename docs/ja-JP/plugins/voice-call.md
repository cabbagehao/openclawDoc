---
summary: "音声通話プラグイン: Twilio/Telnyx/Plivo 経由の発信 + 着信通話 (プラグインのインストール + 設定 + CLI)"
read_when:
  - OpenClaw から音声通話を発信したい
  - 音声通話プラグインを構成または開発している場合
title: "音声通話プラグイン"
x-i18n:
  source_hash: "5417fbfcdca2ed10a1e478715604cdc4e9fdace2fa0d50924e6a1da58d604444"
---

# 音声通話（プラグイン）

音声はプラグイン経由で OpenClaw を呼び出します。アウトバウンド通知をサポートし、
インバウンドポリシーに関する複数ターンの会話。

現在のプロバイダー:

- `twilio` (プログラム可能な音声 + メディア ストリーム)
- `telnyx` (通話制御 v2)
- `plivo` (音声 API + XML 転送 + GetInput 音声)
- `mock` (開発/ネットワークなし)

簡単なメンタルモデル:

- プラグインのインストール
- ゲートウェイの再起動
- `plugins.entries.voice-call.config` で構成します
- `openclaw voicecall ...` または `voice_call` ツールを使用します。

## 実行場所 (ローカルかリモート)

音声通話プラグインは **ゲートウェイ プロセス内**で実行されます。

リモート ゲートウェイを使用する場合は、**ゲートウェイを実行しているマシン**にプラグインをインストール/構成し、ゲートウェイを再起動してプラグインをロードします。

## インストール

### オプション A: npm からインストールする (推奨)

```bash
openclaw plugins install @openclaw/voice-call
```

その後、ゲートウェイを再起動します。

### オプション B: ローカル フォルダーからインストール (dev、コピーなし)

```bash
openclaw plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

その後、ゲートウェイを再起動します。

## 構成

`plugins.entries.voice-call.config` で構成を設定します。

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

注:- Twilio/Telnyx には **パブリックにアクセス可能な** Webhook URL が必要です。

- Plivo には **パブリックにアクセス可能な** Webhook URL が必要です。
- `mock` はローカル開発プロバイダーです (ネットワーク呼び出しはありません)。
- Telnyx では、`skipSignatureVerification` が true でない限り、`telnyx.publicKey` (または `TELNYX_PUBLIC_KEY`) が必要です。
- `skipSignatureVerification` はローカル テスト専用です。
- ngrok 無料利用枠を使用する場合は、`publicUrl` を正確な ngrok URL に設定します。署名検証は常に強制されます。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` は、`tunnel.provider="ngrok"` および `serve.bind` がループバック (ngrok ローカル エージェント) の場合にのみ\*\*、無効な署名を持つ Twilio Webhook を許可します。ローカル開発のみに使用します。
- Ngrok 無料枠 URL では、インタースティシャル動作を変更または追加できます。 `publicUrl` がドリフトすると、Twilio 署名は失敗します。運用環境の場合は、安定したドメインまたは Tailscale ファネルを推奨します。
- ストリーミング セキュリティのデフォルト:
  - `streaming.preStartTimeoutMs` は、有効な `start` フレームを送信しないソケットを閉じます。
  - `streaming.maxPendingConnections` は、未認証の開始前ソケットの合計を制限します。
  - `streaming.maxPendingConnectionsPerIp` は、ソース IP ごとに未認証の開始前ソケットを制限します。
  - `streaming.maxConnections` は、開いているメディア ストリーム ソケットの合計 (保留中 + アクティブ) を制限します。

## 古いコールリーパー

`staleCallReaperSeconds` を使用して、端末 Webhook を受信しない通話を終了します
(たとえば、完了しない通知モード呼び出しなど)。デフォルトは `0` です。
(無効)。

推奨範囲:- **実稼働:** 通知スタイルのフローの場合は `120`–`300` 秒。

- 通常の呼び出しができるように、この値を **`maxDurationSeconds`** より大きくしておいてください。
  終わります。 `maxDurationSeconds + 30–60` 秒から開始するのが適切です。

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

## Webhook のセキュリティ

プロキシまたはトンネルがゲートウェイの前にある場合、プラグインは
署名検証用のパブリック URL。これらのオプションは、どれを転送するかを制御します
ヘッダーは信頼されます。

`webhookSecurity.allowedHosts` は、ヘッダーの転送からホストを許可リストに登録します。

`webhookSecurity.trustForwardingHeaders` は、ホワイトリストなしで転送されたヘッダーを信頼します。

`webhookSecurity.trustedProxyIPs` は、リクエストが送信された場合に転送されたヘッダーのみを信頼します。
リモート IP がリストと一致します。

Webhook リプレイ保護は Twilio と Plivo に対して有効になっています。有効な Webhook が再生されました
リクエストは承認されますが、副作用のためにスキップされます。

Twilio の会話ターンには、`<Gather>` コールバックにターンごとのトークンが含まれているため、
古い/再生された音声コールバックは、新しい保留中のトランスクリプト ターンを満たすことができません。

安定したパブリックホストの例:

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

## 通話の TTS

音声通話は、コア `messages.tts` 構成 (OpenAI または イレブンラボ) を使用します。
通話中のストリーミング音声。プラグイン設定でこれをオーバーライドできます。
**同じ形状** — `messages.tts` と深くマージされます。

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

注:- **音声通話ではエッジ TTS は無視されます** (電話音声には PCM が必要です。エッジ出力は信頼できません)。

- Twilio メディア ストリーミングが有効な場合、コア TTS が使用されます。それ以外の場合、呼び出しはプロバイダーのネイティブ音声にフォールバックします。

### その他の例

コア TTS のみを使用します (オーバーライドなし)。

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

呼び出し専用に Celebrity をオーバーライドします (コアのデフォルトは他の場所に保持します)。

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

呼び出し用の OpenAI モデルのみをオーバーライドします (ディープマージの例)。

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

## インバウンドコール

受信ポリシーのデフォルトは `disabled` です。着信通話を有効にするには、次のように設定します。

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

自動応答はエージェントシステムを使用します。チューニング:

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

## エージェントツール

ツール名: `voice_call`

アクション:

- `initiate_call` (メッセージ、宛先?、モード?)
- `continue_call` (callId、メッセージ)
- `speak_to_user` (callId、メッセージ)
- `end_call` (呼び出しID)
- `get_status` (呼び出しID)

このリポジトリには、対応するスキル ドキュメントが `skills/voice-call/SKILL.md` に同梱されています。

## ゲートウェイ RPC

- `voicecall.initiate` (`to?`、`message`、`mode?`)
- `voicecall.continue` (`callId`、`message`)
- `voicecall.speak` (`callId`、`message`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)
