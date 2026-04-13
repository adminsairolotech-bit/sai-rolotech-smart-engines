/**
 * Build Script for SAI Rolotech Engine
 */

import { execSync } from "child_process";
import { copyFileSync, mkdirSync, existsSync } from "fs";

console.log("🔧 Building SAI Rolotech Engine...");

// Ensure dist directory exists
mkdirSync("dist", { recursive: true });

// TypeScript compilation
console.log("📦 Compiling TypeScript...");
execSync("tsc", { stdio: "inherit" });

// Copy config files
console.log("📁 Copying configuration...");
if (existsSync(".env.example")) {
  copyFileSync(".env.example", "dist/.env.example");
}

// Copy knowledge base data
console.log("📚 Copying knowledge bases...");

console.log("✅ Build complete!");
console.log("\nTo start:");
console.log("  npm run dev    - Development mode");
console.log("  npm start      - Production mode");
