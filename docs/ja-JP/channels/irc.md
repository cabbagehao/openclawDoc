---
title: IRC
description: OpenClawをIRCチャンネルとダイレクトメッセージに接続します。
summary: "IRCプラグインのセットアップ、アクセス制御、トラブルシューティング"
read_when:
  - OpenClawをIRCチャンネルまたはDMに接続したい場合
  - IRC許可リスト、グループポリシー、またはメンションゲーティングを設定する場合
x-i18n:
  source_path: "channels/irc.md"
  source_hash: "82ec2803ee4d34f480f75bd1714239761c533a482a559e9a57049256ff0aabba"
  provider: "anthropic"
  model: "claude-opus-4-6"
  workflow: 1
  generated_at: "2026-03-10T06:38:42.907Z"
---

クラシックなチャンネル（`#room`）やダイレクトメッセージでOpenClawを使用したい場合はIRCを使用します。
IRCは拡張プラグインとして提供されますが、メイン設定の`channels.irc`で設定します。

## クイックスタート

1. `~/.openclaw/openclaw.json`でIRC設定を有効にします。
2. 最低限以下を設定します：

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

3. Gatewayを起動/再起動します：

```bash
openclaw gateway run
```

## セキュリティのデフォルト設定

- `channels.irc.dmPolicy`のデフォルトは`"pairing"`です。
- `channels.irc.groupPolicy`のデフォルトは`"allowlist"`です。
- `groupPolicy="allowlist"`の場合、`channels.irc.groups`で許可するチャンネルを定義します。
- 意図的に平文通信を許可する場合を除き、TLS（`channels.irc.tls=true`）を使用してください。

## アクセス制御

IRCチャンネルには2つの独立した「ゲート」があります：

1. **チャンネルアクセス**（`groupPolicy` + `groups`）：ボットがチャンネルからのメッセージを受け入れるかどうか。
2. **送信者アクセス**（`groupAllowFrom` / チャンネルごとの`groups["#channel"].allowFrom`）：そのチャンネル内でボットをトリガーできるユーザー。

設定キー：

- DM許可リスト（DM送信者アクセス）：`channels.irc.allowFrom`
- グループ送信者許可リスト（チャンネル送信者アクセス）：`channels.irc.groupAllowFrom`
- チャンネルごとの制御（チャンネル + 送信者 + メンションルール）：`channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"`は未設定のチャンネルを許可します（**デフォルトではメンションゲーティングが有効**）

許可リストのエントリには安定した送信者ID（`nick!user@host`）を使用してください。
ニックネームのみのマッチングは可変的で、`channels.irc.dangerouslyAllowNameMatching: true`の場合のみ有効です。

### よくある落とし穴：`allowFrom`はDM用で、チャンネル用ではありません

次のようなログが表示される場合：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

これは、送信者が**グループ/チャンネル**メッセージに対して許可されていないことを意味します。以下のいずれかで修正してください：

- `channels.irc.groupAllowFrom`を設定（すべてのチャンネルに対してグローバル）、または
- チャンネルごとの送信者許可リストを設定：`channels.irc.groups["#channel"].allowFrom`

例（`#tuirc-dev`内の誰でもボットと会話できるようにする）：

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

## 返信トリガー（メンション）

チャンネルが許可され（`groupPolicy` + `groups`経由）、送信者が許可されていても、OpenClawはグループコンテキストでは**メンションゲーティング**をデフォルトとします。

つまり、メッセージにボットにマッチするメンションパターンが含まれていない限り、`drop channel … (missing-mention)`のようなログが表示される可能性があります。

IRCチャンネルで**メンションなしで**ボットに返信させるには、そのチャンネルのメンションゲーティングを無効にします：

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

または、**すべての**IRCチャンネルを許可し（チャンネルごとの許可リストなし）、メンションなしで返信させる場合：

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

## セキュリティに関する注意（公開チャンネルに推奨）

公開チャンネルで`allowFrom: ["*"]`を許可すると、誰でもボットにプロンプトを送信できます。
リスクを軽減するには、そのチャンネルのツールを制限してください。

### チャンネル内の全員に同じツール

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

### 送信者ごとに異なるツール（オーナーはより多くの権限を取得）

`toolsBySender`を使用して、`"*"`にはより厳格なポリシーを、自分のニックネームにはより緩いポリシーを適用します：

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

注意：

- `toolsBySender`のキーはIRC送信者IDの値に`id:`を使用する必要があります：
  `id:eigen`または`id:eigen!~eigen@174.127.248.171`でより強力なマッチングを行います。
- レガシーのプレフィックスなしキーも受け入れられ、`id:`としてのみマッチングされます。
- 最初にマッチした送信者ポリシーが優先されます；`"*"`はワイルドカードフォールバックです。

グループアクセスとメンションゲーティング（およびそれらの相互作用）の詳細については、[/channels/groups](/channels/groups)を参照してください。

## NickServ

接続後にNickServで認証するには：

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

接続時の1回限りの登録（オプション）：

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

ニックネームが登録された後は、繰り返しのREGISTER試行を避けるために`register`を無効にしてください。

## 環境変数

デフォルトアカウントは以下をサポートします：

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（カンマ区切り）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## トラブルシューティング

- ボットが接続してもチャンネルで返信しない場合は、`channels.irc.groups`を確認し、メンションゲーティングがメッセージをドロップしているか（`missing-mention`）を確認してください。pingなしで返信させたい場合は、チャンネルに対して`requireMention:false`を設定してください。
- ログインに失敗する場合は、ニックネームの可用性とサーバーパスワードを確認してください。
- カスタムネットワークでTLSが失敗する場合は、ホスト/ポートと証明書の設定を確認してください。
