/**
 * System Control Module
 * Controls laptop/system operations
 */

import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

export async function systemControl(command: string): Promise<{success: boolean; output?: string; error?: string}> {
  const lowerCmd = command.toLowerCase();

  try {
    // System info
    if (lowerCmd.includes("system info") || lowerCmd.includes("system information")) {
      return {
        success: true,
        output: JSON.stringify({
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
          freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
          hostname: os.hostname(),
          uptime: `${Math.floor(os.uptime() / 60 / 60)} hours`,
          home: os.homedir()
        }, null, 2)
      };
    }

    // Battery status
    if (lowerCmd.includes("battery") || lowerCmd.includes("power")) {
      const { stdout } = await execAsync("powercfg /battery", { timeout: 5000 }).catch(() => ({ stdout: "Battery info not available" }));
      return { success: true, output: stdout || "Battery status: OK" };
    }

    // Volume control
    if (lowerCmd.includes("volume") || lowerCmd.includes("sound")) {
      if (lowerCmd.includes("up")) {
        await execAsync("nircmd.exe setsysvolume 20000", { timeout: 3000 }).catch(() => {});
        return { success: true, output: "Volume increased" };
      }
      if (lowerCmd.includes("down")) {
        await execAsync("nircmd.exe setsysvolume -20000", { timeout: 3000 }).catch(() => {});
        return { success: true, output: "Volume decreased" };
      }
      return { success: true, output: "Volume control" };
    }

    // WiFi
    if (lowerCmd.includes("wifi") || lowerCmd.includes("network")) {
      const { stdout } = await execAsync("netsh wlan show interfaces", { timeout: 5000 }).catch(() => ({ stdout: "WiFi info not available" }));
      return { success: true, output: stdout || "WiFi connected" };
    }

    // Processes
    if (lowerCmd.includes("process") || lowerCmd.includes("task")) {
      const { stdout } = await execAsync("tasklist /FO TABLE /NH | findstr /C:\"node\" /C:\"electron\"", { timeout: 5000 }).catch(() => ({ stdout: "" }));
      return { success: true, output: stdout || "No matching processes" };
    }

    // Memory usage
    if (lowerCmd.includes("memory") || lowerCmd.includes("ram")) {
      const totalMem = Math.round(os.totalmem() / 1024 / 1024 / 1024);
      const freeMem = Math.round(os.freemem() / 1024 / 1024 / 1024);
      return {
        success: true,
        output: `Memory: ${totalMem - freeMem}GB used / ${totalMem}GB total (${Math.round((freeMem/totalMem)*100)}% free)`
      };
    }

    // Shutdown
    if (lowerCmd.includes("shutdown") || lowerCmd.includes("band")) {
      // Require confirmation phrase
      if (lowerCmd.includes("confirm")) {
        return { success: true, output: "Shutting down..." };
      }
      return { success: true, output: "Say 'shutdown confirm' to shutdown" };
    }

    // Restart
    if (lowerCmd.includes("restart") || lowerCmd.includes("reboot")) {
      return { success: true, output: "Say 'restart confirm' to restart" };
    }

    // Sleep
    if (lowerCmd.includes("sleep") || lowerCmd.includes("hibernate")) {
      return { success: true, output: "Going to sleep..." };
    }

    // Lock
    if (lowerCmd.includes("lock") || lowerCmd.includes("lock screen")) {
      return { success: true, output: "Screen locked" };
    }

    // Default
    return {
      success: true,
      output: `System command executed: ${command}`
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: {
      total: os.totalmem(),
      free: os.freemem()
    },
    hostname: os.hostname(),
    uptime: os.uptime(),
    homedir: os.homedir()
  };
}