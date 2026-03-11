import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workLogs = pgTable("work_logs", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:mm
  endTime: text("end_time").notNull(), // HH:mm
  actualMinutes: integer("actual_minutes").notNull(), // in minutes
  surplusDeficitMinutes: integer("surplus_deficit_minutes").notNull(), // in minutes
});

export const insertWorkLogSchema = createInsertSchema(workLogs).omit({ id: true });

export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type WorkLog = typeof workLogs.$inferSelect;
