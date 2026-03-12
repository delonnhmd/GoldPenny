import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AmortizationRow } from "@/lib/finance";
import { formatCurrency } from "@/lib/finance";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface SummaryMetric {
  label: string;
  value: string;
  hint?: string;
}

interface ResultMetricsProps {
  metrics: SummaryMetric[];
}

export function ResultMetrics({ metrics }: ResultMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {metrics.map((item) => (
        <Card key={item.label} className="p-4 border-slate-200 bg-white">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{item.value}</p>
          {item.hint ? <p className="text-xs text-slate-500 mt-2">{item.hint}</p> : null}
        </Card>
      ))}
    </div>
  );
}

export function GlobalDisclaimers() {
  return (
    <Card className="p-4 border-slate-200 bg-white">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">Important Disclaimers</h3>
      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
        <li>Estimates are principal & interest only unless you add optional items.</li>
        <li>Does not include mortgage insurance (MI), property taxes, homeowner’s insurance, HOA, or lender fees unless entered.</li>
        <li>For education only. Not a loan offer.</li>
      </ul>
    </Card>
  );
}

interface AmortizationTableProps {
  rows: AmortizationRow[];
  defaultVisibleRows?: number;
  title?: string;
  metrics?: SummaryMetric[];
  calculatorTitle?: string;
}

export function AmortizationTable({
  rows,
  defaultVisibleRows = 60,
  title = "Amortization (Monthly)",
  metrics,
  calculatorTitle,
}: AmortizationTableProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleRows = useMemo(() => {
    if (showAll) {
      return rows;
    }
    return rows.slice(0, defaultVisibleRows);
  }, [defaultVisibleRows, rows, showAll]);

  function exportToPDF() {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageTitle = calculatorTitle ?? title;
    const exportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(pageTitle, 14, 18);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${exportDate} · PennyFloat.com`, 14, 25);
    doc.setTextColor(0, 0, 0);

    let currentY = 32;

    if (metrics && metrics.length > 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [["Metric", "Value"]],
        body: metrics.map((m) => [m.label, m.value]),
        theme: "grid",
        headStyles: { fillColor: [30, 100, 180], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 2.5 },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [["Month", "Payment", "Principal", "Interest", "Balance"]],
      body: rows.map((r) => [
        r.monthIndex,
        formatCurrency(r.payment),
        formatCurrency(r.principal),
        formatCurrency(r.interest),
        formatCurrency(r.balance),
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 100, 180], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });

    const safeFilename = (calculatorTitle ?? "loan-calculator").toLowerCase().replace(/\s+/g, "-");
    doc.save(`${safeFilename}.pdf`);
  }

  function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const exportDate = new Date().toLocaleDateString("en-US");

    if (metrics && metrics.length > 0) {
      const summaryData = [
        [`${calculatorTitle ?? title}`],
        [`Exported: ${exportDate}  |  PennyFloat.com`],
        [],
        ["Metric", "Value"],
        ...metrics.map((m) => [m.label, m.value]),
        [],
        [title],
        ["Month", "Payment", "Principal", "Interest", "Balance"],
        ...rows.map((r) => [
          r.monthIndex,
          r.payment,
          r.principal,
          r.interest,
          r.balance,
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(summaryData);
      ws["!cols"] = [{ wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws, "Calculator");
    } else {
      const amortData = [
        [`${title}`],
        [`Exported: ${exportDate}  |  PennyFloat.com`],
        [],
        ["Month", "Payment", "Principal", "Interest", "Balance"],
        ...rows.map((r) => [r.monthIndex, r.payment, r.principal, r.interest, r.balance]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(amortData);
      ws["!cols"] = [{ wch: 10 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, ws, "Amortization");
    }

    const safeFilename = (calculatorTitle ?? "loan-calculator").toLowerCase().replace(/\s+/g, "-");
    XLSX.writeFile(wb, `${safeFilename}.xlsx`);
  }

  if (rows.length === 0) {
    return (
      <Card className="p-4 border-slate-200 bg-white">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-2">Enter valid values to generate an amortization table.</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-slate-200 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {rows.length > defaultVisibleRows ? (
            <Button variant="outline" size="sm" onClick={() => setShowAll((current) => !current)}>
              {showAll ? "Show Less" : `Show All ${rows.length} Months`}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Export Excel
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Payment</TableHead>
            <TableHead className="text-right">Principal</TableHead>
            <TableHead className="text-right">Interest</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.map((row) => (
            <TableRow key={row.monthIndex}>
              <TableCell>{row.monthIndex}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.payment)}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.principal)}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
