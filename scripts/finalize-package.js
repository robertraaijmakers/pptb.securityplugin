const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const packageLockPath = path.join(rootDir, "package-lock.json");
const shrinkwrapPath = path.join(rootDir, "npm-shrinkwrap.json");

console.log("Finalizing package for deployment...\n");

if (!fs.existsSync(packageLockPath)) {
  console.warn("Warning: package-lock.json not found. Shrinkwrap not generated.");
  process.exit(1);
}

const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
fs.writeFileSync(shrinkwrapPath, JSON.stringify(packageLock, null, 2));

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
fs.copyFileSync(shrinkwrapPath, path.join(distDir, "npm-shrinkwrap.json"));

console.log("Generated npm-shrinkwrap.json for dependency locking.");
console.log("Copied npm-shrinkwrap.json to dist.");
console.log("\nPackage finalize completed.");
