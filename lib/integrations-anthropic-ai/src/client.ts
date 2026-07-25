import Anthropic from "@anthropic-ai/sdk";

// Support both the Replit AI proxy env var (AI_INTEGRATIONS_ANTHROPIC_API_KEY)
// and a direct Anthropic key (ANTHROPIC_API_KEY).
const apiKey =
  process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ??
  process.env.ANTHROPIC_API_KEY;

const baseURL =
  process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";

if (!apiKey) {
  throw new Error(
    "ANTHROPIC_API_KEY (or AI_INTEGRATIONS_ANTHROPIC_API_KEY) must be set to use the AI chat feature.",
  );
}

export const anthropic = new Anthropic({
  apiKey,
  baseURL,
});
