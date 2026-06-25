import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, Font, type DocumentProps } from "@react-pdf/renderer";
import CMADocument from "@/components/CMADocument";
import fs from "fs";
import path from "path";

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
