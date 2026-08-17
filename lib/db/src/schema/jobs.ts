import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location").notNull(),
  workMode: text("work_mode").notNull(),
  jobType: text("job_type").notNull(),
  category: text("category").notNull(),
  salary: text("salary").notNull(),
  description: text("description").notNull(),
  skills: text("skills").array().notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
  featured: integer("featured").notNull().default(0),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({
  id: true,
  postedAt: true,
});
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
