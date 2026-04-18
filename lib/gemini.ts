import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export { google };

export const model = google("gemini-2.5-flash-lite");

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return undefined;
}

export function isGeminiDisabled(): boolean {
  return process.env.DEMO_MODE_GEMINI_DISABLED === "true";
}

export async function pingGemini(): Promise<boolean> {
  await generateText({
    model,
    prompt: "hi",
    maxOutputTokens: 1,
  });

  return true;
}

export async function callWithFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const status = getErrorStatus(error);

    if (status === 429) {
      console.warn("Gemini request hit rate limits, returning fallback.");
    } else {
      console.error("Gemini request failed, returning fallback.", error);
    }

    return fallback;
  }
}
