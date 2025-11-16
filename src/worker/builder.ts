import { execSync } from "child_process";
import fs from "fs";
import redis from "redis";

const publisher = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "redis",
    port: Number(process.env.REDIS_PORT) || 6379,
  }
});
publisher.connect();

export async function buildReactProject(deploymentId: string) {
  // 🔥 Absolute paths inside deploy-service container
  const projectPath = `/app/output/${deploymentId}`;
  const outputPath = `/app/builded-folder/${deploymentId}`;

  // 🔥 Make sure folders exist BEFORE running docker
  fs.mkdirSync(projectPath, { recursive: true });
  fs.mkdirSync(outputPath, { recursive: true });

  console.log(`🚀 Building project ${deploymentId}...`);

  try {
    execSync(
      `
      docker run --rm --user root \
        -v ${projectPath}:/src \
        -v ${outputPath}:/build \
        node:20-alpine \
        sh -c "
          set -e
          cd /src

          # Install dependencies
          if [ -f pnpm-lock.yaml ]; then
            corepack enable && pnpm i --frozen-lockfile
          elif [ -f yarn.lock ]; then
            npm i -g yarn >/dev/null 2>&1 && yarn install --frozen-lockfile
          else
            npm install --include=dev --silent
          fi

          # Build
          (npx vite build || yarn build || pnpm build)

          mkdir -p /build

          # Copy output directories
          if [ -d dist ]; then cp -r dist/* /build/;
          elif [ -d build ]; then cp -r build/* /build/;
          elif [ -d out ]; then cp -r out/* /build/;
          elif [ -d .next ]; then
            echo '⚙ Detected Next.js, exporting static build...';
            npx next export -o /build/;
          else
            echo '❌ No build directory found';
            exit 1;
          fi
        "
      `,
      { stdio: "inherit" }
    );

    console.log(`✅ Build complete for ${deploymentId}`);
    await publisher.hSet("status", deploymentId, "builded");

  } catch (err) {
    console.error(`❌ Build failed for ${deploymentId}:`);
    throw err;
  }
}