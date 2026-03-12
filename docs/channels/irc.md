---
title: "IRC"
seoTitle: "OpenClawでIRCチャンネルとDM連携を設定する方法"
description: "IRC チャンネルとダイレクトメッセージを OpenClaw に接続する設定ガイドです。プラグイン導入、allowlist、グループ制御、運用の注意点を確認できます。"
summary: "IRC プラグインのセットアップ、アクセス制御、トラブルシューティング"
read_when:
  - OpenClaw を IRC チャンネルまたは DM に接続したい場合
  - IRC の allowlist、グループポリシー、メンション制御を設定する場合
x-i18n:
  source_path: "channels/irc.md"
  source_hash: "82ec2803ee4d34f480f75bd1714239761c533a482a559e9a57049256ff0aabba"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:38:42.907Z"
---
クラシックな IRC チャンネル (`#room`) やダイレクトメッセージで OpenClaw を使いたい場合は IRC を利用します。IRC は拡張プラグインとして提供されますが、設定はメイン設定ファイル内の `channels.irc` で行います。

## Quick start

1. `~/.openclaw/openclaw.json` で IRC の設定を有効にします。
2. 最低限、次の項目を設定します。

```json
{
  "channels": {
    "irc": {
      "enabled": true,
      "host": "irc.libera.chat",
      "port": 6697,
      "tls": true,
      "nick": "openclaw-bot",
      "channels": ["#openclaw"]
    }
  }
}
```

3. ゲートウェイを起動または再起動します。

```bash
openclaw gateway run
```

## Security defaults

- `channels.irc.dmPolicy` のデフォルトは `"pairing"` です。
- `channels.irc.groupPolicy` のデフォルトは `"allowlist"` です。
- `groupPolicy="allowlist"` を使う場合は、`channels.irc.groups` で許可するチャンネルを定義します。
- 平文通信を意図的に許可する場合を除き、TLS (`channels.irc.tls=true`) を使ってください。

## Access control

IRC チャンネルには、独立した 2 つの「ゲート」があります。

1. **チャンネルアクセス** (`groupPolicy` + `groups`): そのチャンネルからのメッセージをボットが受け付けるかどうか
2. **送信者アクセス** (`groupAllowFrom` / チャンネルごとの `groups["#channel"].allowFrom`): そのチャンネル内でボットを起動できる送信者は誰か

主な設定キー:

- DM allowlist (DM 送信者アクセス): `channels.irc.allowFrom`
- グループ送信者 allowlist (チャンネル送信者アクセス): `channels.irc.groupAllowFrom`
- チャンネルごとの制御 (チャンネル + 送信者 + メンションルール): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` を使うと、未設定のチャンネルも許可されます。ただし **デフォルトでは引き続きメンション制御が有効** です。

allowlist のエントリには、安定した送信者識別子 (`nick!user@host`) を使うことを推奨します。ニックネーム単体での照合は可変であり、`channels.irc.dangerouslyAllowNameMatching: true` を設定した場合にのみ有効になります。

### Common gotcha: `allowFrom` is for DMs, not channels

次のようなログが出る場合があります。

- `irc: drop group sender alice!ident@host (policy=allowlist)`

これは、送信者が **グループ / チャンネル** メッセージに対して許可されていないことを意味します。対処方法は次のいずれかです。

- `channels.irc.groupAllowFrom` を設定する (全チャンネル共通)
- チャンネルごとの送信者 allowlist を設定する: `channels.irc.groups["#channel"].allowFrom`

例: `#tuirc-dev` 内の誰でもボットへ話しかけられるようにする設定です。

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Reply triggering (mentions)

チャンネルが許可されており (`groupPolicy` + `groups`)、かつ送信者も許可されていても、OpenClaw はグループ文脈ではデフォルトで **メンション制御** を行います。

そのため、メッセージにボットへ一致するメンションパターンが含まれていないと、`drop channel ... (missing-mention)` のようなログが出ることがあります。

IRC チャンネルで **メンションなしでも** ボットに返信させたい場合は、そのチャンネルのメンション制御を無効にします。

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

あるいは、**すべての** IRC チャンネルを許可し、メンションなしで返信させることもできます。

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Security note (recommended for public channels)

公開チャンネルで `allowFrom: ["*"]` を許可すると、誰でもボットへプロンプトを送れるようになります。リスクを下げるため、そのチャンネルで利用できるツールを制限してください。

### Same tools for everyone in the channel

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Different tools per sender (owner gets more power)

`toolsBySender` を使うと、`"*"` に対して厳しいポリシーを適用しつつ、自分の nick だけをより緩いポリシーにできます。

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

補足:

- `toolsBySender` のキーでは、IRC の送信者識別子に `id:` プレフィックスを付けてください。たとえば `id:eigen` や、より強く一致させたい場合は `id:eigen!~eigen@174.127.248.171` を使います。
- 従来のプレフィックスなしキーも引き続き受け付けますが、`id:` としてのみ照合されます。
- 最初に一致した送信者ポリシーが適用されます。`"*"` はワイルドカードのフォールバックです。

グループアクセスとメンション制御の関係については [/channels/groups](/channels/groups) も参照してください。

## NickServ

接続後に NickServ で認証するには、次のように設定します。

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "enabled": true,
        "service": "NickServ",
        "password": "your-nickserv-password"
      }
    }
  }
}
```

接続時に一度だけ登録するオプションもあります。

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "register": true,
        "registerEmail": "bot@example.com"
      }
    }
  }
}
```

nick の登録が終わったら、`register` は無効にしてください。無効にしないと、毎回 REGISTER を試みる可能性があります。

## Environment variables

デフォルトアカウントでは次の環境変数を利用できます。

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (カンマ区切り)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## Troubleshooting

- ボットが接続しているのにチャンネルで返信しない場合は、`channels.irc.groups` の設定に加え、メンション制御によって `missing-mention` で落ちていないか確認してください。メンションなしで返信させたい場合は、そのチャンネルへ `requireMention:false` を設定します。
- ログインに失敗する場合は、nick が使用可能かどうか、サーバーパスワードが正しいかどうかを確認してください。
- カスタムネットワークで TLS に失敗する場合は、host、port、証明書設定を確認してください。
