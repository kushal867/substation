"use client";

import { AlertTriangle, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable, type Column } from "../components/ui/DataTable";
import { TextArea, TextField, Toggle } from "../components/ui/Fields";
import { useToast } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader } from "../components/ui/Misc";
import { usePageLoading } from "../hooks/usePageLoading";
import { npr, uid } from "../lib/format";
import { useAdmin } from "../store/AdminStore";
import type { DeliveryZone } from "../types";

function ZoneForm({ zone, onClose }: { zone: DeliveryZone | null; onClose: () => void }) {
  const { state, saveZone } = useAdmin();
  const toast = useToast();
  const [d, setD] = useState({ name: zone?.name ?? "", fee: zone ? String(zone.fee) : "", description: zone?.description ?? "", active: zone?.active ?? true });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = "Zone name is required.";
    else if (state.zones.some((z) => z.id !== zone?.id && z.name.toLowerCase() === d.name.trim().toLowerCase())) e.name = "A zone with this name already exists.";
    if (d.fee.trim() === "" || !Number.isFinite(Number(d.fee)) || Number(d.fee) < 0) e.fee = "Enter a fee of 0 or more.";
    setErr(e);
    if (Object.keys(e).length) return toast.error("Please fix the highlighted fields.");
    saveZone({ id: zone?.id ?? uid("zone"), name: d.name.trim(), fee: Number(d.fee), description: d.description.trim(), active: d.active });
    toast.success(zone ? `Zone “${d.name.trim()}” updated.` : `Zone “${d.name.trim()}” added.`);
    onClose();
  };
  return (
    <Modal open onClose={onClose} size="sm" title={zone ? "Edit delivery zone" : "Add delivery zone"} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>{zone ? "Save changes" : "Add zone"}</Button></>}>
      <div className="space-y-4">
        <TextField label="Zone name" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} error={err.name} maxLength={60} />
        <TextField label="Delivery fee (NPR)" required inputMode="decimal" value={d.fee} onChange={(e) => setD({ ...d, fee: e.target.value })} error={err.fee} />
        <TextArea label="Coverage notes" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} maxLength={160} />
        <div className="flex items-center justify-between rounded-lg border border-a-line bg-a-subtle px-4 py-3"><span className="text-sm font-medium">Active</span><Toggle checked={d.active} onChange={(v) => setD({ ...d, active: v })} label="Zone active" /></div>
      </div>
    </Modal>
  );
}

export default function ZonesView() {
  const { state, saveZone, deleteZone } = useAdmin();
  const toast = useToast();
  const loading = usePageLoading();
  const [form, setForm] = useState<{ zone: DeliveryZone | null } | null>(null);
  const [del, setDel] = useState<DeliveryZone | null>(null);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    state.orders.forEach((o) => m.set(o.zoneId, (m.get(o.zoneId) ?? 0) + 1));
    return m;
  }, [state.orders]);

  const columns: Column<DeliveryZone>[] = [
    { key: "name", header: "Zone", render: (z) => <div className="flex min-w-[12rem] items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-a-accent-soft text-a-accent"><MapPin className="h-4 w-4" /></span><div><p className="font-medium">{z.name}</p><p className="max-w-md text-xs text-a-muted">{z.description}</p></div></div> },
    { key: "fee", header: "Delivery fee", align: "right", render: (z) => <span className="font-semibold">{npr(z.fee)}</span> },
    { key: "orders", header: "Orders", align: "center", hideOnMobile: true, render: (z) => counts.get(z.id) ?? 0 },
    { key: "status", header: "Status", render: (z) => <div className="flex items-center gap-2"><Toggle size="sm" checked={z.active} label={`${z.name} active`} onChange={(v) => { saveZone({ ...z, active: v }); toast.success(`“${z.name}” ${v ? "activated" : "deactivated"}.`); }} /><Badge tone={z.active ? "green" : "gray"}>{z.active ? "Active" : "Inactive"}</Badge></div> },
    { key: "act", header: <span className="sr-only">Actions</span>, align: "right", render: (z) => (
      <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setForm({ zone: z })}><Pencil className="h-3.5 w-3.5" />Edit</Button><Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setDel(z)}><Trash2 className="h-3.5 w-3.5" />Delete</Button></div>) },
  ];
  const n = del ? counts.get(del.id) ?? 0 : 0;

  return (
    <>
      <PageHeader title="Delivery Zones" description={`${state.zones.filter((z) => z.active).length} of ${state.zones.length} zones active`} actions={<Button variant="primary" onClick={() => setForm({ zone: null })}><Plus className="h-4 w-4" />Add zone</Button>} />
      <Card>
        <DataTable columns={columns} rows={state.zones} rowKey={(z) => z.id} loading={loading} skeletonRows={4} empty={<EmptyState icon={<MapPin />} title="No delivery zones" description="Add a zone to set delivery fees." action={<Button variant="primary" onClick={() => setForm({ zone: null })}>Add zone</Button>} />} />
      </Card>
      {form && <ZoneForm key={form.zone?.id ?? "new"} zone={form.zone} onClose={() => setForm(null)} />}
      {del && (
        <Modal open size="sm" onClose={() => setDel(null)} title={`Delete “${del.name}”?`} footer={<><Button onClick={() => setDel(null)}>Cancel</Button><Button variant="danger" data-autofocus onClick={() => { deleteZone(del.id); toast.success(`Zone “${del.name}” deleted.`); setDel(null); }}>Delete zone</Button></>}>
          {n > 0 ? (
            <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>{n} order{n === 1 ? " is" : "s are"}</strong> linked to this zone. They keep their saved zone name and fee, but you won&apos;t be able to filter or ship new orders to it. Consider deactivating instead.</p></div>
          ) : <p className="text-sm text-a-muted">No orders use this zone. This can&apos;t be undone (except by resetting demo data).</p>}
        </Modal>
      )}
    </>
  );
}
