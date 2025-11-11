import { createClient } from "redis";
import { downloadS3File } from "./controller/downloadS3Files.js"
import {buildReactProject} from "./worker/builder.js"

const subscriber = createClient();

subscriber.on?.("ready", () => {
  console.log("✅ Redis connected");
});

subscriber.on?.("error", () => {
  console.error("❌ Redis error:");
});

await subscriber.connect(); 
async function main() {
  console.log("🚀 Waiting for items in build-queue...");
  while (true) {
    const response = await subscriber.brPop("build-queue", 0);
    console.log("📦 Received:", response);
    //@ts-ignore
    await downloadS3File(`output/${response.element}`);
    //@ts-ignore
    await buildReactProject(response.element)
  }
}

main();