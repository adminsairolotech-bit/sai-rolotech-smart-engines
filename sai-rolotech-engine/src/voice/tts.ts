/**
 * VOICE SYSTEM - TTS & Transcription
 * Multiple providers: OpenAI, ElevenLabs, Google
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export class VoiceSystem {
  private openaiTTS: string = "https://api.openai.com/v1/audio/speech";
  private elevenLabsUrl: string = "https://api.elevenlabs.io/v1/text-to-speech";
  private tempDir: string = "./temp/voice";

  constructor() {
    fs.mkdir(this.tempDir, { recursive: true }).catch(() => {});
  }

  async synthesize(
    text: string,
    voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
    model: "tts-1" | "tts-1-hd" = "tts-1"
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { error: "OpenAI API key not set" };
    }

    try {
      const response = await fetch(this.openaiTTS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format: "mp3",
        }),
      });

      const buffer = await response.arrayBuffer();
      const filename = `speech_${Date.now()}.mp3`;
      const filepath = path.join(this.tempDir, filename);
      await fs.writeFile(filepath, Buffer.from(buffer));

      return { path: filepath, duration: buffer.byteLength / 16000 };
    } catch (e) {
      return { error: String(e) };
    }
  }

  async synthesizeElevenLabs(text: string, voiceId: string = "21m00Tcm4TlvDq8ikWAM") {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { error: "ElevenLabs API key not set" };
    }

    try {
      const response = await fetch(`${this.elevenLabsUrl}/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      const buffer = await response.arrayBuffer();
      const filename = `voice_${Date.now()}.mp3`;
      const filepath = path.join(this.tempDir, filename);
      await fs.writeFile(filepath, Buffer.from(buffer));

      return { path: filepath };
    } catch (e) {
      return { error: String(e) };
    }
  }

  async transcribe(audioPath: string, language?: string) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { error: "OpenAI API key not set" };
    }

    try {
      const formData = new FormData();
      formData.append("file", await fs.readFile(audioPath) as any);
      formData.append("model", "whisper-1");
      if (language) formData.append("language", language);

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      const data = await response.json();
      return { text: data.text, language: data.language };
    } catch (e) {
      return { error: String(e) };
    }
  }

  async generateVoiceover(
    text: string,
    options: {
      voice?: string;
      speed?: number;
      pitch?: number;
    } = {}
  ) {
    const { voice = "alloy", speed = 1, pitch = 1 } = options;

    const result = await this.synthesize(text, voice as any);
    if (result.error) return result;

    // Apply speed/pitch adjustment with ffmpeg
    if (speed !== 1 || pitch !== 1) {
      const adjustedPath = result.path!.replace(".mp3", `_adjusted.mp3`);
      try {
        await execAsync(
          `ffmpeg -i "${result.path}" -filter:a "asetrate=44100*${pitch},atempo=${speed}" "${adjustedPath}"`
        );
        return { path: adjustedPath };
      } catch {
        return result;
      }
    }

    return result;
  }

  async createPodcast(segments: Array<{ text: string; voice: string }>) {
    const audioFiles: string[] = [];

    for (const segment of segments) {
      const result = await this.synthesize(segment.text, segment.voice as any);
      if (!result.error) {
        audioFiles.push(result.path!);
      }
    }

    // Merge all segments
    const concatFile = path.join(this.tempDir, "podcast_concat.txt");
    await fs.writeFile(
      concatFile,
      audioFiles.map(f => `file '${f}'`).join("\n")
    );

    const outputPath = path.join(this.tempDir, `podcast_${Date.now()}.mp3`);
    try {
      await execAsync(
        `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}"`
      );
      await fs.unlink(concatFile);
      return { path: outputPath };
    } catch {
      return { error: "Failed to merge podcast segments" };
    }
  }
}
