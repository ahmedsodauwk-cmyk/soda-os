import { Camera, FolderKanban, DollarSign, Users } from "lucide-react";
import StatCard from "./stat-card";

export default function KPIGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Today's shoots"
        value="3"
        icon={Camera}
        change="+1 from yesterday"
        trend="up"
      />
      <StatCard
        title="Active projects"
        value="12"
        icon={FolderKanban}
        change="+3 this week"
        trend="up"
      />
      <StatCard
        title="Revenue"
        value="245K"
        icon={DollarSign}
        change="+18% vs last month"
        trend="up"
      />
      <StatCard
        title="Team available"
        value="8"
        icon={Users}
        change="2 on shoot"
        trend="neutral"
      />
    </div>
  );
}
