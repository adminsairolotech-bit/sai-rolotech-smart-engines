import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import { geminiRotator } from "./gemini-rotator";
export { geminiRotator };
export declare const openai: OpenAI;
export declare const aiProvider: "openai" | "gemini" | "none";
export declare const anthropic: Anthropic;
export declare const gemini: GoogleGenAI;
export declare const hasAnthropicKey: boolean;
export declare const hasGeminiKey: boolean;
export declare const hasOpenAIKey: boolean;
//# sourceMappingURL=client.d.ts.map