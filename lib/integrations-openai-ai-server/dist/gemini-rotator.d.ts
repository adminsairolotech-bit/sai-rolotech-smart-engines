declare class GeminiKeyRotator {
    private keys;
    private currentIndex;
    private clients;
    constructor();
    private loadKeys;
    private resetExpiredKeys;
    private getActiveKey;
    private markExhausted;
    private isRateLimitError;
    generateContent(params: {
        model?: string;
        contents: string | object;
        config?: object;
    }): Promise<string>;
    generateContentStream(params: {
        model?: string;
        contents: string | object;
        config?: object;
    }): AsyncGenerator<string>;
    getStatus(): object[];
    get totalKeys(): number;
    get activeKeys(): number;
}
export declare const geminiRotator: GeminiKeyRotator;
export {};
//# sourceMappingURL=gemini-rotator.d.ts.map