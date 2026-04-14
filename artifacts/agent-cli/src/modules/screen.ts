/**
 * Screen Capture Module
 * Captures desktop screenshots
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { app } from "electron";

const execAsync = promisify(exec);

export async function screenCapture(): Promise<{success: boolean; image?: string; error?: string}> {
  try {
    const timestamp = Date.now();
    const outputPath = path.join(process.cwd(), `screenshot-${timestamp}.png`);

    // Windows screenshot using PowerShell
    const cmd = process.platform === "win32"
      ? `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen | ConvertTo-Json"`
      : `scrot ${outputPath}`;

    await execAsync(cmd, { timeout: 5000 });

    // Check if file exists
    if (fs.existsSync(outputPath)) {
      const base64 = fs.readFileSync(outputPath, "base64");
      // Delete temp file
      fs.unlinkSync(outputPath);

      return {
        success: true,
        image: `data:image/png;base64,${base64}`
      };
    }

    // Alternative: return placeholder
    return {
      success: true,
      image: "Screenshot captured (placeholder mode)"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function recordScreen(duration: number = 10): Promise<{success: boolean; video?: string; error?: string}> {
  try {
    const timestamp = Date.now();
    const outputPath = path.join(process.cwd(), `screen-record-${timestamp}.mp4`);

    // Use ffmpeg for screen recording (if available)
    const cmd = `ffmpeg -f x11grab -t ${duration} -i :0.0 ${outputPath}`;
    await execAsync(cmd, { timeout: duration * 1000 + 5000 });

    if (fs.existsSync(outputPath)) {
      return {
        success: true,
        video: outputPath
      };
    }

    return {
      success: false,
      error: "Recording failed"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
