import { useUsage } from "@/hooks/useUsage";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#f4a261", // --accent-primary
  "#e76f51", // --accent-secondary
  "#ffd166", // --accent-tertiary
  "#8aa8b8", // --neutral-light
  "#4a6a7a", // --neutral-mid
  "#2a9d8f", // --success
];

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <Card className="p-6">
      <Text className="text-sm text-[var(--text-tertiary)] mb-2">{title}</Text>
      <div className="text-3xl font-semibold text-[var(--text-primary)] mb-1">
        {value}
      </div>
      {subtitle && (
        <Text className="text-xs text-[var(--text-tertiary)]">{subtitle}</Text>
      )}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading usage data">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-[var(--glass-bg)] rounded-lg" />
        <div className="h-32 bg-[var(--glass-bg)] rounded-lg" />
        <div className="h-32 bg-[var(--glass-bg)] rounded-lg" />
      </div>
      <div className="h-80 bg-[var(--glass-bg)] rounded-lg" />
      <div className="h-80 bg-[var(--glass-bg)] rounded-lg" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-6xl mb-4">📊</div>
      <Text className="text-xl text-[var(--text-secondary)] mb-2">
        No Usage Data Yet
      </Text>
      <Text className="text-sm text-[var(--text-tertiary)] max-w-md">
        Start chatting with your AI assistants to see token usage and cost
        tracking data here.
      </Text>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <Text className="text-xl text-[var(--text-secondary)] mb-2">
          Failed to Load Usage Data
        </Text>
        <Text className="text-sm text-[var(--text-tertiary)] max-w-md">
          {message}
        </Text>
      </div>
    </Card>
  );
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-3 rounded-lg border border-[var(--glass-border)]">
        <p className="text-sm text-[var(--text-secondary)] mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function CustomPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Don't show labels for slices < 5%

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function UsageDashboard() {
  const { data: usage, isLoading, error } = useUsage();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorState message={error.message} />
      </div>
    );
  }

  if (!usage || usage.total_tokens === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <EmptyState />
      </div>
    );
  }

  // Prepare data for charts
  const dailyData = usage.usage_by_day.map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    "Prompt Tokens": day.prompt_tokens,
    "Completion Tokens": day.completion_tokens,
    "Total Tokens": day.total_tokens,
  }));

  const modelData = usage.usage_by_model.map((model, index) => ({
    name: model.model,
    tokens: model.total_tokens,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-2">
          Usage Dashboard
        </h1>
        <Text className="text-[var(--text-tertiary)]">
          Track your token usage and estimated costs across all sessions
        </Text>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Tokens"
          value={formatNumber(usage.total_tokens)}
          subtitle={`${formatNumber(usage.total_prompt_tokens)} prompt + ${formatNumber(usage.total_completion_tokens)} completion`}
        />
        <StatCard
          title="Total Messages"
          value={formatNumber(usage.total_messages)}
          subtitle="Across all sessions"
        />
        <StatCard
          title="Estimated Cost"
          value={formatCurrency(usage.estimated_cost_usd)}
          subtitle="Based on model pricing"
        />
      </div>

      {/* Line Chart - Tokens Over Time */}
      {dailyData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Token Usage Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={dailyData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(138, 168, 184, 0.2)"
              />
              <XAxis
                dataKey="date"
                stroke="var(--text-tertiary)"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                stroke="var(--text-tertiary)"
                style={{ fontSize: "12px" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                }}
              />
              <Line
                type="monotone"
                dataKey="Prompt Tokens"
                stroke="#f4a261"
                strokeWidth={2}
                dot={{ fill: "#f4a261", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Completion Tokens"
                stroke="#e76f51"
                strokeWidth={2}
                dot={{ fill: "#e76f51", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Pie Chart - Usage by Model */}
      {modelData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Usage by Model
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="tokens"
                >
                  {modelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Model Details */}
            <div className="space-y-3">
              {usage.usage_by_model.map((model, index) => (
                <div
                  key={model.model}
                  className="flex items-start justify-between p-3 rounded-lg bg-[var(--glass-bg-light)] border border-[var(--glass-border)]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                    <div>
                      <Text className="text-sm font-medium text-[var(--text-primary)]">
                        {model.model}
                      </Text>
                      <Text className="text-xs text-[var(--text-tertiary)]">
                        {formatNumber(model.message_count)} messages
                      </Text>
                    </div>
                  </div>
                  <div className="text-right">
                    <Text className="text-sm font-medium text-[var(--text-primary)]">
                      {formatNumber(model.total_tokens)}
                    </Text>
                    <Text className="text-xs text-[var(--text-tertiary)]">
                      {formatCurrency(model.estimated_cost_usd)}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Top Sessions */}
      {usage.usage_by_session.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            Top Sessions
          </h2>
          <div className="space-y-2">
            {usage.usage_by_session.slice(0, 10).map((session) => (
              <div
                key={session.session_id}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--glass-bg-light)] border border-[var(--glass-border)] hover:border-[var(--glass-border-strong)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <Text className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {session.session_title || "Untitled Session"}
                  </Text>
                  <Text className="text-xs text-[var(--text-tertiary)]">
                    {formatNumber(session.message_count)} messages
                  </Text>
                </div>
                <div className="text-right ml-4">
                  <Text className="text-sm font-medium text-[var(--text-primary)]">
                    {formatNumber(session.total_tokens)} tokens
                  </Text>
                  <Text className="text-xs text-[var(--text-tertiary)]">
                    {formatNumber(session.prompt_tokens)} prompt /{" "}
                    {formatNumber(session.completion_tokens)} completion
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
