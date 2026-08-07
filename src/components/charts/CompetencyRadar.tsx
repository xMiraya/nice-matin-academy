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
          <PolarGrid stroke="#e4e4e7" />
          <PolarAngleAxis
            dataKey="competence"
            tick={{ fill: "#3f3f46", fontSize: 11 }}
            tickLine={false}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} />
          {comparison ? (
            <Radar
              name={comparison.label}
              dataKey="comparaison"
              stroke="#a1a1aa"
              fill="#a1a1aa"
              fillOpacity={0.12}
              isAnimationActive={false}
            />
          ) : null}
          <Radar
            name={seriesLabel}
            dataKey="valeur"
            stroke="#f4476b"
            fill="#f4476b"
            fillOpacity={0.22}
            isAnimationActive={false}
          />
          <Tooltip
            cursor={{ stroke: "#e4e4e7" }}
            contentStyle={{
              borderRadius: 6,
              border: "1px solid #e4e4e7",
              fontSize: 12,
              boxShadow: "none",
            }}
            formatter={(value: unknown, name: unknown) =>
              [`${value} / 100`, String(name)] as [string, string]
            }
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
