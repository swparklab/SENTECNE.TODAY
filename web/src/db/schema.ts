import {
  pgTable,
  pgEnum,
  bigint,
  uuid,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// 인증 주체는 Cognito. 사용자 식별자는 Cognito의 sub(문자열)을 사용한다.
// (Supabase 시절의 auth.users FK를 user_sub / writer_sub 로 대체)

export const sentenceStatus = pgEnum("sentence_status", [
  "draft",
  "used",
  "shared",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userSub: text("user_sub").notNull().unique(),
  nickname: text("nickname").unique(),
  imageUrl: text("image_url"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sentences = pgTable("sentences", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  writerSub: text("writer_sub"),
  text: text("text").notNull(),
  status: sentenceStatus("status").default("draft").notNull(),
  emotionTags: text("emotion_tags").array().default([]).notNull(),
  isHidden: boolean("is_hidden").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const articles = pgTable("articles", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  writerSub: text("writer_sub"),
  title: text("title"),
  body: text("body").notNull(),
  sourceSentenceIds: bigint("source_sentence_ids", { mode: "number" })
    .array()
    .default([])
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sentenceUsages = pgTable("sentence_usages", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  sentenceId: bigint("sentence_id", { mode: "number" }),
  usedInArticleId: bigint("used_in_article_id", { mode: "number" }),
  usedBySub: text("used_by_sub"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reports = pgTable("reports", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  sentenceId: bigint("sentence_id", { mode: "number" }),
  reporterSub: text("reporter_sub"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
