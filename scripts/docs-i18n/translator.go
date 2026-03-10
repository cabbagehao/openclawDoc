package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	pi "github.com/joshp123/pi-golang"
)

const (
	translateMaxAttempts = 3
	translateBaseDelay   = 15 * time.Second
)

var errEmptyTranslation = errors.New("empty translation")

type PiTranslator struct {
	client       *pi.OneShotClient
	backend      string
	systemPrompt string
	thinking     string
}

func NewPiTranslator(srcLang, tgtLang string, glossary []GlossaryEntry, thinking string) (*PiTranslator, error) {
	systemPrompt := translationPrompt(srcLang, tgtLang, glossary)
	normalizedThinking := normalizeThinking(thinking)
	if shouldUseClaudeCLI() {
		return &PiTranslator{
			backend:      "claude",
			systemPrompt: systemPrompt,
			thinking:     normalizedThinking,
		}, nil
	}

	options := pi.DefaultOneShotOptions()
	options.AppName = "openclaw-docs-i18n"
	options.WorkDir = "/tmp"
	options.Mode = pi.ModeDragons
	options.Dragons = pi.DragonsOptions{
		Provider: "anthropic",
		Model:    modelVersion,
		Thinking: normalizedThinking,
	}
	options.SystemPrompt = systemPrompt
	client, err := pi.StartOneShot(options)
	if err != nil {
		return nil, err
	}
	return &PiTranslator{
		client:       client,
		backend:      "pi",
		systemPrompt: systemPrompt,
		thinking:     normalizedThinking,
	}, nil
}

func (t *PiTranslator) Translate(ctx context.Context, text, srcLang, tgtLang string) (string, error) {
	return t.translate(ctx, text, t.translateMasked)
}

func (t *PiTranslator) TranslateRaw(ctx context.Context, text, srcLang, tgtLang string) (string, error) {
	return t.translate(ctx, text, t.translateRaw)
}

func (t *PiTranslator) translate(ctx context.Context, text string, run func(context.Context, string) (string, error)) (string, error) {
	if t.client == nil {
		return "", errors.New("pi client unavailable")
	}
	prefix, core, suffix := splitWhitespace(text)
	if core == "" {
		return text, nil
	}
	translated, err := t.translateWithRetry(ctx, func(ctx context.Context) (string, error) {
		return run(ctx, core)
	})
	if err != nil {
		return "", err
	}
	return prefix + translated + suffix, nil
}

func (t *PiTranslator) translateWithRetry(ctx context.Context, run func(context.Context) (string, error)) (string, error) {
	var lastErr error
	for attempt := 0; attempt < translateMaxAttempts; attempt++ {
		translated, err := run(ctx)
		if err == nil {
			return translated, nil
		}
		if !isRetryableTranslateError(err) {
			return "", err
		}
		lastErr = err
		if attempt+1 < translateMaxAttempts {
			delay := translateBaseDelay * time.Duration(attempt+1)
			if err := sleepWithContext(ctx, delay); err != nil {
				return "", err
			}
		}
	}
	return "", lastErr
}

func (t *PiTranslator) translateMasked(ctx context.Context, core string) (string, error) {
	state := NewPlaceholderState(core)
	placeholders := make([]string, 0, 8)
	mapping := map[string]string{}
	masked := maskMarkdown(core, state.Next, &placeholders, mapping)
	resText, err := t.runPrompt(ctx, masked)
	if err != nil {
		return "", err
	}
	translated := strings.TrimSpace(resText)
	if translated == "" {
		return "", errEmptyTranslation
	}
	if err := validatePlaceholders(translated, placeholders); err != nil {
		return "", err
	}
	return unmaskMarkdown(translated, placeholders, mapping), nil
}

func (t *PiTranslator) translateRaw(ctx context.Context, core string) (string, error) {
	resText, err := t.runPrompt(ctx, core)
	if err != nil {
		return "", err
	}
	translated := strings.TrimSpace(resText)
	if translated == "" {
		return "", errEmptyTranslation
	}
	return translated, nil
}

