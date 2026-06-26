"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrendPoint } from "@/lib/getTrends";

interface TrendChartProps {
  data: TrendPoint[];
  estate: string;
}

function fmtYAxisLeft(value: number): string {
  if (value >= 1_000_000) return `R ${(value / 1_000_000).toFixed(0)}m`;
  if (value >= 1_000) return `R ${(value / 1_000).toFixed(0)}k`;
  return `R ${value}`;
}

function fmtYAxisRight(value: number): string {
  if (value >= 1_000) return `R ${(value / 1_000).toFixed(0)}k`;
  return `R ${value}`;
}

function fmtTooltipPrice(value: number): string {
  return `R ${Math.round(value).toLocaleString("en-ZA")}`;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload: TrendPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const priceEntry = payload.find((p) => p.dataKey === "median_price");
  const ppmEntry = payload.find((p) => p.dataKey === "median_price_per_m2");
  const count = payload[0]?.payload?.count ?? 0;
  return (
    <div className="bg-white border border-sage/30 rounded px-3 py-2 shadow-sm font-dm-sans text-xs text-gray-700">
      <p className="font-semibold text-olive mb-1">{label}</p>
      {priceEntry && (
        <p style={{ color: "#B47A05" }}>Median {fmtTooltipPrice(priceEntry.value)}</p>
      )}
      {ppmEntry && (
        <p style={{ color: "#87825E" }}>R/m² ERF {fmtTooltipPrice(ppmEntry.value)}</p>
      )}
      <p className="text-sage/60 mt-0.5">
        {count} sale{count === 1 ? "" : "s"}
        {count === 1 && <span className="ml-1 italic">(indicative)</span>}
      </p>
    </div>
  );
}

function CustomDotBronze(props: { cx?: number; cy?: number; payload?: TrendPoint }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const single = payload?.count === 1;
  return (
    <circle
      cx={cx} cy={cy} r={4}
      fill={single ? "#fff" : "#B47A05"}
      stroke="#B47A05"
      strokeWidth={1.5}
    />
  );
}

function CustomDotSage(props: { cx?: number; cy?: number; payload?: TrendPoint }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const single = payload?.count === 1;
  return (
    <circle
      cx={cx} cy={cy} r={3}
      fill={single ? "#fff" : "#87825E"}
      stroke="#87825E"
      strokeWidth={1.5}
    />
  );
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
      <ResponsiveContainer width="100%" height={220} minWidth={400}>
        <LineChart data={data} margin={{ top: 8, right: 56, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#87825E22" />
          <XAxis
            dataKey="quarter"
            tick={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fill: "#87825E" }}
            axisLine={{ stroke: "#87825E44" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={fmtYAxisLeft}
            tick={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fill: "#87825E" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={fmtYAxisRight}
            tick={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, fill: "#87825E" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="median_price"
            stroke="#B47A05"
            strokeWidth={2}
            dot={<CustomDotBronze />}
            activeDot={{ r: 5, fill: "#B47A05" }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="median_price_per_m2"
            stroke="#87825E"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={<CustomDotSage />}
            activeDot={{ r: 4, fill: "#87825E" }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-end gap-5 mt-2 font-dm-sans text-xs text-sage/70">
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 20, height: 2, backgroundColor: "#B47A05", borderRadius: 1 }} />
          Median sale price
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ display: "inline-block", width: 20, height: 0, borderTop: "2px dashed #87825E" }} />
          Median R/m² ERF
        </span>
        <span className="text-sage/40">· {estate}</span>
      </div>
    </div>
  );
}
