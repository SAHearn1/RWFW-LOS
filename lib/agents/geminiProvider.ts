import { GoogleGenAI } from "@google/genai";

export type GeminiInferenceRequest = {
  prompt: string;
  systemInstruction: string;
  model?: string;
};

export type GeminiInferenceResult = {
  outputText: string;
  provider: "gemini";
  usedFallback: boolean;
  latencyMs: number;
};

const GEMINI_MODEL_DEFAULT = "gemini-2.0-flash";

export class GeminiProvider {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim() !== "MY_GEMINI_API_KEY" && this.apiKey.trim().length > 10);
  }

  async infer(request: GeminiInferenceRequest): Promise<GeminiInferenceResult> {
    const start = Date.now();

    if (!this.isAvailable()) {
      return {
        outputText: "Gemini AI is not configured. Please set a valid GEMINI_API_KEY.",
        provider: "gemini",
        usedFallback: true,
        latencyMs: Date.now() - start,
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey! });
      const response = await ai.models.generateContent({
        model: request.model ?? GEMINI_MODEL_DEFAULT,
        contents: [{ parts: [{ text: request.prompt }] }],
        config: {
          systemInstruction: request.systemInstruction,
        },
      });

      return {
        outputText: response.text ?? "",
        provider: "gemini",
        usedFallback: false,
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        outputText: `I'm having trouble connecting to the RootWork intelligence layer right now. Please try again in a moment.`,
        provider: "gemini",
        usedFallback: true,
        latencyMs: Date.now() - start,
      };
    }
  }
}