func isRetryableTranslateError(err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, errEmptyTranslation) {
		return true
	}
	message := strings.ToLower(err.Error())
	return strings.Contains(message, "placeholder missing") || strings.Contains(message, "rate limit") || strings.Contains(message, "429")
}

func sleepWithContext(ctx context.Context, delay time.Duration) error {
	timer := time.NewTimer(delay)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

func (t *PiTranslator) Close() {
	if t.client != nil {
		_ = t.client.Close()
	}
}

func (t *PiTranslator) runPrompt(ctx context.Context, message string) (string, error) {
	if t.backend == "claude" {
		return runClaudePrompt(ctx, t.systemPrompt, t.thinking, message)
	}
	return runPrompt(ctx, t.client, message)
}

func shouldUseClaudeCLI() bool {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("DOCS_I18N_BACKEND"))) {
	case "pi":
		return false
	case "claude", "":
		return commandExists("claude")
	default:
		return commandExists("claude")
	}
}

func commandExists(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func runClaudePrompt(ctx context.Context, systemPrompt, thinking, message string) (string, error) {
	args := []string{
		"-p",
		"--permission-mode", "bypassPermissions",
		"--model", modelVersion,
		"--output-format", "text",
		"--no-session-persistence",
		"--tools", "",
		"--system-prompt", systemPrompt,
	}
	if effort := claudeEffort(thinking); effort != "" {
		args = append(args, "--effort", effort)
	}
	cmd := exec.CommandContext(ctx, "claude", args...)
	cmd.Env = os.Environ()
	cmd.Stdin = strings.NewReader(message)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("claude prompt failed: %w: %s", err, strings.TrimSpace(string(output)))
	}
	return string(output), nil
}

func claudeEffort(thinking string) string {
	switch strings.ToLower(strings.TrimSpace(thinking)) {
	case "low":
		return "low"
	case "high":
		return "high"
	default:
		return "medium"
	}
}

type agentEndPayload struct {
	Messages []agentMessage `json:"messages"`
}

type agentMessage struct {
	Role         string          `json:"role"`
	Content      json.RawMessage `json:"content"`
	StopReason   string          `json:"stopReason,omitempty"`
	ErrorMessage string          `json:"errorMessage,omitempty"`
}

type contentBlock struct {
	Type string `json:"type"`
	Text string `json:"text,omitempty"`
}

func runPrompt(ctx context.Context, client *pi.OneShotClient, message string) (string, error) {
	events, cancel := client.Subscribe(256)
	defer cancel()

	if err := client.Prompt(ctx, message); err != nil {
		return "", err
	}

	for {
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		case event, ok := <-events:
			if !ok {
				return "", errors.New("event stream closed")
			}
			if event.Type == "agent_end" {
				return extractTranslationResult(event.Raw)
			}
		}
	}
}

func extractTranslationResult(raw json.RawMessage) (string, error) {
	var payload agentEndPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return "", err
	}
	for index := len(payload.Messages) - 1; index >= 0; index-- {
		message := payload.Messages[index]
		if message.Role != "assistant" {
			continue
		}
		if message.ErrorMessage != "" || strings.EqualFold(message.StopReason, "error") {
			msg := strings.TrimSpace(message.ErrorMessage)
			if msg == "" {
				msg = "unknown error"
			}
			return "", fmt.Errorf("pi error: %s", msg)
		}
		text, err := extractContentText(message.Content)
		if err != nil {
			return "", err
		}
		return text, nil
	}
	return "", errors.New("assistant message not found")
}

func extractContentText(content json.RawMessage) (string, error) {
	trimmed := strings.TrimSpace(string(content))
	if trimmed == "" {
		return "", nil
	}
	if strings.HasPrefix(trimmed, "\"") {
		var text string
		if err := json.Unmarshal(content, &text); err != nil {
			return "", err
		}
		return text, nil
	}

	var blocks []contentBlock
	if err := json.Unmarshal(content, &blocks); err != nil {
		return "", err
	}

	var parts []string
	for _, block := range blocks {
		if block.Type == "text" && block.Text != "" {
			parts = append(parts, block.Text)
		}
	}
	return strings.Join(parts, ""), nil
}

func normalizeThinking(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "low", "high":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return "high"
	}
}
