import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Cinzel",
  src: "https://fonts.gstatic.com/s/cinzel/v23/8vIJ7ww63mVu7gtR-kwKxNvkNOjw-tbnTYrvDE5ZdqU.woff2",
});

Font.register({
  family: "Cormorant Garamond",
  fonts: [
    { src: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3YmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/cormorantgaramond/v16/co3WmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2", fontWeight: 600 },
  ],
});

Font.register({
  family: "DM Sans",
  src: "https://fonts.gstatic.com/s/dmsans/v14/rP2Hp2ywxg089UriCZa4ET-DNl0.woff2",
});

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

const styles = StyleSheet.create({
  page: { backgroundColor: COLORS.cream, fontFamily: "DM Sans", fontSize: 9, padding: 0 },
  header: { backgroundColor: COLORS.olive, padding: "16 24", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: {},
  headerRight: { alignItems: "flex-end" },
  logoText: { fontFamily: "Cinzel", fontSize: 16, color: COLORS.cream, letterSpacing: 4 },
  headerSub: { fontFamily: "Cormorant Garamond", fontSize: 8, color: COLORS.cream, opacity: 0.6, marginTop: 2 },
  headerTitle: { fontFamily: "Cinzel", fontSize: 9, color: COLORS.cream, letterSpacing: 2 },
  section: { margin: "8 16" },
  sectionTitle: { fontFamily: "Cinzel", fontSize: 7, letterSpacing: 3, color: COLORS.olive, textTransform: "uppercase", marginBottom: 6 },
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
  pricePanelValue: { fontFamily: "Cinzel", fontSize: 13, color: COLORS.cream },
  pricePanelSub: { fontSize: 7, color: COLORS.cream, opacity: 0.6, marginTop: 3 },
  narrative: { fontFamily: "Cormorant Garamond", fontSize: 9, color: COLORS.textMid, fontStyle: "italic", lineHeight: 1.5 },
  footer: { margin: "4 16 12", borderTop: `0.5pt solid ${COLORS.sage}`, paddingTop: 6, alignItems: "center" },
  footerText: { fontFamily: "Cormorant Garamond", fontSize: 6.5, color: COLORS.sage, textAlign: "center", lineHeight: 1.6 },
});

interface CMADocumentProps {
  cmaData: {
    params: {
      address: string;
      estate: string;
      propertyType: string;
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

export default function CMADocument({ cmaData }: CMADocumentProps) {
  const { params, result, notes, narrative, today } = cmaData;

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
            <Text style={styles.logoText}>HOME GROUND</Text>
            <Text style={styles.headerSub}>Real Estate</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerTitle}>COMPARABLE MARKET ANALYSIS</Text>
            <Text style={[styles.headerSub, { marginTop: 3 }]}>{params.address}, {params.estate}</Text>
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
              { label: "Estate", value: params.estate },
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
              <View style={{ flex: 1, backgroundColor: COLORS.cream, borderRadius: 4, padding: "10 8", alignItems: "center" }}>
                <Text style={{ fontFamily: "Cormorant Garamond", fontSize: 7, textTransform: "uppercase", letterSpacing: 2, color: COLORS.sage, marginBottom: 3 }}>Original Asking Price</Text>
                <Text style={{ fontFamily: "Cinzel", fontSize: 13, color: COLORS.olive }}>{fmtRand(params.askingPrice)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: COLORS.olive, borderRadius: 4, padding: "10 8", alignItems: "center" }}>
                <Text style={{ fontFamily: "Cormorant Garamond", fontSize: 7, textTransform: "uppercase", letterSpacing: 2, color: COLORS.cream, opacity: 0.7, marginBottom: 3 }}>Market Mid-Point</Text>
                <Text style={{ fontFamily: "Cinzel", fontSize: 13, color: COLORS.cream }}>{fmtRand(result.midMarketPrice)}</Text>
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
              <View key={comp.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? "#F5F1EA80" : COLORS.white }]}>
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
                <Text style={styles.pricePanelSub}>{fmtPpm(ppm)}</Text>
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This report is prepared for informational purposes only and does not constitute a formal valuation. Data sourced from Lightstone.
          </Text>
          <Text style={[styles.footerText, { fontFamily: "Cinzel", letterSpacing: 2, marginTop: 3 }]}>
            HOME GROUND REAL ESTATE | homegroundestates.co.za | Ballito, KwaZulu-Natal North Coast
          </Text>
        </View>
      </Page>
    </Document>
  );
}
