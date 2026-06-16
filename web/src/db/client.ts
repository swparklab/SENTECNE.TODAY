import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { awsRegion } from "@/lib/auth/config";
import * as schema from "./schema";

// Aurora Serverless v2 (PostgreSQL) — RDS Data API 사용
// (서버리스 친화: 영구 커넥션/풀이 필요 없음)
export const auroraResourceArn = process.env.AURORA_RESOURCE_ARN ?? "";
export const auroraSecretArn = process.env.AURORA_SECRET_ARN ?? "";
export const auroraDatabase = process.env.AURORA_DATABASE ?? "sentence_today";

export const dbConfigured = !!auroraResourceArn && !!auroraSecretArn;

function createDb() {
  const rds = new RDSDataClient({ region: awsRegion });
  return drizzle(rds, {
    database: auroraDatabase,
    resourceArn: auroraResourceArn,
    secretArn: auroraSecretArn,
    schema,
  });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!dbConfigured) {
    throw new Error("Aurora(Data API)가 설정되지 않았습니다.");
  }
  if (!_db) _db = createDb();
  return _db;
}
