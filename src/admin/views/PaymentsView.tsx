"use client";

import { BadgeCheck, CheckCircle2, Clock, CreditCard, Download, HandCoins, Hourglass, RotateCcw, ShieldCheck, Wallet, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DateRangeFilter } from "../components/shared/DateRangeFilter";
import { StatCard } from "../components/shared/StatCard";
import { Badge, PAY_TONE, TXN_TONE } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable, Pagination, type Column } from "../components/ui/DataTable";
import { FilterSelect, SearchInput } from "../components/ui/Fields";
import { useConfirm, useToast } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader } from "../components/ui/Misc";
import { useDateRange } from "../hooks/useDateRange";
import { usePageLoading } from "../hooks/usePageLoading";
import { usePaged } from "../hooks/usePaged";
import { useTableSort } from "../hooks/useTableSort";
import { downloadCsv } from "../lib/csv";
import { fmtDate, fmtDateTime, npr } from "../lib/format";
import { inRange, orderBalance } from "../lib/range";
import { sortBy } from "../lib/selectors";
import { useAdmin } from "../store/AdminStore";
import type { PaymentTxn } from "../types";

function Detail({ txn, onClose }: { txn: PaymentTxn | null; onClose: () => void }) {
  const { state, verifyTxn } = useAdmin();
  const toast = useToast();
  const confirm = useConfirm();
  const [step, setStep] = useState(-1);
  useEffect(() => setStep(-1), [txn?.id]);
  if (!txn) return null;
  const live = state.payments.find((p) => p.id === txn.id) ?? txn;
  const order = state.orders.find((o) => o.id === live.orderId);
  const customer = state.customers.find((c) => c.id === order?.customerId);
  const steps = ["Looking up reference", "Matching amount with order", "Confirming with (mock) gateway"];

  const verify = async () => {
    setStep(0);
    for (let i = 0; i < steps.length; i++) { setStep(i); await new Promise((r) => setTimeout(r, 550)); }
    verifyTxn(live.id, true);
    setStep(-1);
    toast.success(`${live.id} verified. ${order?.number} updated.`);
  };
  const reject = async () => {
    const ok = await confirm({ title: `Reject ${live.id}?`, description: "The transaction will be marked as failed and the order balance stays outstanding.", confirmLabel: "Reject payment" });
    if (!ok) return;
    verifyTxn(live.id, false);
    toast.info(`${live.id} marked as failed.`);
  };

  const rows: [string, React.ReactNode][] = [
    ["Transaction ID", live.id], ["Order", order?.number ?? "—"], ["Customer", customer ? `${customer.name} · ${customer.phone}` : "—"], ["Type", live.kind],
    ["Method", live.method], ["Reference", <code key="r" className="rounded bg-a-subtle px-1.5 py-0.5 text-xs">{live.reference}</code>], ["Date", fmtDateTime(live.date)],
    ["Order total status", order ? <Badge key="o" tone={PAY_TONE[order.paymentStatus]} dot>{order.paymentStatus}</Badge> : "—"], ["Order balance", order ? npr(orderBalance(order)) : "—"],
  ];
  return (
    <Modal open onClose={onClose} title="Transaction details" description="Mock verification only — no payment provider is connected."
      footer={live.status === "Pending" ? (<><Button onClick={onClose}>Close</Button><Button disabled={step >= 0} onClick={reject}><XCircle className="h-4 w-4" />Reject</Button><Button variant="primary" loading={step >= 0} onClick={verify}><ShieldCheck className="h-4 w-4" />Verify payment</Button></>) : <Button onClick={onClose}>Close</Button>}>
      <div className="mb-4 flex items-center justify-between rounded-xl bg-a-subtle p-4">
        <div><p className="text-xs text-a-muted">Amount</p><p className="text-2xl font-semibold">{npr(live.amount)}</p></div>
        <Badge tone={TXN_TONE[live.status]} dot>{live.status}</Badge>
      </div>
      <dl className="divide-y divide-a-line text-sm">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-a-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
      </dl>
      {step >= 0 && (
        <ul className="a-fade-in mt-4 space-y-2 rounded-lg border border-a-line p-3 text-sm" aria-live="polite">
          {steps.map((s, i) => (
            <li key={s} className={`flex items-center gap-2 ${i > step ? "text-a-muted/60" : ""}`}>
              {i < step ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : i === step ? <Clock className="h-4 w-4 animate-pulse text-a-accent" /> : <span className="h-4 w-4" />}{s}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default function PaymentsView() {
  const { state } = useAdmin();
  const toast = useToast();
  const loading = usePageLoading();
  const dr = useDateRange("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const { sort, toggle } = useTableSort({ key: "date", dir: "desc" });
  const order = (id: string) => state.orders.find((o) => o.id === id);
  const custName = (t: PaymentTxn) => state.customers.find((c) => c.id === order(t.orderId)?.customerId)?.name ?? "—";

  const inScope = useMemo(() => state.payments.filter((p) => dr.key === "all" || inRange(p.date, dr.range)), [state.payments, dr.key, dr.range]);
  const summary = useMemo(() => {
    const sum = (f: (p: PaymentTxn) => boolean) => inScope.filter(f).reduce((s, p) => s + p.amount, 0);
    const scopedOrders = state.orders.filter((o) => dr.key === "all" || inRange(o.date, dr.range));
    return {
      collected: sum((p) => p.status === "Verified" && p.kind !== "Refund"),
      pending: sum((p) => p.status === "Pending"),
      pendingCount: inScope.filter((p) => p.status === "Pending").length,
      advance: sum((p) => p.kind === "Advance" && (p.status === "Verified" || p.status === "Pending")),
      outstanding: scopedOrders.reduce((s, o) => s + orderBalance(o), 0),
      refunds: sum((p) => p.kind === "Refund"),
    };
  }, [inScope, state.orders, dr.key, dr.range]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const f = inScope.filter((p) => (!term || p.id.toLowerCase().includes(term) || (order(p.orderId)?.number ?? "").toLowerCase().includes(term) || custName(p).toLowerCase().includes(term) || p.reference.toLowerCase().includes(term)) && (status === "all" || p.status === status) && (method === "all" || p.method === method));
    const get: Record<string, (p: PaymentTxn) => string | number> = { id: (p) => p.id, order: (p) => order(p.orderId)?.number ?? "", customer: custName, amount: (p) => p.amount, method: (p) => p.method, date: (p) => new Date(p.date).getTime(), status: (p) => p.status };
    return sortBy(f, get[sort.key] ?? get.date, sort.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inScope, state.orders, state.customers, q, status, method, sort]);

  const paged = usePaged(rows, state.settings.pageSize);
  useEffect(() => { paged.setPage(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, status, method, dr.key, dr.range, sort]);

  const exportCsv = () => {
    if (!rows.length) return toast.error("No transactions to export.");
    downloadCsv("payments", [["Transaction", "Order", "Customer", "Amount", "Method", "Type", "Reference", "Date", "Status"], ...rows.map((p) => [p.id, order(p.orderId)?.number, custName(p), p.amount, p.method, p.kind, p.reference, fmtDate(p.date), p.status])]);
    toast.success(`Exported ${rows.length} transactions.`);
  };

  const columns: Column<PaymentTxn>[] = [
    { key: "id", header: "Transaction", sortable: true, render: (p) => <span className="font-medium text-a-accent">{p.id}</span> },
    { key: "order", header: "Order", sortable: true, render: (p) => order(p.orderId)?.number ?? "—" },
    { key: "customer", header: "Customer", sortable: true, hideOnMobile: true, render: (p) => custName(p) },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (p) => <span className="whitespace-nowrap font-semibold">{p.kind === "Refund" ? "−" : ""}{npr(p.amount)}</span> },
    { key: "method", header: "Method", sortable: true, hideOnMobile: true, render: (p) => <span>{p.method}<span className="block text-xs text-a-muted">{p.kind}</span></span> },
    { key: "date", header: "Date", sortable: true, hideOnMobile: true, render: (p) => <span className="whitespace-nowrap text-a-muted">{fmtDate(p.date)}</span> },
    { key: "status", header: "Status", sortable: true, render: (p) => <Badge tone={TXN_TONE[p.status]} dot>{p.status}</Badge> },
    { key: "act", header: <span className="sr-only">Action</span>, align: "right", render: (p) => p.status === "Pending" ? <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); setOpen(p.id); }}><BadgeCheck className="h-3.5 w-3.5" />Verify</Button> : <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOpen(p.id); }}>Details</Button> },
  ];

  return (
    <>
      <PageHeader title="Payments" description="Track collections, advances and outstanding balances. Verification is simulated." actions={<Button onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button>} />
      <div className="mb-4"><DateRangeFilter state={dr} allowAll /></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard showSpark={false} hint="verified payments" label="Total collected" value={npr(summary.collected)} icon={<Wallet />} tone="#10b981" />
        <StatCard showSpark={false} hint={`${summary.pendingCount} awaiting verification`} label="Pending payments" value={npr(summary.pending)} icon={<Hourglass />} tone="#f59e0b" />
        <StatCard showSpark={false} hint="deposits received" label="Advance payments" value={npr(summary.advance)} icon={<HandCoins />} tone="#4f46e5" />
        <StatCard showSpark={false} hint="still owed on orders" label="Outstanding balances" value={npr(summary.outstanding)} icon={<CreditCard />} tone="#f43f5e" />
        <StatCard showSpark={false} hint="returned to customers" label="Refunds" value={npr(summary.refunds)} icon={<RotateCcw />} tone="#64748b" />
      </div>
      <Card className="mt-4">
        <div className="flex flex-wrap gap-2 border-b border-a-line p-3 sm:p-4">
          <SearchInput className="w-full sm:w-72" value={q} onChange={setQ} placeholder="Search transaction, order, customer…" />
          <FilterSelect aria-label="Payment status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{["Pending", "Verified", "Failed", "Refunded"].map((s) => <option key={s}>{s}</option>)}</FilterSelect>
          <FilterSelect aria-label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}><option value="all">All methods</option>{["eSewa", "Khalti", "FonePay", "Bank Transfer", "Cash on Delivery"].map((s) => <option key={s}>{s}</option>)}</FilterSelect>
        </div>
        <DataTable columns={columns} rows={paged.pageItems} rowKey={(p) => p.id} loading={loading} sort={sort} onSort={toggle} onRowClick={(p) => setOpen(p.id)} compact={state.settings.compactTables}
          empty={<EmptyState icon={<CreditCard />} title="No transactions found" description="Adjust filters or the date range." />} />
        {!loading && rows.length > 0 && <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onPage={paged.setPage} onPageSize={paged.setPageSize} />}
      </Card>
      <Detail key={open} txn={state.payments.find((p) => p.id === open) ?? null} onClose={() => setOpen(null)} />
    </>
  );
}
