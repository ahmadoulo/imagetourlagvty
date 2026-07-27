import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const globalForS3 = globalThis as unknown as { s3Client: S3Client };

const s3Config: any = {
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "admin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "password",
  },
};

if (process.env.S3_ENDPOINT) {
  s3Config.endpoint = process.env.S3_ENDPOINT;
}

if (process.env.S3_FORCE_PATH_STYLE === "true" || process.env.S3_ENDPOINT) {
  // Required for MinIO and other S3-compatible storages
  s3Config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE !== "false";
}

export const s3Client = globalForS3.s3Client || new S3Client(s3Config);

if (process.env.NODE_ENV !== "production") globalForS3.s3Client = s3Client;

export async function uploadToS3(bucket: string, key: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  
  await s3Client.send(command);
  
  // Return the public URL for the file
  if (process.env.S3_PUBLIC_URL) {
    return `${process.env.S3_PUBLIC_URL}/${key}`;
  }
  
  // Fallback for AWS S3
  return `https://${bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
}

export async function deleteFromS3(bucket: string, key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  await s3Client.send(command);
}

export async function getPresignedUrl(bucket: string, key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}
