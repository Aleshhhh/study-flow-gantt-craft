
import { ThemeProvider } from "@/components/ThemeProvider";
import GanttChart from "@/components/GanttChart";

const Index = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <GanttChart />
      </div>
    </ThemeProvider>
  );
};

export default Index;
