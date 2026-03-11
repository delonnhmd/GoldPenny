import { getAdPerformanceReport } from "@/utils/adTracking";

const AD_REPORT_HEADERS = [
  "Ad ID",
  "Title",
  "Category",
  "Type",
  "Allowed Pages",
  "Enabled",
  "Priority",
  "Click Count",
  "Impression Count",
  "CTR",
  "Last Clicked At",
  "Created At",
  "Updated At",
] as const;

export type AdReportRow = Record<(typeof AD_REPORT_HEADERS)[number], string | number | boolean>;

function calculateCtr(clickCount: number, impressionCount: number) {
  if (impressionCount <= 0) return 0;
  return clickCount / impressionCount;
}

export function generateAdReportRows(): AdReportRow[] {
  return getAdPerformanceReport().map((ad) => {
    const ctr = calculateCtr(ad.clickCount, ad.impressionCount);
    return {
      "Ad ID": ad.id,
      Title: ad.title,
      Category: ad.category,
      Type: ad.type,
      "Allowed Pages": ad.allowedPages.join(" | "),
      Enabled: ad.enabled,
      Priority: ad.priority,
      "Click Count": ad.clickCount,
      "Impression Count": ad.impressionCount,
      CTR: Number(ctr.toFixed(6)),
      "Last Clicked At": ad.lastClickedAt ?? "",
      "Created At": ad.createdAt,
      "Updated At": ad.updatedAt,
    };
  });
}

function escapeCsvCell(value: string | number | boolean) {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function buildCsvFromRows(rows: AdReportRow[]) {
  const lines = [AD_REPORT_HEADERS.join(",")];
  for (const row of rows) {
    const line = AD_REPORT_HEADERS.map((header) => escapeCsvCell(row[header])).join(",");
    lines.push(line);
  }
  return lines.join("\n");
}

export function exportAdReportToCSV(fileName = "ad-performance-report.csv") {
  const rows = generateAdReportRows();
  const csv = buildCsvFromRows(rows);

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  return csv;
}

// Future admin/reporting expansion points:
// - Admin report page can call generateAdReportRows() to render tabular data
// - Download CSV button can call exportAdReportToCSV()
// - Date range filtering can be applied before CSV generation
// - Click/impression rollups by category/page/banner can reuse the same row payload
// - Top-performing ads list can sort rows by CTR or click volume
