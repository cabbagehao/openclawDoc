---
summary: "Claude 구독 자격 증명을 OpenAI 호환 엔드포인트로 노출하는 커뮤니티 프록시"
read_when:
  - Claude Max 구독을 OpenAI 호환 도구와 함께 쓰고 싶을 때
  - Claude Code CLI를 감싸는 로컬 API 서버가 필요할 때
  - 구독 기반 접근과 API key 기반 Anthropic 접근을 비교해 보고 싶을 때
title: "Claude Max API Proxy"
---

# Claude Max API Proxy

**claude-max-api-proxy**는 Claude Max/Pro 구독을 OpenAI 호환 API 엔드포인트로 노출하는 커뮤니티 도구입니다. 이 도구를 사용하면 OpenAI API 형식을 지원하는 모든 툴에서 구독을 사용할 수 있습니다.

<Warning>
  이 경로는 기술적 호환성 제공에 불과합니다. Anthropic은 과거에 Claude Code 밖에서의 일부 구독 사용을 막은 적이 있습니다. 사용 여부는 스스로 판단해야 하며, 여기에 의존하기 전에 Anthropic의 최신 약관을 직접 확인해야 합니다.
</Warning>

## Why Use This?

| Approach                | Cost                                 | Best For          |
| ----------------------- | ------------------------------------ | ----------------- |
| Anthropic API           | 토큰당 과금(Opus 기준 입력 약 $15/M, 출력 $75/M) | 운영 앱, 대량 사용       |
| Claude Max subscription | 월 \$200 정액                           | 개인 사용, 개발, 무제한 사용 |

Claude Max 구독이 있고 이를 OpenAI 호환 도구에 연결하고 싶다면, 이 프록시는 일부 워크플로우에서 비용을 줄일 수 있습니다. 다만 운영 환경에서는 API key가 더 명확한 정책 경로입니다.

## How It Works

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

이 프록시는 다음을 수행합니다.

1. `http://localhost:3456/v1/chat/completions`에서 OpenAI 형식 요청을 수신
2. 이를 Claude Code CLI 명령으로 변환
3. OpenAI 형식으로 응답 반환(streaming 지원)

## Installation

```bash
# Node.js 20+와 Claude Code CLI 필요
npm install -g claude-max-api-proxy

# Claude CLI 인증 확인
claude --version
```

## Usage

### Start the server

```bash
claude-max-api
# 서버는 http://localhost:3456 에서 실행
```

### Test it

```bash
# Health check
curl http://localhost:3456/health

# List models
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### With OpenClaw

OpenClaw를 이 프록시를 향하는 custom OpenAI-compatible endpoint로 설정할 수 있습니다.

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1",
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" },
    },
  },
}
```

## Available Models

| Model ID          | Maps To         |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Auto-Start on macOS

프록시를 자동 실행하려면 LaunchAgent를 만드세요.

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## Links

* **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
* **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
* **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Notes

* 이 도구는 **커뮤니티 도구**이며 Anthropic이나 OpenClaw가 공식 지원하지 않습니다.
* Claude Code CLI 인증이 완료된 활성 Claude Max/Pro 구독이 필요합니다.
* 프록시는 로컬에서 실행되며 서드파티 서버로 데이터를 보내지 않습니다.
* 스트리밍 응답을 완전히 지원합니다.

## See Also

* [Anthropic provider](/providers/anthropic) - setup-token 또는 API key를 사용하는 OpenClaw 기본 Claude 통합
* [OpenAI provider](/providers/openai) - OpenAI/Codex 구독용
