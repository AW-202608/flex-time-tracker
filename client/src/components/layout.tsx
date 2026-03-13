import React from 'react';
import { Clock } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">FlexTime</span>
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            勤務時間管理
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {children}
      </main>
      
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© {new Date().getFullYear()} FlexTime Manager. Local storage only.</p>
      </footer>
    </div>
  );
}
