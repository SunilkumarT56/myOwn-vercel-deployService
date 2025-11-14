import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import redis from "redis";
import { getAllFiles } from "../utils/files.js";
import {clearBuildFolders} from "../utils/clearFolders.js"


const publisher = redis.createClient();
publisher.connect();

export async function buildReactProject(deploymentId: string) {
  const projectPath = path.resolve(`output/${deploymentId}`);
  const outputPath = path.resolve(`builded-folder/${deploymentId}`);

  fs.mkdirSync(outputPath, { recursive: true });

  console.log(`🚀 Building project ${deploymentId}...`);

  try {
  execSync(
  `docker run --rm --user root \
    -v ${projectPath}:/app \
    -v ${outputPath}:/output \
    node:20-alpine \
    sh -c '
      set -e
      cd /app
      
      # Install dependencies
      if [ -f pnpm-lock.yaml ]; then
        corepack enable && pnpm i --frozen-lockfile
      elif [ -f yarn.lock ]; then
        npm i -g yarn >/dev/null 2>&1 && yarn install --frozen-lockfile
      else
        npm ci --silent
      fi

      # Run build
      (npm run build || yarn build || pnpm build)

      mkdir -p /output

      # Copy output intelligently
      if [ -d dist ]; then
        cp -r dist/* /output/
      elif [ -d build ]; then
        cp -r build/* /output/
      elif [ -d out ]; then
        cp -r out/* /output/
      elif [ -d .next ]; then
        echo "⚙️ Detected Next.js, exporting static build..."
        npx next export -o /output/
      else
        echo "❌ No build directory found (dist, build, out, or .next)"
        exit 1
      fi
    '`,
  { stdio: "inherit" }
);


    console.log(`✅ Build complete for ${deploymentId}`);
     await publisher.hSet("status", deploymentId, "builded");
     

  } catch (err) {
    console.error(`❌ Build failed for ${deploymentId}:`);
    throw err;
  }
}
