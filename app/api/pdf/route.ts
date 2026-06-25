import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, Font, type DocumentProps } from "@react-pdf/renderer";
import CMADocument from "@/components/CMADocument";
import fs from "fs";
import path from "path";

const fontsDir = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "Cormorant Garamond",
  fonts: [
    {
      src: path.join(fontsDir, "CormorantGaramond-Regular.ttf"),
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: path.join(fontsDir, "CormorantGaramond-Italic.ttf"),
      fontWeight: 400,
      fontStyle: "italic",
    },
  ],
});
Font.register({
  family: "DM Sans",
  src: path.join(fontsDir, "DMSans-Regular.ttf"),
});
Font.register({
  family: "Cinzel",
  src: path.join(fontsDir, "Cinzel-Regular.ttf"),
});
Font.registerHyphenationCallback((word) => [word]);

function getLogoDataUrl(): string | undefined {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo_2.png");
    const data = fs.readFileSync(logoPath);
    return `data:image/png;base64,${data.toString("base64")}`;
  } catch {
    console.warn("[/api/pdf] logo not found, omitting from PDF");
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  try {
    const cmaData = await req.json();
    const logoSrc = getLogoDataUrl();

    const buffer = await renderToBuffer(
      React.createElement(CMADocument, { cmaData, logoSrc }) as React.ReactElement<DocumentProps>
    );

    const address = (cmaData?.params?.address ?? "CMA").replace(/\s+/g, "_");
    const date = new Date().toISOString().split("T")[0];
    const filename = `${address}_CMA_${date}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[/api/pdf] PDF render error:", error);
    return NextResponse.json(
      {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
