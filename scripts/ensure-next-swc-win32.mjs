import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);

if (process.platform !== "win32") {
  process.exit(0);
}

const archToPackage = {
  x64: "@next/swc-win32-x64-msvc",
  ia32: "@next/swc-win32-ia32-msvc",
  arm64: "@next/swc-win32-arm64-msvc",
};

const expectedPackage = archToPackage[process.arch];
if (!expectedPackage) {
  console.warn(`[swc] Unsupported Windows architecture "${process.arch}". Next.js will use WASM fallback.`);
  process.exit(0);
}

const packageDir = join(process.cwd(), "node_modules", ...expectedPackage.split("/"));
const binarySuffix = expectedPackage.split("-").slice(2).join("-");
const binaryName = `next-swc.${binarySuffix}.node`;
const binaryPath = join(packageDir, binaryName);

if (!existsSync(binaryPath)) {
  console.warn(`[swc] ${expectedPackage} is missing. Installing matching Next.js SWC binary...`);
  const install = spawnSync("npm", ["install", "--no-save", expectedPackage], { stdio: "inherit", shell: true });
  if (install.status !== 0) {
    console.warn("[swc] Failed to install native SWC package. Next.js will continue with WASM bindings.");
  }
  process.exit(0);
}

try {
  require(binaryPath);
} catch {
  console.warn(`[swc] ${expectedPackage} binary is incompatible with this Node.js runtime.`);
  console.warn("[swc] Reinstalling matching SWC package for current architecture...");
  const reinstall = spawnSync("npm", ["install", "--no-save", expectedPackage], { stdio: "inherit", shell: true });
  if (reinstall.status !== 0) {
    console.warn("[swc] Reinstall failed. Next.js will continue with WASM bindings.");
  }
}
