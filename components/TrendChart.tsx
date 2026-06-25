"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";
import type { TrendPoint } from "@/lib/getTrends";

interface TrendChartProps {
  data: TrendPoint[];
  estate: string;
}

function fmtYAxis(value: number): string {
  if (value >= 1_000_000) return `R ${(value / 1_000_000).toFixed(0)}m`;
  if (value >= 1_000) return `R ${(value / 1_000).toFixed(0)}k`;
  return `R ${value}`;
}

function fmtTooltipPrice(value: number): string {
  return `R ${Math.round(value).toLocaleString("en-ZA")}`;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: TrendPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const { value, payload: point } = payload[0];
  return (
    <div className="bg-white border border-sage/30 rounded px-3 py-2 shadow-sm font-dm-sans text-xs text-gray-700">
      <p className="font-semibold text-olive mb-0.5">{label}</p>
      <p>Median {fmtTooltipPrice(value)}</p>
      <p className="text-sage">{point.count} sale{point.count === 1 ? "" : "s"}</p>
    </div>
  );
}

function CustomDot(props: {
  cx?: number;
  cy?: number;
  payload?: TrendPoint;
}) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4} fill="#B47A05" stroke="#fff" strokeWidth={1.5} />;
}

export default function TrendChart({ data, estate }: TrendChartProps) {
  const limitedData = data.length > 0 && data.length < 4;

  if (data.length === 0) {
    return (
      <p className="font-cormorant text-sm text-sage/70 italic text-center py-6">
        No trend data available for this selection.
      </p>
    );
  }

  return (
    <div>
      {limitedData && (
        <p className="font-cormorant text-xs text-sage italic mb-3">
          Limited trend data — more sales history needed
        </p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#87825E22" />
          <XAxis
            dataKey="quarter"
            tick={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fill: "#87825E" }}
            axisLine={{ stroke: "#87825E44" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtYAxis}
            tick={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fill: "#87825E" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="median_price"
            stroke="#B47A05"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 5, fill: "#B47A05" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="font-cormorant text-xs text-sage/60 text-right mt-1">
        Median sale price per quarter · {estate}
      </p>
    </div>
  );
}
