import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, Font, type DocumentProps } from "@react-pdf/renderer";
import CMADocument from "@/components/CMADocument";

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

export async function POST(req: NextRequest) {
  try {
    const cmaData = await req.json();

    const buffer = await renderToBuffer(
      React.createElement(CMADocument, { cmaData }) as React.ReactElement<DocumentProps>
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
  } catch (err) {
    console.error("[/api/pdf] render error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
