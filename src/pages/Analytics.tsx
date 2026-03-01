import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { fetchAnalytics, AnalyticsData } from "@/services/analytics";
import AnimatedCounter from "@/components/AnimatedCounter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, Briefcase, Heart, TrendingUp, Code2, Building2 } from "lucide-react";

const CHART_COLORS = [
  "hsl(175, 80%, 50%)", "hsl(260, 70%, 60%)", "hsl(200, 80%, 55%)",
  "hsl(45, 90%, 55%)", "hsl(0, 72%, 55%)", "hsl(140, 60%, 50%)",
  "hsl(300, 60%, 55%)", "hsl(30, 80%, 55%)",
];

const StatCard = ({
  icon: Icon, label, value, suffix = "", delay = 0,
}: {
  icon: any; label: string; value: number; suffix?: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card-hover rounded-xl p-5"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
    </div>
    <AnimatedCounter value={value} suffix={suffix} className="text-3xl font-display font-bold" />
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-xs">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </Layout>
    );
  }

  if (!data) return null;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Campus innovation metrics at a glance</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Users" value={data.totalUsers} delay={0} />
          <StatCard icon={Briefcase} label="Active Projects" value={data.activeProjects} delay={0.05} />
          <StatCard icon={Heart} label="Total Matches" value={data.totalMatches} delay={0.1} />
          <StatCard icon={TrendingUp} label="Completion Rate" value={Math.round(data.projectCompletionRate * 100)} suffix="%" delay={0.15} />
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Code2 className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Most Demanded Skill</p>
            </div>
            <p className="text-xl font-display font-bold gradient-text">{data.topSkill}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-accent" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Most Active Dept</p>
            </div>
            <p className="text-xl font-display font-bold gradient-text-accent">{data.topDepartment}</p>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Skill Demand Bar Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Skill Demand</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.skillDemand.slice(0, 8)}>
                <XAxis dataKey="skill" tick={{ fontSize: 10, fill: "hsl(215, 12%, 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 55%)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Projects" radius={[4, 4, 0, 0]}>
                  {data.skillDemand.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Department Pie Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4">Department Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.departmentActivity}
                  dataKey="count"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data.departmentActivity.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "10px" }}
                  formatter={(value) => <span style={{ color: "hsl(215, 12%, 55%)" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
