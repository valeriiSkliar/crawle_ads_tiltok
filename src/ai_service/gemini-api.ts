import { GoogleGenerativeAI, GenerateContentRequest, GenerateContentResponse } from "@google/generative-ai";

class GeminiService {
    private static instance: GeminiService | null = null;
    private genAI: GoogleGenerativeAI;
    private model: any;  // Replace 'any' with a more specific type if known

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

            const response: GenerateContentResponse = await this.model.generateContent(request);
            const text = response.response?.text();
            return text || null;  // Return null if no text in response

        } catch (error: any) {
            console.error("Error sending message to Gemini:", error);
            throw new Error(`Failed to send message to Gemini: ${error.message}`); //Re-throw for handling upstream.
        }
    }

    // Example of another method you might add: streaming responses
    public async streamMessage(prompt: string): Promise<AsyncIterable<string>> {
        try {
            const request: GenerateContentRequest = {
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            };

            const streamingResponse = await this.model.generateContentStream(request);
            return streamingResponse.stream;

        } catch (error: any) {
            console.error("Error streaming message from Gemini:", error);
            throw new Error(`Failed to stream message from Gemini: ${error.message}`);
        }
    }

    // You can add more methods for other Gemini API capabilities here (e.g., embedding text).
}

export default GeminiService;