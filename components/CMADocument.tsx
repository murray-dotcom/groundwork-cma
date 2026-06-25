import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Line,
  Path,
  Circle,
} from "@react-pdf/renderer";

const COLORS = {
  olive: "#585339",
  sage: "#87825E",
  bronze: "#B47A05",
  cream: "#F5F1EA",
  offWhite: "#FAFAF8",
  white: "#FFFFFF",
  textDark: "#1a1a1a",
  textMid: "#555555",
};

function fmtRand(n: number) {
  return `R ${Math.round(n).toLocaleString("en-ZA")}`;
}
function fmtPpm(n: number) {
  return `R ${Math.round(n).toLocaleString("en-ZA")}/m²`;
}
function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("en-ZA", { month: "short", year: "numeric" });
}
function fmtMillions(n: number) {
  return `R ${(n / 1_000_000).toFixed(1)}m`;
}
function fmtK(n: number) {
  return `R ${(n / 1_000).toFixed(0)}k`;
}

function toPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cp1x = prev.x + (curr.x - prev.x) / 3;
    const cp1y = prev.y;
    const cp2x = curr.x - (curr.x - prev.x) / 3;
    const cp2y = curr.y;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
  }
  return d;
}

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.cream, fontFamily: "DM Sans", fontSize: 9, padding: 0 },
  header: { backgroundColor: COLORS.olive, padding: "16 24", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: {},
  headerRight: { alignItems: "flex-end" },
  logoText: { fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 16, color: COLORS.cream, letterSpacing: 4 },
  headerSub: { fontFamily: "Cormorant Garamond", fontSize: 8, color: COLORS.cream, opacity: 0.6, marginTop: 2 },
  headerTitle: { fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 9, color: COLORS.cream, letterSpacing: 2 },
  section: { margin: "8 16" },
  sectionTitle: { fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 7, letterSpacing: 3, color: COLORS.olive, textTransform: "uppercase", marginBottom: 6 },
  subjectStrip: { flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 4, overflow: "hidden" },
  subjectCell: { flex: 1, padding: "8 12", borderRight: `0.5pt solid ${COLORS.sage}` },
  subjectLabel: { fontFamily: "Cormorant Garamond", fontSize: 7, textTransform: "uppercase", letterSpacing: 2, color: COLORS.sage },
  subjectValue: { fontSize: 8, fontWeight: 600, color: COLORS.textDark, marginTop: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: COLORS.olive, padding: "5 0" },
  tableHeaderCell: { fontFamily: "Cormorant Garamond", fontSize: 7, textTransform: "uppercase", letterSpacing: 1.5, color: COLORS.cream, paddingHorizontal: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 4 },
  tableCell: { fontSize: 8, color: COLORS.textDark, paddingHorizontal: 6 },
  pricePanel: { flex: 1, borderRadius: 4, padding: "12 8", alignItems: "center" },
  pricePanelLabel: { fontFamily: "Cormorant Garamond", fontSize: 7, textTransform: "uppercase", letterSpacing: 2, color: COLORS.cream, opacity: 0.7, marginBottom: 4 },
  pricePanelValue: { fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 13, color: COLORS.cream },
  pricePanelSub: { fontSize: 7, color: COLORS.cream, opacity: 0.6, marginTop: 3 },
  narrative: { fontFamily: "Cormorant Garamond", fontSize: 9, color: COLORS.textMid, fontStyle: "normal", lineHeight: 1.5 },
  footer: { margin: "4 16 12", borderTop: `0.5pt solid ${COLORS.sage}`, paddingTop: 6, alignItems: "center" },
  footerText: { fontFamily: "Cormorant Garamond", fontSize: 6.5, color: COLORS.sage, textAlign: "center", lineHeight: 1.6 },
});

interface TrendPoint {
  quarter: string;
  median_price: number;
  median_price_per_m2: number;
  count: number;
}

