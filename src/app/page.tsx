import Dashboard from "@/components/dashboard";
import { DashboardProvider } from "@/lib/store/dashboard-store";

export default function Home() {
  return (
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}
