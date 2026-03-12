import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_MODEL } from "@archlens/shared";

export class ClaudeClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  async analyze(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ content: string; promptTokens: number; completionTokens: number }> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock?.text ?? "";

    return {
      content,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
    };
  }
}
