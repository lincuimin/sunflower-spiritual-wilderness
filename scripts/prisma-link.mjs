import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const clientDir = path.join(projectRoot, "node_modules", "@prisma", "client");
const prismaDir = path.join(projectRoot, "node_modules", ".prisma");
const linkPath = path.join(clientDir, ".prisma");

function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

if (!exists(clientDir)) {
  console.error("[prisma-link] Missing @prisma/client. Did you run npm install?");
  process.exit(1);
}

if (!exists(prismaDir)) {
  console.error("[prisma-link] Missing node_modules/.prisma. Did prisma generate run?");
  process.exit(1);
}

if (exists(linkPath)) {
  // If it's a real directory or existing symlink, leave it as-is.
  process.exit(0);
}

// Create a relative symlink: @prisma/client/.prisma -> ../../.prisma
const relativeTarget = path.relative(clientDir, prismaDir);
fs.symlinkSync(relativeTarget, linkPath, "junction");
console.log(`[prisma-link] Created symlink ${linkPath} -> ${relativeTarget}`);
