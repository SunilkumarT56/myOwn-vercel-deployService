import fs from "fs";
import mime from "mime-types"; // optional for correct content-type
import { s3 } from "./s3Client.js";

export const uploadFile = async (key: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const contentType = mime.lookup(localFilePath) || "application/octet-stream";

  const params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  };

  try {
    const data = await s3.upload(params).promise();
    console.log(`✅ Uploaded Successfully: ${data.Location}`);
    return data.Location;
  } catch (err) {
    console.error("❌ Upload Failed:", err);
    throw err;
  }
};
