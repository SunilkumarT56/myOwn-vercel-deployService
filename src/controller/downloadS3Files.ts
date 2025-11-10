import { s3 } from "../S3/s3Client.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();
import {fileURLToPath} from "url"
import redis from "redis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname)

const publisher = redis.createClient();
publisher.connect();



export async function downloadS3File(prefix : string){
    if (!process.env.AWS_S3_BUCKET) {
        throw new Error('AWS_S3_BUCKET environment variable is not defined');
    }
    const allFiles = await s3.listObjectsV2({
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix : prefix
    }).promise();

    const allPromises = allFiles.Contents?.map(async ({ Key: key }) => {
        return new Promise(async (resolve) => {
            if(!key) {
                resolve("");
                return
            }
            const relativeKey = key.replace(/^output\//, "");
            const finalOutputPath = path.join(__dirname ,"../output", relativeKey);
            const outputFile  = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)) {
                fs.mkdirSync(dirName, { recursive: true });
            }

            s3.getObject({
                Bucket: process.env.AWS_S3_BUCKET || '',
                Key: key,
            })
            .createReadStream()
            .pipe(outputFile).on("finish", () => {resolve("")});


        })
}) || []
console.log("awaiting");
await Promise.all(allPromises?.filter(x => x !==  undefined));
console.log("done");
const id = prefix.split("/")[1];
console.log(id);
if (id) {
    await publisher.hSet("status", id, "deployed");
}
        

}

