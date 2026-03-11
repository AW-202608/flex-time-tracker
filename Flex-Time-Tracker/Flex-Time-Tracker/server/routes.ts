import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.workLogs.list.path, async (_req, res) => {
    const logs = await storage.getWorkLogs();
    res.json(logs);
  });

  app.post(api.workLogs.createOrUpdate.path, async (req, res) => {
    try {
      const input = api.workLogs.createOrUpdate.input.parse(req.body);
      const log = await storage.createOrUpdateWorkLog(input);
      res.json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.workLogs.delete.path, async (req, res) => {
    await storage.deleteWorkLog(req.params.date);
    res.status(204).end();
  });

  return httpServer;
}
