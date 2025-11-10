import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

const REGION = process.env.AWS_REGION ?? "";
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_KEY ?? "";

export const s3 = new AWS.S3({
  region: REGION,
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
});
