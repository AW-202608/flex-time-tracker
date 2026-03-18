import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types matching the schema
export interface WorkLog {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  actualMinutes: number;
  surplusDeficitMinutes: number;
}

export type InsertWorkLog = Omit<WorkLog, "id">;

const STORAGE_KEY = 'flextime_work_logs';

// Helper to simulate network delay for better UX
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

function getStoredLogs(): WorkLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse logs from local storage", e);
    return [];
  }
}

function saveStoredLogs(logs: WorkLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

// ============================================
// HOOKS
// ============================================

export function useWorkLogs() {
  return useQuery({
    queryKey: ['work-logs'],
    queryFn: async () => {
      await delay(200); // Simulate loading
      const logs = getStoredLogs();
      // Sort descending by date
      return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });
}

export function useSaveWorkLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newLog: InsertWorkLog) => {
      await delay(300);
      const logs = getStoredLogs();
      
      const existingIndex = logs.findIndex(l => l.date === newLog.date);
      
      if (existingIndex >= 0) {
        // Update existing for that day
        logs[existingIndex] = { ...logs[existingIndex], ...newLog };
      } else {
        // Insert new
        const id = logs.length > 0 ? Math.max(...logs.map(l => l.id)) + 1 : 1;
        logs.push({ id, ...newLog });
      }
      
      saveStoredLogs(logs);
      return newLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-logs'] });
    },
  });
}

export function useDeleteWorkLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (date: string) => {
      await delay(200);
      const logs = getStoredLogs();
      const filteredLogs = logs.filter(l => l.date !== date);
      saveStoredLogs(filteredLogs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-logs'] });
    }
  });
}
