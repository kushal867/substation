"use client";

import { BadgeCheck, Download, MoreHorizontal, Printer, ReceiptText, RotateCcw, Send, ShoppingCart } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DateRangeFilter } from "../components/shared/DateRangeFilter";
import { ImageThumb } from "../components/shared/ImageThumb";
import { Invoice } from "../components/shared/Invoice";
import { usePrint } from "../components/shared/Print";
import { Badge, ORDER_TONE, PAY_TONE } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable, Pagination, type Column } from "../components/ui/DataTable";
import { FilterSelect, SearchInput, SelectField, TextArea } from "../components/ui/Fields";
import { useConfirm, useToast } from "../components/ui/Feedback";
import { Drawer } from "../components/ui/Modal";
import { EmptyState, PageHeader } from "../components/ui/Misc";
import { Menu } from "../components/ui/Popover";
import { useDateRange } from "../hooks/useDateRange";
import { usePageLoading } from "../hooks/usePageLoading";
import { usePaged } from "../hooks/usePaged";
import { useTableSort } from "../hooks/useTableSort";
import { downloadCsv } from "../lib/csv";
import { fmtDate, fmtDateTime, npr } from "../lib/format";
import { inRange, orderBalance, orderSubtotal, orderTotal } from "../lib/range";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../lib/stats";
import { sortBy } from "../lib/selectors";
import { useAdmin } from "../store/AdminStore";
import type { Order, OrderStatus } from "../types";

function OrderDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { state, setOrderStatus, verifyOrderPayment, refundOrder, addOrderNote } = useAdmin();
  const toast = useToast();
  const confirm = useConfirm();
  const print = usePrint();
  const order = state.orders.find((o) => o.id === orderId);
  const [next, setNext] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setNext(""); setNote(""); setNoteErr(""); }, [orderId]);
  if (!order) return <Drawer open={false} onClose={onClose} title="" children={null} />;
  const customer = state.customers.find((c) => c.id === order.customerId);
  const total = orderTotal(order);
  const balance = orderBalance(order);
  const pendingTxns = state.payments.filter((p) => p.orderId === order.id && p.status === "Pending");
  const txns = state.payments.filter((p) => p.orderId === order.id);

  const changeStatus = async () => {
    if (!next || next === order.orderStatus) return;
    const risky = next === "Cancelled" || next === "Delivered" || next === "Shipped";
    const ok = !risky || (await confirm({
      title: `Mark ${order.number} as ${next}?`,
      description: next === "Cancelled" ? "The order will be cancelled and removed from revenue totals. Any payment already collected is not refunded automatically." : next === "Delivered" ? "This confirms the customer has received the order." : "The customer will be treated as notified of shipment.",
      confirmLabel: `Mark ${next}`, tone: next === "Cancelled" ? "danger" : "primary",
    }));
    if (!ok) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 300));
    setOrderStatus(order.id, next);
    setBusy(false);
    setNext("");
    toast.success(`${order.number} is now ${next}.`);
  };

  const verify = async () => {
    const ok = await confirm({ title: "Verify payment?", description: pendingTxns.length ? `Confirm ${pendingTxns.length} pending transaction${pendingTxns.length > 1 ? "s" : ""} totalling ${npr(pendingTxns.reduce((s, t) => s + t.amount, 0))}. (Mock verification — no payment provider is contacted.)` : `Record ${npr(balance)} as received and verified for ${order.number}. (Mock verification.)`, confirmLabel: "Mark verified", tone: "primary" });
    if (!ok) return;
    const res = verifyOrderPayment(order.id);
    res.ok ? toast.success(res.message) : toast.error(res.message);
  };

  const refund = async () => {
    const ok = await confirm({ title: "Refund payment?", description: `${npr(order.paid)} will be marked as refunded to the customer. This is a demo action — no money moves.`, confirmLabel: "Refund" });
    if (!ok) return;
    refundOrder(order.id);
    toast.success(`${npr(order.paid)} refunded for ${order.number}.`);
  };

  const saveNote = () => {
    if (!note.trim()) return setNoteErr("Write a note before saving.");
    addOrderNote(order.id, note.trim());
    setNote(""); setNoteErr("");
    toast.success("Internal note added.");
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="border-b border-a-line px-5 py-4 last:border-0"><h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-a-muted">{title}</h3>{children}</section>
  );

  return (
    <Drawer
      open={!!orderId}
      onClose={onClose}
      width="max-w-2xl"
      title={<span className="flex items-center gap-2">{order.number}<Badge tone={ORDER_TONE[order.orderStatus]} dot>{order.orderStatus}</Badge></span>}
      subtitle={<span>{fmtDateTime(order.date)} · <Badge tone={PAY_TONE[order.paymentStatus]} dot>{order.paymentStatus}</Badge></span>}
      actions={<Button size="sm" onClick={() => print(<Invoice order={order} customer={customer} settings={state.settings} />)}><Printer className="h-3.5 w-3.5" />Invoice</Button>}
    >
      <Section title="Customer">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div><p className="font-medium text-a-fg">{customer?.name ?? "Unknown"}</p><p className="text-a-muted">{customer?.phone}</p><p className="text-a-muted">{customer?.email}</p></div>
          <div><p className="text-xs text-a-muted">Delivery address</p><p>{order.address}</p><p className="text-a-muted">{order.zoneName}</p></div>
        </div>
      </Section>
      <Section title="Items">
        <ul className="divide-y divide-a-line rounded-lg border border-a-line">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-3 p-3">
              <ImageThumb src={i.image} name={i.name} category={state.categories.find((c) => c.id === i.categoryId)?.name} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{i.name}</p><p className="text-xs text-a-muted">{i.variantLabel} · {npr(i.price)} × {i.qty}</p></div>
              <span className="text-sm font-semibold">{npr(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-a-muted">Subtotal</dt><dd>{npr(orderSubtotal(order))}</dd></div>
          <div className="flex justify-between"><dt className="text-a-muted">Delivery fee</dt><dd>{npr(order.deliveryFee)}</dd></div>
          <div className="flex justify-between border-t border-a-line pt-2 font-semibold"><dt>Total</dt><dd>{npr(total)}</dd></div>
          <div className="flex justify-between"><dt className="text-a-muted">Advance / paid</dt><dd className="text-emerald-600">{npr(order.paid)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Remaining balance</dt><dd className={balance > 0 ? "text-red-600" : ""}>{npr(balance)}</dd></div>
        </dl>
      </Section>
      <Section title="Update order">
        <div className="flex flex-wrap items-end gap-2">
          <SelectField wrapperClassName="min-w-40 flex-1" label="Order status" value={next || order.orderStatus} onChange={(e) => setNext(e.target.value as OrderStatus)}>
            {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </SelectField>
          <Button variant="primary" loading={busy} disabled={!next || next === order.orderStatus} onClick={changeStatus}><Send className="h-3.5 w-3.5" />Update status</Button>
        </div>
        <div className="mt-4 rounded-lg border border-a-line bg-a-subtle p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">Payment</p><Badge tone={PAY_TONE[order.paymentStatus]} dot>{order.paymentStatus}</Badge></div>
          {txns.length > 0 && <ul className="mb-3 space-y-1 text-xs text-a-muted">{txns.map((t) => <li key={t.id} className="flex justify-between"><span>{t.id} · {t.kind} · {t.method}</span><span>{npr(t.amount)} · {t.status}</span></li>)}</ul>}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" disabled={order.paymentStatus === "Refunded" || order.paymentStatus === "Paid" || order.orderStatus === "Cancelled"} onClick={verify}><BadgeCheck className="h-3.5 w-3.5" />Mark payment verified</Button>
            <Button size="sm" disabled={order.paid <= 0 || order.paymentStatus === "Refunded"} onClick={refund}><RotateCcw className="h-3.5 w-3.5" />Refund</Button>
          </div>
        </div>
      </Section>
      <Section title="Internal notes">
        <TextArea label="Add a note" value={note} onChange={(e) => { setNote(e.target.value); setNoteErr(""); }} error={noteErr} placeholder="Visible to admins only…" maxLength={300} />
        <Button size="sm" className="mt-2" onClick={saveNote}>Save note</Button>
        {order.notes.length > 0 && <ul className="mt-3 space-y-2">{order.notes.map((n) => <li key={n.id} className="rounded-lg bg-amber-500/10 p-3 text-sm"><p>{n.text}</p><p className="mt-1 text-xs text-a-muted">{n.author} · {fmtDateTime(n.at)}</p></li>)}</ul>}
      </Section>
      <Section title="Order history">
        <ol className="relative ml-2 space-y-4 border-l border-a-line pl-5">
          {[...order.timeline].reverse().map((t, i) => (
            <li key={i} className="relative"><span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-a-surface ${i === 0 ? "bg-a-accent" : "bg-a-line"}`} /><p className="text-sm font-medium">{t.title}</p>{t.detail && <p className="text-xs text-a-muted">{t.detail}</p>}<p className="text-xs text-a-muted">{fmtDateTime(t.at)}</p></li>
          ))}
        </ol>
      </Section>
    </Drawer>
  );
}

export default function OrdersView() {
  const { state } = useAdmin();
  const params = useSearchParams();
  const loading = usePageLoading();
  const dr = useDateRange("all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState("all");
  const [pay, setPay] = useState("all");
  const [zone, setZone] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const { sort, toggle } = useTableSort({ key: "date", dir: "desc" });
  const print = usePrint();
  const toast = useToast();
  const cust = (id: string) => state.customers.find((c) => c.id === id);

  const zones = useMemo(() => Array.from(new Map(state.orders.map((o) => [o.zoneId, o.zoneName])).entries()), [state.orders]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const f = state.orders.filter((o) =>
      (!term || o.number.toLowerCase().includes(term) || (cust(o.customerId)?.name ?? "").toLowerCase().includes(term)) &&
      (status === "all" || o.orderStatus === status) && (pay === "all" || o.paymentStatus === pay) && (zone === "all" || o.zoneId === zone) &&
      (dr.key === "all" || inRange(o.date, dr.range)));
    const get: Record<string, (o: Order) => string | number> = { number: (o) => o.number, customer: (o) => cust(o.customerId)?.name ?? "", date: (o) => new Date(o.date).getTime(), total: orderTotal, items: (o) => o.items.length };
    return sortBy(f, get[sort.key] ?? get.date, sort.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.orders, state.customers, q, status, pay, zone, dr.key, dr.range, sort]);

  const paged = usePaged(rows, state.settings.pageSize);
  useEffect(() => { paged.setPage(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [q, status, pay, zone, dr.key, dr.range, sort]);

  const exportCsv = () => {
    if (!rows.length) return toast.error("There are no orders to export for the current filters.");
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}`, [
      ["Order", "Customer", "Date", "Items", "Subtotal", "Delivery fee", "Total", "Paid", "Balance", "Payment status", "Order status", "Zone"],
      ...rows.map((o) => [o.number, cust(o.customerId)?.name, fmtDate(o.date), o.items.reduce((s, i) => s + i.qty, 0), orderSubtotal(o), o.deliveryFee, orderTotal(o), o.paid, orderBalance(o), o.paymentStatus, o.orderStatus, o.zoneName]),
    ]);
    toast.success(`Exported ${rows.length} orders to CSV.`);
  };

  const columns: Column<Order>[] = [
    { key: "number", header: "Order", sortable: true, render: (o) => <span className="font-medium text-a-accent">{o.number}</span> },
    { key: "customer", header: "Customer", sortable: true, render: (o) => <div className="min-w-[8rem]"><p className="font-medium">{cust(o.customerId)?.name}</p><p className="text-xs text-a-muted">{o.zoneName}</p></div> },
    { key: "date", header: "Date", sortable: true, hideOnMobile: true, render: (o) => <span className="whitespace-nowrap text-a-muted">{fmtDate(o.date)}</span> },
    { key: "items", header: "Items", sortable: true, align: "center", hideOnMobile: true, render: (o) => o.items.reduce((s, i) => s + i.qty, 0) },
    { key: "sub", header: "Subtotal", align: "right", hideOnMobile: true, render: (o) => npr(orderSubtotal(o)) },
    { key: "fee", header: "Delivery", align: "right", hideOnMobile: true, render: (o) => npr(o.deliveryFee) },
    { key: "total", header: "Total", sortable: true, align: "right", render: (o) => <span className="whitespace-nowrap font-semibold">{npr(orderTotal(o))}</span> },
    { key: "pay", header: "Payment", render: (o) => <Badge tone={PAY_TONE[o.paymentStatus]} dot>{o.paymentStatus}</Badge> },
    { key: "status", header: "Status", render: (o) => <Badge tone={ORDER_TONE[o.orderStatus]} dot>{o.orderStatus}</Badge> },
    { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", render: (o) => (
      <Menu label={`Actions for ${o.number}`} trigger={<button type="button" aria-label={`Actions for ${o.number}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-a-muted hover:bg-a-subtle"><MoreHorizontal className="h-4 w-4" /></button>} items={[
        { label: "View details", icon: <ReceiptText />, onClick: () => setOpen(o.id) },
        { label: "Print invoice", icon: <Printer />, onClick: () => print(<Invoice order={o} customer={cust(o.customerId)} settings={state.settings} />) },
      ]} />) },
  ];

  const filtersOn = q || status !== "all" || pay !== "all" || zone !== "all" || dr.key !== "all";
  return (
    <>
      <PageHeader title="Orders" description={`${rows.length} of ${state.orders.length} orders`} actions={<Button onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button>} />
      <Card>
        <div className="space-y-3 border-b border-a-line p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            <SearchInput className="w-full sm:w-72" value={q} onChange={setQ} placeholder="Search order number or customer…" />
            <FilterSelect aria-label="Order status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</FilterSelect>
            <FilterSelect aria-label="Payment status" value={pay} onChange={(e) => setPay(e.target.value)}><option value="all">All payments</option>{PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}</FilterSelect>
            <FilterSelect aria-label="Delivery zone" value={zone} onChange={(e) => setZone(e.target.value)}><option value="all">All zones</option>{zones.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</FilterSelect>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DateRangeFilter state={dr} allowAll />
            {filtersOn && <Button size="sm" variant="ghost" onClick={() => { setQ(""); setStatus("all"); setPay("all"); setZone("all"); dr.setKey("all"); }}>Clear filters</Button>}
          </div>
        </div>
        <DataTable columns={columns} rows={paged.pageItems} rowKey={(o) => o.id} loading={loading} sort={sort} onSort={toggle} onRowClick={(o) => setOpen(o.id)} compact={state.settings.compactTables}
          empty={<EmptyState icon={<ShoppingCart />} title="No orders found" description="Try different filters or a wider date range." />} />
        {!loading && rows.length > 0 && <Pagination page={paged.page} pageSize={paged.pageSize} total={paged.total} onPage={paged.setPage} onPageSize={paged.setPageSize} />}
      </Card>
      <OrderDrawer orderId={open} onClose={() => setOpen(null)} />
    </>
  );
}
