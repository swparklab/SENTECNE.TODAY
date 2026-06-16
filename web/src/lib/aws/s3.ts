import "server-only";
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { awsRegion } from "@/lib/auth/config";

// 프로필 이미지 등 사용자 업로드용 S3 헬퍼.
export const s3Bucket = process.env.S3_BUCKET ?? "";
export const s3PublicBaseUrl = process.env.S3_PUBLIC_BASE_URL ?? "";
export const s3Configured = !!s3Bucket;

let _s3: S3Client | null = null;
function s3() {
  if (!_s3) _s3 = new S3Client({ region: awsRegion });
  return _s3;
}

// 클라이언트가 직접 업로드할 수 있는 presigned PUT URL 발급
export async function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3(), command, { expiresIn: 300 });
  const publicUrl = s3PublicBaseUrl
    ? `${s3PublicBaseUrl}/${key}`
    : `https://${s3Bucket}.s3.${awsRegion}.amazonaws.com/${key}`;
  return { url, publicUrl };
}
