import { GoogleGenerativeAI, GenerateContentRequest, GenerativeModel, GenerateContentResult } from "@google/generative-ai";

class GeminiService {
    private static instance: GeminiService | null = null;
    private genAI: GoogleGenerativeAI;
    private model: GenerativeModel;  // Replace 'any' with a more specific type if known

    private constructor(apiKey: string, modelName: string) {
        if (!apiKey) {
            throw new Error("Gemini API Key is required.");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
    }

    public static getInstance(apiKey: string, modelName: string): GeminiService {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService(apiKey, modelName);
        }
        return GeminiService.instance;
    }

    public async sendMessage(prompt: string): Promise<string | null> {
        try {
            const request: GenerateContentRequest = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            };

            const { response }: GenerateContentResult = await this.model.generateContent(request);
            const text = response?.text();
            return text || null;  // Return null if no text in response

        } catch (error: unknown) {
            console.error("Error sending message to Gemini:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to send message to Gemini: ${errorMessage}`);
        }
    }

    // Example of another method you might add: streaming responses
    public async streamMessage(prompt: string): Promise<AsyncIterable<string>> {
        try {
            const request: GenerateContentRequest = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            };

            const streamingResponse = await this.model.generateContentStream(request);
            
            // Transform the stream to match the expected return type
            const transformedStream = {
                [Symbol.asyncIterator]: async function* () {
                    for await (const item of streamingResponse.stream) {
                        const text = item.text();
                        if (text) {
                            yield text;
                        }
                    }
                }
            };
            
            return transformedStream;

        } catch (error: unknown) {
            console.error("Error streaming message from Gemini:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to stream message from Gemini: ${errorMessage}`);
        }
    }

    // You can add more methods for other Gemini API capabilities here (e.g., embedding text).
}

export default GeminiService;