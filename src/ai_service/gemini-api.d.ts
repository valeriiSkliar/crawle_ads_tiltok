declare class GeminiService {
    private static instance: GeminiService | null;
    private constructor(apiKey: string, modelName: string);
    static getInstance(apiKey: string, modelName: string): GeminiService;
    sendMessage(prompt: string): Promise<string | null>;
    streamMessage(prompt: string): Promise<AsyncIterable<string>>;
}

export default GeminiService;
