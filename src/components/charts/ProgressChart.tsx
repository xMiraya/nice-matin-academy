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
import { CHART_AXIS_TICK, CHART_GRID, CHART_TOOLTIP, NM } from "@/src/lib/theme";

interface ProgressChartProps {
  data: { label: string; score: number }[];
  height?: number;
  /** Ligne de repère horizontale, par exemple la moyenne d'équipe. */
  referenceLabel?: string;
}

/**
 * Liste masquée visuellement mais lue par les technologies d'assistance : un
 * graphique Recharts ne porte par défaut aucune information exploitable par
 * un lecteur d'écran, seulement des tracés SVG. Chaque graphique de ce
 * fichier est donc accompagné des mêmes valeurs sous forme de texte.
 */
function ChartDataList({ items }: { items: { label: string; value: string }[] }) {
  return (
    <ul className="sr-only">
      {items.map((item) => (
        <li key={item.label}>
          {item.label} : {item.value}
        </li>
      ))}
    </ul>
  );
}

/** Courbe d'évolution des scores dans le temps. */
export function ProgressChart({ data, height = 260 }: ProgressChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <div
        role="img"
        aria-label={`Évolution du score, de ${data[0]?.score ?? 0} à ${data.at(-1)?.score ?? 0} sur 100.`}
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="nm-progress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NM.blue} stopOpacity={0.26} />
                <stop offset="100%" stopColor={NM.blue} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="label"
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: NM.line }}
              dy={4}
            />
            <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: NM.line, strokeWidth: 1 }}
              contentStyle={CHART_TOOLTIP}
              formatter={(value: unknown) => [`${value} / 100`, "Score"] as [string, string]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={NM.blue}
              strokeWidth={2.5}
              fill="url(#nm-progress)"
              dot={{ r: 3, fill: "#ffffff", stroke: NM.blue, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: NM.blue, stroke: "#ffffff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartDataList items={data.map((point) => ({ label: point.label, value: `${point.score} / 100` }))} />
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
      <div
        role="img"
        aria-label={`Score moyen de l'équipe par semaine, de ${data[0]?.score ?? 0} à ${data.at(-1)?.score ?? 0} sur 100.`}
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="nm-weekly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={NM.navy} stopOpacity={0.22} />
                <stop offset="100%" stopColor={NM.navy} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="week"
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: NM.line }}
              dy={4}
            />
            <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: NM.line, strokeWidth: 1 }}
              contentStyle={CHART_TOOLTIP}
              formatter={(value: unknown, name: unknown) =>
                [`${value} / 100`, name === "score" ? "Score moyen" : String(name)] as [string, string]
              }
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke={NM.navy}
              strokeWidth={2.5}
              fill="url(#nm-weekly)"
              dot={{ r: 3, fill: "#ffffff", stroke: NM.navy, strokeWidth: 2 }}
              activeDot={{ r: 5, fill: NM.navy, stroke: "#ffffff", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ChartDataList
        items={data.map((point) => ({
          label: point.week,
          value: `${point.score} / 100, ${point.sessions} simulation${point.sessions > 1 ? "s" : ""}`,
        }))}
      />
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
      <div
        role="img"
        aria-label="Nombre de commerciaux par tranche de score."
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="range"
              tick={CHART_AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: NM.line }}
              dy={4}
            />
            <YAxis allowDecimals={false} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} width={44} />
            <Tooltip
              cursor={{ fill: NM.lineSoft }}
              contentStyle={CHART_TOOLTIP}
              formatter={(value: unknown) =>
                [`${value} commercial${Number(value) > 1 ? "aux" : ""}`, "Effectif"] as [string, string]
              }
            />
            <Bar dataKey="count" radius={[8, 8, 4, 4]} isAnimationActive={false} maxBarSize={44}>
              {data.map((entry, index) => (
                <Cell key={entry.range} fill={scoreColor(midpoints[index] ?? 60)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartDataList
        items={data.map((point) => ({
          label: point.range,
          value: `${point.count} commercial${point.count > 1 ? "aux" : ""}`,
        }))}
      />
    </div>
  );
}
