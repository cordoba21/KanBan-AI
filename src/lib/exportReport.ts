"use client";

import { saveAs } from "file-saver";

interface ReportData {
  title: string;
  content: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
    statusDistribution: { name: string; value: number; color: string }[];
  };
  generatedAt: string;
}

/* ─── Export as PDF ───────────────────────────────────────── */
export async function exportToPDF(data: ReportData, chartElement?: HTMLElement | null) {
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 60);
  doc.text("Reporte Ejecutivo Mensual", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 150);
  doc.text(`KanBan AI — Generado: ${new Date(data.generatedAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  // Stats table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 60);
  doc.text("Resumen de Métricas", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Tareas", String(data.stats.totalTasks)],
      ["Tareas Completadas", String(data.stats.completedTasks)],
      ["En Progreso", String(data.stats.inProgressTasks)],
      ["Tasa de Completitud", `${data.stats.completionRate}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [125, 211, 252], textColor: [0, 0, 0], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Status distribution table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 60);
  doc.text("Distribución por Estado", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Estado", "Cantidad", "Porcentaje"]],
    body: data.stats.statusDistribution.map((s) => [
      s.name,
      String(s.value),
      data.stats.totalTasks > 0 ? `${Math.round((s.value / data.stats.totalTasks) * 100)}%` : "0%",
    ]),
    theme: "grid",
    headStyles: { fillColor: [192, 132, 252], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 245, 255] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Chart image
  if (chartElement) {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartElement, { backgroundColor: "#0a0a1a", scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 28;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (y + imgHeight > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 60);
      doc.text("Gráficas", 14, y);
      y += 8;
      doc.addImage(imgData, "PNG", 14, y, imgWidth, imgHeight);
      y += imgHeight + 12;
    } catch (e) {
      console.warn("Could not render chart for PDF:", e);
    }
  }

  // Report content
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 60);
  doc.text("Análisis Detallado", 14, y);
  y += 8;

  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 80);
  const cleanContent = data.content
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, "")
    .replace(/[#*`]/g, "")
    .replace(/\n{3,}/g, "\n\n");
  const textLines = cleanContent.split("\n").map((line) => line.trim()).filter(Boolean);
  const maxWidth = pageWidth - 28;
  const lineHeight = 4.5;
  textLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, maxWidth);
    wrapped.forEach((wrappedLine: string, index: number) => {
      if (y > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        y = 20;
      }
      const lineWidth = doc.getTextWidth(wrappedLine);
      if (index === wrapped.length - 1) {
        const gap = Math.max(0, maxWidth - lineWidth);
        const wordCount = wrappedLine.trim().split(/\s+/).length;
        if (gap > 2 && wordCount > 2) {
          const spacing = Math.min(0.8, gap / Math.max(1, wordCount - 1));
          doc.setCharSpace(spacing);
          doc.text(wrappedLine, 14, y);
          doc.setCharSpace(0);
        } else {
          doc.text(wrappedLine, 14, y);
        }
      } else {
        const gap = Math.max(0, maxWidth - lineWidth);
        const wordCount = wrappedLine.trim().split(/\s+/).length;
        if (gap > 2 && wordCount > 2) {
          const spacing = Math.min(0.8, gap / Math.max(1, wordCount - 1));
          doc.setCharSpace(spacing);
          doc.text(wrappedLine, 14, y);
          doc.setCharSpace(0);
        } else {
          doc.text(wrappedLine, 14, y);
        }
      }
      y += lineHeight;
    });
    y += 1.5;
  });

  doc.save(`reporte-ejecutivo-${new Date().toISOString().slice(0, 7)}.pdf`);
}

