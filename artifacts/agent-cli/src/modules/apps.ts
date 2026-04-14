/**
 * App Control Module
 * Controls applications on the system
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function appControl(command: string): Promise<{success: boolean; output?: string; error?: string}> {
  const lowerCmd = command.toLowerCase();

  try {
    // Notepad
    if (lowerCmd.includes("notepad")) {
      if (lowerCmd.includes("new") || lowerCmd.includes("khol")) {
        await execAsync("notepad", { timeout: 1000 });
        return { success: true, output: "Notepad opened" };
      }
      // Open with content
      const match = command.match(/notepad\s+(.+)/);
      if (match) {
        const filePath = match[1].trim();
        await execAsync(`notepad "${filePath}"`, { timeout: 1000 });
        return { success: true, output: `Notepad opened with: ${filePath}` };
      }
    }

    // Calculator
    if (lowerCmd.includes("calculator") || lowerCmd.includes("calc")) {
      await execAsync("calc", { timeout: 1000 });
      return { success: true, output: "Calculator opened" };
    }

    // Chrome / Browser
    if (lowerCmd.includes("chrome") || lowerCmd.includes("browser")) {
      const url = lowerCmd.includes("http") ? command.match(/https?:\/\/[^\s]+/)?.[0] : "https://google.com";
      await execAsync(`start chrome "${url}"`, { shell: "cmd.exe", timeout: 1000 });
      return { success: true, output: `Chrome opened: ${url}` };
    }

    // WhatsApp
    if (lowerCmd.includes("whatsapp")) {
      await execAsync("start whatsapp://", { shell: "cmd.exe", timeout: 1000 });
      return { success: true, output: "WhatsApp opened" };
    }

    // VS Code
    if (lowerCmd.includes("vscode") || lowerCmd.includes("code")) {
      await execAsync("code", { timeout: 1000 });
      return { success: true, output: "VS Code opened" };
    }

    // File Explorer
    if (lowerCmd.includes("explorer") || lowerCmd.includes("folder")) {
      await execAsync("explorer", { timeout: 1000 });
      return { success: true, output: "File Explorer opened" };
    }

    // Terminal / CMD
    if (lowerCmd.includes("terminal") || lowerCmd.includes("cmd") || lowerCmd.includes("command prompt")) {
      await execAsync("start cmd", { shell: "cmd.exe", timeout: 1000 });
      return { success: true, output: "Terminal opened" };
    }

    // Control Panel
    if (lowerCmd.includes("control") || lowerCmd.includes("settings")) {
      await execAsync("control", { timeout: 1000 });
      return { success: true, output: "Control Panel opened" };
    }

    // Task Manager
    if (lowerCmd.includes("task manager")) {
      await execAsync("taskmgr", { timeout: 1000 });
      return { success: true, output: "Task Manager opened" };
    }

    // Close app
    if (lowerCmd.includes("close") || lowerCmd.includes("band")) {
      const appMatch = command.match(/close\s+(\w+)/i);
      if (appMatch) {
        const appName = appMatch[1];
        await execAsync(`taskkill /F /IM ${appName}.exe`, { timeout: 2000 });
        return { success: true, output: `Closed: ${appName}` };
      }
      return { success: false, error: "Specify app name: close <appname>" };
    }

    // Minimize/Maximize
    if (lowerCmd.includes("minimize")) {
      await execAsync('powershell -Command "(Get-Process -Id $PID).MainWindowHandle | ForEach-Object { $sig = @\"[DllImport("user32.dll")]public static extern bool ShowWindow(IntPtr hwnd,int nCmdShow);\"@;$t = Add-Type -MemberDefinition $sig -Name WinAPI -Namespace Get -PassThru;$t::ShowWindow($_,6)}"', { timeout: 2000 });
      return { success: true, output: "Window minimized" };
    }

    if (lowerCmd.includes("maximize")) {
      await execAsync('powershell -Command "(Get-Process -Id $PID).MainWindowHandle | ForEach-Object { $sig = @\"[DllImport("user32.dll")]public static extern bool ShowWindow(IntPtr hwnd,int nCmdShow);\"@;$t = Add-Type -MemberDefinition $sig -Name WinAPI -Namespace Get -PassThru;$t::ShowWindow($_,3)}"', { timeout: 2000 });
      return { success: true, output: "Window maximized" };
    }

    // Run any command
    if (lowerCmd.includes("run ") || lowerCmd.includes("execute ") || lowerCmd.includes("chalana")) {
      const cmdMatch = command.match(/run\s+(.+)/i) || command.match(/execute\s+(.+)/i);
      if (cmdMatch) {
        await execAsync(cmdMatch[1], { timeout: 5000 });
        return { success: true, output: `Executed: ${cmdMatch[1]}` };
      }
    }

    // Default
    return {
      success: true,
      output: `App control: ${command}`
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listRunningApps(): Promise<{success: boolean; output?: string; error?: string}> {
  try {
    const { execSync } = require("child_process");
    const output = execSync('tasklist /FO TABLE /NH /FI "IMAGENAME ne explorer.exe" /FI "IMAGENAME ne dllhost.exe" /FI "IMAGENAME ne conhost.exe" /FI "IMAGENAME ne cmd.exe"', { encoding: "utf8", timeout: 5000 });
    return { success: true, output: output.substring(0, 5000) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
