import type { WorkLog, InsertWorkLog } from "@shared/schema";

export interface IStorage {
  getWorkLogs(): Promise<WorkLog[]>;
  getWorkLog(date: string): Promise<WorkLog | undefined>;
  createOrUpdateWorkLog(log: InsertWorkLog): Promise<WorkLog>;
  deleteWorkLog(date: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private workLogs: Map<string, WorkLog>;
  private currentId: number;

  constructor() {
    this.workLogs = new Map();
    this.currentId = 1;
  }

  async getWorkLogs(): Promise<WorkLog[]> {
    return Array.from(this.workLogs.values());
  }

  async getWorkLog(date: string): Promise<WorkLog | undefined> {
    return this.workLogs.get(date);
  }

  async createOrUpdateWorkLog(insertLog: InsertWorkLog): Promise<WorkLog> {
    const existing = this.workLogs.get(insertLog.date);
    if (existing) {
      const updated = { ...existing, ...insertLog };
      this.workLogs.set(insertLog.date, updated);
      return updated;
    }
    const log: WorkLog = { ...insertLog, id: this.currentId++ };
    this.workLogs.set(insertLog.date, log);
    return log;
  }

  async deleteWorkLog(date: string): Promise<void> {
    this.workLogs.delete(date);
  }
}

export const storage = new MemStorage();
