import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type StatementLedgerRow = {
  date: string;
  description: string;
  credit: number;
  debit: number;
  balance: number;
};

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function downloadStatementPdf(opts: {
  title: string;
  subtitle: string;
  accountName?: string;
  ledger: StatementLedgerRow[];
  positions?: { label: string; pl: number; buy: number; sell: number; side?: string }[];
  summary?: { label: string; value: string }[];
  filename: string;
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  let y = margin;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("FOREX", margin, y);
  doc.setTextColor(245, 158, 11);
  const forexW = doc.getTextWidth("FOREX");
  doc.setFontSize(9);
  doc.text("Plus", margin + forexW + 0.5, y - 2.5);
  doc.setFontSize(14);
  doc.setTextColor(0);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80);
  doc.text(opts.title, margin, y);
  y += 5;
  doc.text(opts.subtitle, margin, y);
  y += 8;
  doc.setTextColor(0);
  doc.setFontSize(9);
  if (opts.accountName) {
    doc.text(`Account holder: ${opts.accountName}`, margin, y);
    y += 4;
  }
  doc.text(`Generated: ${fmtDate(new Date().toISOString())}`, margin, y);
  y += 8;

  if (opts.summary?.length) {
    doc.setFont("helvetica", "bold");
    doc.text("Summary", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    for (const row of opts.summary) {
      doc.text(`${row.label}: ${row.value}`, margin, y);
      y += 4;
    }
    y += 4;
  }

  autoTable(doc, {
    startY: y,
    head: [["Date", "Description", "Credit", "Debit", "Balance"]],
    body: opts.ledger.map((r) => [
      fmtDate(r.date),
      r.description,
      r.credit > 0 ? fmtMoney(r.credit) : "—",
      r.debit > 0 ? fmtMoney(r.debit) : "—",
      fmtMoney(r.balance),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: margin, right: margin },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (opts.positions?.length) {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Open positions", margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Symbol", "Entry", "P/L"]],
      body: opts.positions.map((p) => [
        p.label,
        p.side === "sell"
          ? `Sell ${fmtMoney(p.sell)} → Buy ${fmtMoney(p.buy)}`
          : `Buy ${fmtMoney(p.buy)} → Sell ${fmtMoney(p.sell)}`,
        (p.pl >= 0 ? "+" : "-") + fmtMoney(Math.abs(p.pl)),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
      margin: { left: margin, right: margin },
    });
  }

  doc.setFontSize(7);
  doc.setTextColor(120);
  const pageH = doc.internal.pageSize.getHeight();
  doc.text(
    "This statement is for informational purposes. Credits/debits reflect broker deposits, withdrawals, and trade P/L.",
    margin,
    pageH - 10,
    { maxWidth: 180 }
  );

  doc.save(opts.filename);
}
