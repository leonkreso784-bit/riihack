// npm run ai:smoke: one real call to the character model, to check the key and Croatian output.
import { config } from "dotenv";
config({ path: ".env.local" });
import { generateText } from "ai";
import { aiEnabled, MODELS } from "../src/lib/ai/client";
import { anthropic } from "@ai-sdk/anthropic";

async function main() {
  if (!aiEnabled()) {
    console.error("ANTHROPIC_API_KEY nije postavljen (.env.local).");
    process.exit(1);
  }
  const started = Date.now();
  const { text } = await generateText({
    model: anthropic(MODELS.character),
    system: "Odgovaraš isključivo na hrvatskom, jednom kratkom rečenicom.",
    prompt: "Pozdrav",
  });
  console.log(`${MODELS.character} (${Date.now() - started} ms): ${text}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
