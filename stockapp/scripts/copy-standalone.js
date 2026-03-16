/**
 * copy-standalone.js
 * Copies public/ and .next/static/ into the standalone output so the
 * server can serve them. Run automatically via `npm run build:cpanel`.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// public/ → .next/standalone/public/
copyDir(path.join(root, "public"), path.join(standalone, "public"));
console.log("✓ Copied public/");

// .next/static/ → .next/standalone/.next/static/
copyDir(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static")
);
console.log("✓ Copied .next/static/");

console.log("\n✓ Standalone build ready. Upload the .next/standalone/ folder to cPanel.");
