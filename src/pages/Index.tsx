
import React, { useState } from 'react';
import { GanttChart } from "@/components/GanttChart";
import { ThemeProvider } from "@/components/ThemeProvider";
import LoginPage from "@/components/LoginPage";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <LoginPage onLogin={handleLogin} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <GanttChart />
      </div>
    </ThemeProvider>
  );
};

export default Index;
