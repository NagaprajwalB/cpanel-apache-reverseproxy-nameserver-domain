import type { NextConfig } from "next";
import * as fs from "fs";
import * as path from "path";

// Copy logo image from brain dir to public dir at config load time
try {
  const src = "C:/Users/DELL-5560/.gemini/antigravity-ide/brain/20f3bd07-2d80-470a-96e7-6efd817c7310/media__1782278475639.png";
  const dest = path.join(process.cwd(), "public", "logo.png");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("Successfully copied logo image to public folder.");
  } else {
    console.log("Source logo image not found at: " + src);
  }
} catch (error) {
  console.error("Failed to copy logo image:", error);
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