/* ─── Export as Excel ────────────────────────────────────── */
export async function exportToExcel(data: ReportData) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "KanBan AI";
  workbook.created = new Date();

  // Summary sheet
  const summary = workbook.addWorksheet("Resumen", {
    properties: { tabColor: { argb: "FF7DD3FC" } },
  });

  summary.columns = [
    { header: "Métrica", key: "metric", width: 30 },
    { header: "Valor", key: "value", width: 20 },
  ];

  summary.getRow(1).font = { name: "Calibri", bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  summary.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7DD3FC" } };

  summary.addRow({ metric: "Total de Tareas", value: data.stats.totalTasks });
  summary.addRow({ metric: "Tareas Completadas", value: data.stats.completedTasks });
  summary.addRow({ metric: "En Progreso", value: data.stats.inProgressTasks });
  summary.addRow({ metric: "Tasa de Completitud", value: `${data.stats.completionRate}%` });
  summary.addRow({ metric: "Fecha de Generación", value: new Date(data.generatedAt).toLocaleDateString("es-MX") });

  // Status distribution sheet
  const statusSheet = workbook.addWorksheet("Distribución", {
    properties: { tabColor: { argb: "FFC084FC" } },
  });

  statusSheet.columns = [
    { header: "Estado", key: "name", width: 20 },
    { header: "Cantidad", key: "value", width: 15 },
    { header: "Porcentaje", key: "pct", width: 15 },
  ];

  statusSheet.getRow(1).font = { name: "Calibri", bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  statusSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC084FC" } };

  data.stats.statusDistribution.forEach((s) => {
    statusSheet.addRow({
      name: s.name,
      value: s.value,
      pct: data.stats.totalTasks > 0 ? `${Math.round((s.value / data.stats.totalTasks) * 100)}%` : "0%",
    });
  });

  // Report sheet
  const reportSheet = workbook.addWorksheet("Reporte AI", {
    properties: { tabColor: { argb: "FF4ADE80" } },
  });

  reportSheet.columns = [{ header: "Análisis del Reporte", key: "content", width: 120 }];
  reportSheet.getRow(1).font = { name: "Calibri", bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  reportSheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4ADE80" } };

  const contentLines = data.content
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, "")
    .replace(/[#*`]/g, "")
    .split("\n")
    .filter(Boolean);
  contentLines.forEach((line) => {
    reportSheet.addRow({ content: line });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `reporte-ejecutivo-${new Date().toISOString().slice(0, 7)}.xlsx`);
}

/* ─── Export as Word ─────────────────────────────────────── */
export async function exportToWord(data: ReportData, chartElement?: HTMLElement | null) {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel, ImageRun } = docx;

  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: "Reporte Ejecutivo Mensual", bold: true, size: 36, color: "1E1E3C", font: "Cambria" }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `KanBan AI — ${new Date(data.generatedAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`,
          size: 20, color: "787896", italics: true, font: "Georgia",
        }),
      ],
    })
  );

  // Metrics section
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
      children: [new TextRun({ text: "Resumen de Métricas", bold: true, size: 28, color: "1E1E3C", font: "Cambria" })],
    })
  );

  const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" };
  const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

  const metricsData = [
    ["Total de Tareas", String(data.stats.totalTasks)],
    ["Completadas", String(data.stats.completedTasks)],
    ["En Progreso", String(data.stats.inProgressTasks)],
    ["Tasa de Completitud", `${data.stats.completionRate}%`],
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["Métrica", "Valor"].map(
            (text) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 22, color: "FFFFFF", font: "Cambria" })] })],
                shading: { fill: "7DD3FC" },
                borders,
                width: { size: 50, type: WidthType.PERCENTAGE },
              })
          ),
        }),
        ...metricsData.map(
          ([m, v]) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: m, size: 20, font: "Georgia" })] })], borders }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v, size: 20, bold: true, font: "Georgia" })] })], borders }),
              ],
            })
        ),
      ],
    })
  );

  // Chart image
  if (chartElement) {
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartElement, { backgroundColor: "#0a0a1a", scale: 2 });
      const imgBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
      const imgBuffer = await imgBlob.arrayBuffer();

      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        children: [new TextRun({ text: "Gráficas", bold: true, size: 28, color: "1E1E3C", font: "Cambria" })],
      })
    );

      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: imgBuffer,
              transformation: { width: 550, height: Math.round((canvas.height * 550) / canvas.width) },
              type: "png",
            }),
          ],
        })
      );
    } catch (e) {
      console.warn("Could not render chart for Word:", e);
    }
  }

  // Distribution table
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: "Distribución por Estado", bold: true, size: 28, color: "1E1E3C", font: "Cambria" })],
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ["Estado", "Cantidad", "Porcentaje"].map(
            (text) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 22, color: "FFFFFF", font: "Cambria" })] })],
                shading: { fill: "C084FC" },
                borders,
              })
          ),
        }),
        ...data.stats.statusDistribution.map(
          (s) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: s.name, size: 20, font: "Georgia" })] })], borders }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(s.value), size: 20, font: "Georgia" })] })], borders }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: data.stats.totalTasks > 0 ? `${Math.round((s.value / data.stats.totalTasks) * 100)}%` : "0%", size: 20, font: "Georgia" })] })],
                  borders,
                }),
              ],
            })
        ),
      ],
    })
  );

  // Report content
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: "Análisis Detallado", bold: true, size: 28, color: "1E1E3C", font: "Cambria" })],
    })
  );

  const contentLines = data.content
    .replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, "")
    .split("\n")
    .filter(Boolean);
  contentLines.forEach((line) => {
    const clean = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/`/g, "");
    const isHeading = line.startsWith("#");
    children.push(
      new Paragraph({
        spacing: { after: isHeading ? 150 : 120, line: 360 },
        alignment: isHeading ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: clean,
            bold: isHeading,
            size: isHeading ? 24 : 20,
            color: isHeading ? "1E1E3C" : "3C3C5A",
            font: isHeading ? "Cambria" : "Georgia",
          }),
        ],
      })
    );
  });

  const doc = new Document({
    sections: [{ children }],
    creator: "KanBan AI",
    title: "Reporte Ejecutivo Mensual",
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `reporte-ejecutivo-${new Date().toISOString().slice(0, 7)}.docx`);
}
