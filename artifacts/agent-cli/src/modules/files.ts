/**
 * File Manager Module
 * Handles all file operations
 */

import fs from "fs";
import path from "path";

export async function fileManager(
  op: string,
  target: string,
  content?: string
): Promise<{success: boolean; output?: string; error?: string}> {
  try {
    const operation = op.toLowerCase();

    switch (operation) {
      case "list":
      case "ls": {
        const items = fs.readdirSync(target || process.cwd());
        const formatted = items.map(item => {
          const fullPath = path.join(target || process.cwd(), item);
          const stat = fs.statSync(fullPath);
          const type = stat.isDirectory() ? "[DIR]" : "[FILE]";
          return `${type} ${item}`;
        }).join("\n");
        return { success: true, output: formatted };
      }

      case "read":
      case "cat": {
        if (!target) return { success: false, error: "Path required" };
        const data = fs.readFileSync(target, "utf8");
        return { success: true, output: data.substring(0, 10000) }; // Limit to 10KB
      }

      case "create":
      case "write": {
        if (!target) return { success: false, error: "Path required" };
        fs.writeFileSync(target, content || "");
        return { success: true, output: `File created: ${target}` };
      }

      case "delete":
      case "rm": {
        if (!target) return { success: false, error: "Path required" };
        const stat = fs.statSync(target);
        if (stat.isDirectory()) {
          fs.rmdirSync(target, { recursive: true });
        } else {
          fs.unlinkSync(target);
        }
        return { success: true, output: `Deleted: ${target}` };
      }

      case "copy":
      case "cp": {
        if (!target) return { success: false, error: "Source and destination required" };
        const parts = target.split(" to ");
        if (parts.length >= 2) {
          fs.copyFileSync(parts[0].trim(), parts[1].trim());
          return { success: true, output: `Copied: ${parts[0]} → ${parts[1]}` };
        }
        return { success: false, error: "Format: copy <source> to <dest>" };
      }

      case "move":
      case "mv": {
        if (!target) return { success: false, error: "Source and destination required" };
        const parts = target.split(" to ");
        if (parts.length >= 2) {
          fs.renameSync(parts[0].trim(), parts[1].trim());
          return { success: true, output: `Moved: ${parts[0]} → ${parts[1]}` };
        }
        return { success: false, error: "Format: move <source> to <dest>" };
      }

      case "mkdir":
      case "newfolder": {
        if (!target) return { success: false, error: "Path required" };
        fs.mkdirSync(target, { recursive: true });
        return { success: true, output: `Folder created: ${target}` };
      }

      case "info":
      case "stat": {
        if (!target) return { success: false, error: "Path required" };
        const stat = fs.statSync(target);
        return {
          success: true,
          output: JSON.stringify({
            size: `${Math.round(stat.size / 1024)} KB`,
            created: stat.birthtime,
            modified: stat.mtime,
            isDirectory: stat.isDirectory(),
            isFile: stat.isFile()
          }, null, 2)
        };
      }

      case "search":
      case "find": {
        if (!target) return { success: false, error: "Pattern required" };
        // Simple recursive search
        const results: string[] = [];
        const searchDir = content || process.cwd();
        const pattern = target;

        function search(dir: string) {
          try {
            const items = fs.readdirSync(dir);
            for (const item of items) {
              const fullPath = path.join(dir, item);
              if (item.includes(pattern)) {
                results.push(fullPath);
              }
              try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory() && !item.startsWith(".")) {
                  search(fullPath);
                }
              } catch {}
            }
          } catch {}
        }
        search(searchDir);
        return { success: true, output: results.join("\n") || "No matches found" };
      }

      default:
        return { success: false, error: `Unknown operation: ${op}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listDrives(): Promise<{success: boolean; output?: string; error?: string}> {
  try {
    if (process.platform === "win32") {
      const { execSync } = require("child_process");
      const output = execSync("wmic logicaldisk get name,size,freespace,volumename", { encoding: "utf8" });
      return { success: true, output };
    }
    return { success: true, output: "/" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
