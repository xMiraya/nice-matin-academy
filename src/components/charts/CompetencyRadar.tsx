"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CompetencyScore } from "@/src/types";
import { COMPETENCIES } from "@/src/data/competencies";
import { CHART_TOOLTIP, NM } from "@/src/lib/theme";

interface CompetencyRadarProps {
  scores: CompetencyScore[];
  /** Série de comparaison facultative, par exemple la moyenne d'équipe. */
  comparison?: { label: string; scores: CompetencyScore[] };
  seriesLabel?: string;
  height?: number;
}

/** Radar des huit compétences commerciales. */
export function CompetencyRadar({
  scores,
  comparison,
  seriesLabel = "Score",
  height = 320,
}: CompetencyRadarProps) {
  const byId = new Map(scores.map((s) => [s.competencyId, s.score]));
  const comparisonById = new Map(comparison?.scores.map((s) => [s.competencyId, s.score]) ?? []);

  // Libellés courts sur les axes : ils restent lisibles jusqu'au format mobile.
  const data = COMPETENCIES.map((competency) => ({
    competence: competency.short,
    valeur: byId.get(competency.id) ?? 0,
    comparaison: comparisonById.get(competency.id) ?? 0,
  }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke={NM.line} />
          <PolarAngleAxis
            dataKey="competence"
            tick={{ fill: NM.graphite, fontSize: 11, fontWeight: 500 }}
            tickLine={false}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: NM.muted, fontSize: 10 }} axisLine={false} />
          {comparison ? (
            <Radar
              name={comparison.label}
              dataKey="comparaison"
              stroke={NM.muted}
              fill={NM.muted}
              fillOpacity={0.1}
              strokeDasharray="4 3"
              isAnimationActive={false}
            />
          ) : null}
          <Radar
            name={seriesLabel}
            dataKey="valeur"
            stroke={NM.blue}
            strokeWidth={2}
            fill={NM.blue}
            fillOpacity={0.16}
            isAnimationActive={false}
          />
          <Tooltip
            cursor={{ stroke: NM.line }}
            contentStyle={CHART_TOOLTIP}
            formatter={(value: unknown, name: unknown) =>
              [`${value} / 100`, String(name)] as [string, string]
            }
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
