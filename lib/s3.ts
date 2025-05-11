import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!;

export async function uploadToS3(
  file: File,
  fileName: string,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `pdfs/${fileName}`,
    Body: buffer,
    ContentType: 'application/pdf',
    Metadata: {
      originalName: file.name,
    },
  });

  await s3Client.send(command);

  // Generate a signed URL that expires in 1 hour
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `pdfs/${fileName}`,
  });

  const signedUrl = await getSignedUrl(s3Client, getCommand, {
    expiresIn: 3600,
  });
  return signedUrl;
}

export async function deleteFromS3(fileName: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `pdfs/${fileName}`,
  });

  await s3Client.send(command);
}

export async function getSignedDownloadUrl(fileName: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `pdfs/${fileName}`,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
