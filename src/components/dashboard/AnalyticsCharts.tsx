"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

type AnalyticsData = {
  totals: {
    invites: number;
    signups: number;
    firstHeadshots: number;
    headshotFav: number;
    uploaded: number;
  };
  weekly: {
    invites: number;
    signups: number;
    firstHeadshots: number;
  };
  daily: Array<{
    date: string;
    signups: number;
    firstHeadshots: number;
    uploaded: number;
  }>;
};

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
] as const;

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  // Chart 1: Total counts bar chart
  const totalCountsData = [
    {
      name: "Invites",
      value: data.totals.invites,
      fill: COLORS[0],
    },
    {
      name: "Sign Ups",
      value: data.totals.signups,
      fill: COLORS[1],
    },
    {
      name: "First Headshots",
      value: data.totals.firstHeadshots,
      fill: COLORS[2],
    },
    {
      name: "Headshot Fav",
      value: data.totals.headshotFav,
      fill: COLORS[3],
    },
    {
      name: "Uploaded to LinkedIn",
      value: data.totals.uploaded,
      fill: COLORS[4],
    },
  ];

  // Chart 2: Daily line chart
  const dailyChartData = data.daily.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "Sign Ups": d.signups,
    "First Headshots": d.firstHeadshots,
    "Uploaded to LinkedIn": d.uploaded,
  }));

  // Chart 3: Invites vs Sign Ups (Weekly)
  const invitesSignupsData = [
    { name: "Invites", value: data.weekly.invites, fill: COLORS[0] },
    { name: "Sign Ups", value: data.weekly.signups, fill: COLORS[1] },
  ];

  // Chart 4: Sign Ups vs First Headshots (Weekly)
  const signupsHeadshotsData = [
    { name: "Sign Ups", value: data.weekly.signups, fill: COLORS[1] },
    { name: "First Headshots", value: data.weekly.firstHeadshots, fill: COLORS[2] },
  ];

  // Chart 5: First Headshots vs Favorites (Total)
  const headshotsFavData = [
    { name: "First Headshots", value: data.totals.firstHeadshots, fill: COLORS[2] },
    { name: "Headshot Fav", value: data.totals.headshotFav, fill: COLORS[3] },
  ];

  // Chart 6: Favorites vs Uploaded (Total)
  const favUploadedData = [
    { name: "Headshot Fav", value: data.totals.headshotFav, fill: COLORS[3] },
    { name: "Uploaded to LinkedIn", value: data.totals.uploaded, fill: COLORS[4] },
  ];

  return (
    <div className="space-y-6">
      {/* Chart 1: Bar Chart - Full Width */}
      <Card className="rounded-xl border-border/50 bg-muted/50">
        <CardHeader>
          <CardTitle>Total Metrics Overview</CardTitle>
          <CardDescription>All-time counts across all metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: {
                label: "Count",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px] w-full"
          >
            <BarChart data={totalCountsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Chart 2: Line Chart - Full Width */}
      <Card className="rounded-xl border-border/50 bg-muted/50">
        <CardHeader>
          <CardTitle>Weekly Activity Trends</CardTitle>
          <CardDescription>Daily breakdown for the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              "Sign Ups": {
                label: "Sign Ups",
                color: COLORS[1],
              },
              "First Headshots": {
                label: "First Headshots",
                color: COLORS[2],
              },
              "Uploaded to LinkedIn": {
                label: "Uploaded to LinkedIn",
                color: COLORS[4],
              },
            }}
            className="h-[300px] w-full"
          >
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="Sign Ups"
                stroke={COLORS[1]}
                strokeWidth={2}
                dot={{ fill: COLORS[1] }}
              />
              <Line
                type="monotone"
                dataKey="First Headshots"
                stroke={COLORS[2]}
                strokeWidth={2}
                dot={{ fill: COLORS[2] }}
              />
              <Line
                type="monotone"
                dataKey="Uploaded to LinkedIn"
                stroke={COLORS[4]}
                strokeWidth={2}
                dot={{ fill: COLORS[4] }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Charts 3-6: Donut Charts - Half Width */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 3 */}
        <Card className="rounded-xl border-border/50 bg-muted/50">
          <CardHeader>
            <CardTitle>Invites vs Sign Ups</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Count",
                },
              }}
              className="h-[250px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={invitesSignupsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {invitesSignupsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chart 4 */}
        <Card className="rounded-xl border-border/50 bg-muted/50">
          <CardHeader>
            <CardTitle>Sign Ups vs First Headshots</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Count",
                },
              }}
              className="h-[250px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={signupsHeadshotsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {signupsHeadshotsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chart 5 */}
        <Card className="rounded-xl border-border/50 bg-muted/50">
          <CardHeader>
            <CardTitle>First Headshots vs Favorites</CardTitle>
            <CardDescription>All-time totals</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Count",
                },
              }}
              className="h-[250px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={headshotsFavData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {headshotsFavData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Chart 6 */}
        <Card className="rounded-xl border-border/50 bg-muted/50">
          <CardHeader>
            <CardTitle>Favorites vs Uploaded</CardTitle>
            <CardDescription>All-time totals</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Count",
                },
              }}
              className="h-[250px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={favUploadedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {favUploadedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
