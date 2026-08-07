"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PsychologicalState } from "@/src/types";
import { PSYCH_GAUGE_LABELS } from "@/src/data/competencies";

interface PsychologicalGaugesProps {
  start: PsychologicalState;
  end: PsychologicalState;
  height?: number;
}

const KEYS = ["confiance", "interet", "comprehension", "valeurPercue", "pressionRessentie"] as const;

/**
 * Comparaison des cinq jauges internes du personnage au début et à la fin
 * de l'échange. Une pression qui monte est un signal négatif, contrairement
 * aux quatre autres jauges.
 */
export function PsychologicalGauges({ start, end, height = 300 }: PsychologicalGaugesProps) {
  const data = KEYS.map((key) => ({
    jauge: PSYCH_GAUGE_LABELS[key],
    debut: start[key],
    fin: end[key],
  }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }} barGap={4}>
          <CartesianGrid stroke="#f4f4f5" vertical={false} />
          <XAxis
            dataKey="jauge"
            tick={{ fill: "#3f3f46", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#e4e4e7" }}
            interval={0}
            height={48}
            angle={-18}
            textAnchor="end"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "#fafafa" }}
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
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span className="text-graphite">{value}</span>}
          />
          <Bar name="Début" dataKey="debut" fill="#a1a1aa" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Bar name="Fin estimée" dataKey="fin" fill="#f4476b" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
