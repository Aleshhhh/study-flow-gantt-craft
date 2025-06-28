
import { GanttChart } from "@/components/GanttChart";
import { ThemeProvider } from "@/components/ThemeProvider";

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