interface CMADocumentProps {
  logoSrc?: string;
  cmaData: {
    trends?: TrendPoint[];
    params: {
      address: string;
      estates: string[];
      propertyType: string;
      schemes?: string[];
      erfSize: number;
      builtArea?: number;
      askingPrice?: number;
    };
    result: {
      comps: Array<{
        id: string;
        address: string;
        size_m2: number;
        built_area_m2?: number;
        sales_price: number;
        price_per_m2: number;
        registration_date: string;
      }>;
      p25PricePerM2: number;
      medianPricePerM2: number;
      p75PricePerM2: number;
      conservativePrice: number;
      midMarketPrice: number;
      strongPrice: number;
    };
    notes: Record<string, string>;
    narrative: string;
    today: string;
  };
}

function TrendChartPDF({ trends }: { trends: TrendPoint[] }) {
  const data = trends.slice(-8);
  const n = data.length;
  if (n < 2) return null;

  // Chart dimensions
  const W = 480;
  const H = 120;
  const padL = 44; // space for left y-axis labels
  const padR = 44; // space for right y-axis labels + last x label
  const padT = 10;
  const padB = 28; // space for x-axis labels

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Left axis: median sale price
  const prices = data.map((d) => d.median_price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  // Right axis: median R/m²
  const ppms = data.map((d) => d.median_price_per_m2).filter((v) => v > 0);
  const minPpm = ppms.length > 0 ? Math.min(...ppms) : 0;
  const maxPpm = ppms.length > 0 ? Math.max(...ppms) : 1;
  const rangePpm = maxPpm - minPpm || 1;

  const toX = (i: number) => padL + (i / (n - 1)) * chartW;
  const toY = (p: number) => padT + chartH - ((p - minP) / range) * chartH;
  const toY2 = (p: number) => padT + chartH - ((p - minPpm) / rangePpm) * chartH;

  const pointObjs = data.map((d, i) => ({ x: toX(i), y: toY(d.median_price) }));
  const pointObjsPpm = data
    .map((d, i) => ({ x: toX(i), y: toY2(d.median_price_per_m2) }))
    .filter((_, i) => data[i].median_price_per_m2 > 0);

  // Y-axis ticks: 3 levels
  const yTicks = [minP, minP + range / 2, maxP];
  const yTicksPpm = [minPpm, minPpm + rangePpm / 2, maxPpm];

  // X-axis: show every other label if tight
  const showLabel = (i: number) => n <= 5 || i % 2 === 0 || i === n - 1;

  return (
    <View>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Grid lines */}
        {yTicks.map((p) => {
          const y = toY(p);
          return (
            <Line
              key={p}
              x1={padL}
              y1={y}
              x2={W - padR}
              y2={y}
              stroke={COLORS.sage}
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Left Y-axis labels (price) */}
        {yTicks.map((p) => (
          <Text
            key={p}
            x={padL - 3}
            y={toY(p) + 2.5}
            style={{ fontSize: 6, fill: COLORS.textMid }}
            textAnchor="end"
          >
            {fmtMillions(p)}
          </Text>
        ))}

        {/* Right Y-axis labels (R/m²) */}
        {yTicksPpm.map((p) => (
          <Text
            key={`ppm-${p}`}
            x={W - padR + 3}
            y={toY2(p) + 2.5}
            style={{ fontSize: 6, fill: COLORS.sage }}
            textAnchor="start"
          >
            {fmtK(p)}
          </Text>
        ))}

        {/* Smooth bezier curve — median price (bronze) */}
        <Path
          d={toPath(pointObjs)}
          stroke={COLORS.bronze}
          strokeWidth={2}
          fill="none"
        />

        {/* Smooth bezier curve — median R/m² (sage, dashed) */}
        {pointObjsPpm.length >= 2 && (
          <Path
            d={toPath(pointObjsPpm)}
            stroke={COLORS.sage}
            strokeWidth={1.5}
            strokeDasharray="4 2"
            fill="none"
          />
        )}

        {/* Price dots and x-axis labels */}
        {pointObjs.map((pt, i) => (
          <React.Fragment key={data[i].quarter}>
            <Circle cx={pt.x} cy={pt.y} r={3.5} fill={COLORS.bronze} />
            {showLabel(i) && (
              <Text
                x={pt.x}
                y={H - 8}
                style={{ fontSize: 6, fill: COLORS.textMid }}
                textAnchor="middle"
              >
                {data[i].quarter}
              </Text>
            )}
          </React.Fragment>
        ))}

        {/* R/m² dots */}
        {pointObjsPpm.map((pt, i) => (
          <Circle key={`ppm-dot-${i}`} cx={pt.x} cy={pt.y} r={2.5} fill={COLORS.sage} />
        ))}
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 14, marginTop: 3, marginRight: padR }}>
        <Text style={{ fontSize: 6, color: COLORS.bronze }}>— Median price</Text>
        <Text style={{ fontSize: 6, color: COLORS.sage }}>- - Median R/m² ERF</Text>
      </View>
    </View>
  );
}

export default function CMADocument({ cmaData, logoSrc }: CMADocumentProps) {
  const { params, result, notes, narrative, trends, today } = cmaData;

  const closestId = result.comps.length > 0
    ? result.comps.reduce((best, c) => {
        const d = Math.abs(c.size_m2 - params.erfSize);
        const bd = Math.abs(best.size_m2 - params.erfSize);
        return d < bd ? c : best;
      }, result.comps[0]).id
    : "";

  const colWidths = { address: 130, date: 48, erf: 36, built: 36, price: 68, ppm: 52, note: 80 };

  return (
    <Document>
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={logoSrc ?? "/images/logo_2.png"} style={{ height: 60 }} />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>COMPARABLE MARKET ANALYSIS</Text>
            <Text style={[styles.headerSub, { marginTop: 3 }]}>{params.address}, {params.estates.join(" + ")}</Text>
            <Text style={[styles.headerSub, { marginTop: 1 }]}>Prepared: {today} | Lightstone Data</Text>
          </View>
        </View>

        {/* Subject property strip */}
        <View style={styles.section}>
          <View style={styles.subjectStrip}>
            {[
              { label: "Subject Property", value: params.address },
              { label: "ERF Size", value: `${params.erfSize} m²` },
              { label: "Built Area", value: params.builtArea ? `${params.builtArea} m²` : "—" },
              { label: "Estate", value: params.estates.join(" + ") },
            ].map(({ label, value }, i) => (
              <View key={label} style={[styles.subjectCell, i === 3 ? { borderRight: 0 } : {}]}>
                <Text style={styles.subjectLabel}>{label}</Text>
                <Text style={styles.subjectValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Negotiation position */}
        {params.askingPrice && params.askingPrice > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Negotiation Position</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1, backgroundColor: "#F5F1EA", borderRadius: 6, padding: 20, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                <Text style={{ fontFamily: "Cormorant Garamond", fontSize: 7, textTransform: "uppercase", letterSpacing: 2, color: COLORS.sage, marginBottom: 3 }}>Original Asking Price</Text>
                <Text style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 13, color: COLORS.olive }}>{fmtRand(params.askingPrice)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: COLORS.olive, borderRadius: 4, padding: "10 8", alignItems: "center" }}>
                <Text style={{ fontFamily: "Cormorant Garamond", fontSize: 7, textTransform: "uppercase", letterSpacing: 2, color: COLORS.cream, opacity: 0.7, marginBottom: 3 }}>Market Mid-Point</Text>
                <Text style={{ fontFamily: "Cormorant Garamond", fontWeight: 700, fontSize: 13, color: COLORS.cream }}>{fmtRand(result.midMarketPrice)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Comparable sales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparable Sales</Text>
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: colWidths.address }]}>Address</Text>
              <Text style={[styles.tableHeaderCell, { width: colWidths.date }]}>Sale Date</Text>
              <Text style={[styles.tableHeaderCell, { width: colWidths.erf }]}>ERF m²</Text>
              <Text style={[styles.tableHeaderCell, { width: colWidths.built }]}>Built m²</Text>
              <Text style={[styles.tableHeaderCell, { width: colWidths.price }]}>Sale Price</Text>
              <Text style={[styles.tableHeaderCell, { width: colWidths.ppm }]}>R/m²</Text>
              <Text style={[styles.tableHeaderCell, { width: colWidths.note }]}>Note</Text>
            </View>
            {result.comps.map((comp, i) => (
              <View key={comp.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? "#F5F1EA" : COLORS.white }]}>
                <Text style={[styles.tableCell, { width: colWidths.address }]}>
                  {comp.address}{comp.id === closestId ? " ★" : ""}
                </Text>
                <Text style={[styles.tableCell, { width: colWidths.date }]}>{fmtDate(comp.registration_date)}</Text>
                <Text style={[styles.tableCell, { width: colWidths.erf }]}>{comp.size_m2}</Text>
                <Text style={[styles.tableCell, { width: colWidths.built }]}>{comp.built_area_m2 ?? "—"}</Text>
                <Text style={[styles.tableCell, { width: colWidths.price, fontWeight: 600 }]}>{fmtRand(comp.sales_price)}</Text>
                <Text style={[styles.tableCell, { width: colWidths.ppm }]}>{fmtPpm(comp.price_per_m2)}</Text>
                <Text style={[styles.tableCell, { width: colWidths.note, color: COLORS.textMid }]}>{notes[comp.id] ?? ""}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price trend line chart */}
        {trends && trends.length >= 2 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Trend — {params.estates.join(" + ")}</Text>
            <View style={{ backgroundColor: COLORS.white, borderRadius: 4, padding: "8 4" }}>
              <TrendChartPDF trends={trends} />
            </View>
          </View>
        )}

        {/* Price panels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market-Derived Price Indication</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { label: "Conservative", price: result.conservativePrice, ppm: result.p25PricePerM2, bg: COLORS.sage },
              { label: "Mid-Market", price: result.midMarketPrice, ppm: result.medianPricePerM2, bg: COLORS.olive },
              { label: "Strong Market", price: result.strongPrice, ppm: result.p75PricePerM2, bg: COLORS.bronze },
            ].map(({ label, price, ppm, bg }) => (
              <View key={label} style={[styles.pricePanel, { backgroundColor: bg }]}>
                <Text style={styles.pricePanelLabel}>{label}</Text>
                <Text style={styles.pricePanelValue}>{fmtRand(price)}</Text>
                <Text style={styles.pricePanelSub}>@ {fmtPpm(ppm)} ERF</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recommended range + narrative */}
        <View style={[styles.section, { backgroundColor: COLORS.white, borderRadius: 4, padding: "10 12" }]}>
          <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>
            RECOMMENDED NEGOTIATED RANGE: {fmtRand(result.conservativePrice)} – {fmtRand(result.strongPrice)}
          </Text>
          <Text style={styles.narrative}>{narrative}</Text>
        </View>

        {/* Footer — wrap={false} prevents splitting onto a new page */}
        <View style={styles.footer} wrap={false}>
          <Text style={styles.footerText}>
            This report is prepared for informational purposes only and does not constitute a formal valuation. Data sourced from Lightstone.
          </Text>
          <Text style={[styles.footerText, { fontFamily: "Cormorant Garamond", fontWeight: 700, letterSpacing: 2, marginTop: 3 }]}>
            HOME GROUND REAL ESTATE | homegroundestates.co.za | Ballito, KwaZulu-Natal North Coast
          </Text>
        </View>
      </Page>
    </Document>
  );
}
