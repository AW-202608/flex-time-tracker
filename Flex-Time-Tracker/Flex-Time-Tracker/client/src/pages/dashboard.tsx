import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/layout';
import { useWorkLogs, useSaveWorkLog, useDeleteWorkLog } from '@/hooks/use-work-logs';
import { parseWorkTime, formatMinutes, getStandardWorkingMinutes } from '@/lib/time-utils';
import { format, startOfMonth, isSameMonth, isToday } from 'date-fns';
import { ja } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, ArrowRight, Trash2, Calendar, 
  Clock, TrendingUp, CheckCircle2, ChevronLeft, ChevronRight, Edit2, X
} from 'lucide-react';

export default function Dashboard() {
  const { data: logs, isLoading } = useWorkLogs();
  const { mutate: saveLog, isPending: isSaving } = useSaveWorkLog();
  const { mutate: deleteLog } = useDeleteWorkLog();

  const [inputVal, setInputVal] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Derived state based on current viewed month
  const currentMonthLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => isSameMonth(new Date(log.date), currentDate));
  }, [logs, currentDate]);

  const stats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    
    const standardMins = getStandardWorkingMinutes(year, month);
    
    const actualMins = currentMonthLogs.reduce((acc, log) => acc + log.actualMinutes, 0);
    const surplusMins = currentMonthLogs.reduce((acc, log) => acc + log.surplusDeficitMinutes, 0);

    return {
      standardMins,
      actualMins,
      surplusMins
    };
  }, [currentMonthLogs, currentDate]);

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = parseWorkTime(inputVal);
    if (!parsed) {
      setErrorMsg("入力形式が正しくありません。例：9:30-18:30 または 9:30～18:30 (5分単位)");
      return;
    }

    saveLog({
      date: selectedDate,
      ...parsed
    }, {
      onSuccess: () => {
        setInputVal('');
        setEditingDate(null);
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        // Ensure we are viewing the correct month
        if (!isSameMonth(new Date(selectedDate), currentDate)) {
          setCurrentDate(new Date(selectedDate));
        }
      }
    });
  };

  const handleEditLog = (log: any) => {
    setEditingDate(log.date);
    setSelectedDate(log.date);
    setInputVal(`${log.startTime}-${log.endTime}`);
  };

  const handleCancelEdit = () => {
    setEditingDate(null);
    setInputVal('');
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <Layout>
      <div className="space-y-8">
        
        {/* Error Alert */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-destructive/10 border-l-4 border-destructive text-destructive px-6 py-4 rounded-r-xl shadow-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">エラー</h4>
                <p className="text-sm mt-1">{errorMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Section */}
        <section className="bg-card rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-border/60">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            {editingDate ? '稼働を編集' : '稼働を記録'}
          </h2>
          <form onSubmit={handleInputSubmit} className="space-y-4">
            {/* Date and Time Input Row */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl">
              <div className="flex-1 relative">
                <label className="text-sm text-muted-foreground mb-2 block">日付</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                />
              </div>
              <div className="flex-1 relative">
                <label className="text-sm text-muted-foreground mb-2 block">勤務時間</label>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="例: 10:00-19:00"
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border text-lg transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/50 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!inputVal.trim() || isSaving}
                className="flex-1 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isSaving ? "記録中..." : editingDate ? "更新" : "登録"}
                <ArrowRight className="w-4 h-4" />
              </button>
              {editingDate && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  キャンセル
                </button>
              )}
            </div>
          </form>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            * 休憩1時間固定・5分単位で入力してください
          </p>
        </section>

        {/* Header with Month Navigation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-12 mb-6">
          <h2 className="text-2xl font-bold tracking-tight">ダッシュボード</h2>
          
          <div className="flex items-center bg-card rounded-full p-1 border border-border shadow-sm">
            <button 
              onClick={prevMonth}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={goToToday}
              className="px-4 py-1.5 text-sm font-semibold hover:bg-muted rounded-full transition-colors mx-1"
            >
              {format(currentDate, 'yyyy年 M月')}
            </button>
            <button 
              onClick={nextMonth}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border/60 shadow-sm relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 text-primary/5">
              <Calendar className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 relative z-10">月間総所定労働時間</h3>
            <div className="text-3xl font-bold text-foreground relative z-10">
              {formatMinutes(stats.standardMins)}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-6 border border-border/60 shadow-sm relative overflow-hidden"
          >
             <div className="absolute -right-4 -top-4 text-primary/5">
              <Clock className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 relative z-10">累計実労働時間</h3>
            <div className="text-3xl font-bold text-foreground relative z-10">
               {formatMinutes(stats.actualMins)}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-6 border border-border/60 shadow-sm relative overflow-hidden"
          >
             <div className="absolute -right-4 -top-4 text-primary/5">
              <TrendingUp className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 relative z-10">現時点の累計過不足</h3>
            <div className={`text-3xl font-bold relative z-10 ${stats.surplusMins < 0 ? 'text-[hsl(var(--deficit))]' : stats.surplusMins > 0 ? 'text-[hsl(var(--surplus))]' : 'text-foreground'}`}>
               {stats.surplusMins === 0 
                  ? "±0時間00分" 
                  : stats.surplusMins < 0 
                    ? `あと${formatMinutes(Math.abs(stats.surplusMins))}不足`
                    : `${formatMinutes(stats.surplusMins)}超過`
               }
            </div>
          </motion.div>
        </section>

        {/* Logs Table */}
        <section className="bg-card rounded-2xl border border-border/60 shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-5 border-b border-border/50 bg-muted/20">
            <h3 className="font-semibold">稼働履歴</h3>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 text-center text-muted-foreground animate-pulse">
                読み込み中...
              </div>
            ) : currentMonthLogs.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4 text-muted-foreground">
                  <Calendar className="w-8 h-8" />
                </div>
                <p className="text-muted-foreground">この月の記録はまだありません</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">日付</th>
                    <th className="px-6 py-4 font-medium">勤務時間</th>
                    <th className="px-6 py-4 font-medium text-right">実労働</th>
                    <th className="px-6 py-4 font-medium text-right">過不足</th>
                    <th className="px-6 py-4 font-medium text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <AnimatePresence>
                    {currentMonthLogs.map((log) => {
                      const logDate = new Date(log.date);
                      const isNegative = log.surplusDeficitMinutes < 0;
                      const isPositive = log.surplusDeficitMinutes > 0;
                      
                      return (
                        <motion.tr 
                          key={log.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          <td className="px-6 py-4 font-medium">
                            {format(logDate, 'M月d日 (E)', { locale: ja })}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {log.startTime} - {log.endTime}
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {formatMinutes(log.actualMinutes)}
                          </td>
                          <td className={`px-6 py-4 text-right font-bold ${isNegative ? 'text-[hsl(var(--deficit))]' : isPositive ? 'text-[hsl(var(--surplus))]' : 'text-muted-foreground'}`}>
                            {formatMinutes(log.surplusDeficitMinutes, true)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditLog(log)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                title="編集"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if(confirm('この記録を削除しますか？')) {
                                    deleteLog(log.date);
                                  }
                                }}
                                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
