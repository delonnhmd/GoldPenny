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
}

export function AmortizationTable({ rows, defaultVisibleRows = 60, title = "Amortization (Monthly)" }: AmortizationTableProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleRows = useMemo(() => {
    if (showAll) {
      return rows;
    }
    return rows.slice(0, defaultVisibleRows);
  }, [defaultVisibleRows, rows, showAll]);

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
        {rows.length > defaultVisibleRows ? (
          <Button variant="outline" onClick={() => setShowAll((current) => !current)}>
            {showAll ? "Show Less" : `Show All ${rows.length} Months`}
          </Button>
        ) : null}
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
