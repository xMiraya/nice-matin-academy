"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { scoreColor } from "@/src/lib/format";

const AXIS_TICK = { fill: "#71717a", fontSize: 11 } as const;

const TOOLTIP_STYLE = {
  borderRadius: 6,
  border: "1px solid #e4e4e7",
  fontSize: 12,
  boxShadow: "none",
} as const;

interface ProgressChartProps {
  data: { label: string; score: number }[];
  height?: number;
  /** Ligne de repère horizontale, par exemple la moyenne d'équipe. */
  referenceLabel?: string;
}

/** Courbe d'évolution des scores dans le temps. */
export function ProgressChart({ data, height = 260 }: ProgressChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="nm-progress" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4476b" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#f4476b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f4f4f5" vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} />
          <YAxis domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: unknown) => [`${value} / 100`, "Score"] as [string, string]}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#f4476b"
            strokeWidth={2}
            fill="url(#nm-progress)"
            dot={{ r: 3, fill: "#f4476b", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Évolution hebdomadaire de l'équipe : score moyen et volume de simulations. */
export function WeeklyEvolutionChart({
  data,
  height = 260,
}: {
  data: { week: string; score: number; sessions: number }[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="nm-weekly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#377dff" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#377dff" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f4f4f5" vertical={false} />
          <XAxis dataKey="week" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} />
          <YAxis domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: unknown, name: unknown) =>
              [`${value} / 100`, name === "score" ? "Score moyen" : String(name)] as [string, string]
            }
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#377dff"
            strokeWidth={2}
            fill="url(#nm-weekly)"
            dot={{ r: 3, fill: "#377dff", strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Répartition des commerciaux par tranche de score. */
export function ScoreDistributionChart({
  data,
  height = 260,
}: {
  data: { range: string; count: number }[];
  height?: number;
}) {
  const midpoints = [20, 48, 63, 78, 93];
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="#f4f4f5" vertical={false} />
          <XAxis dataKey="range" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            cursor={{ fill: "#fafafa" }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: unknown) =>
              [`${value} commercial${Number(value) > 1 ? "aux" : ""}`, "Effectif"] as [string, string]
            }
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false} maxBarSize={56}>
            {data.map((entry, index) => (
              <Cell key={entry.range} fill={scoreColor(midpoints[index] ?? 60)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
