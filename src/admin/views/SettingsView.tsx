"use client";

import { Bell, Database, LayoutDashboard, LogOut, Monitor, Moon, Palette, RotateCcw, Save, Store, Sun, Upload, UserCog, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Field, SelectField, TextField, Toggle, inputCls } from "../components/ui/Fields";
import { useConfirm, useToast } from "../components/ui/Feedback";
import { PageHeader } from "../components/ui/Misc";
import { usePageLoading } from "../hooks/usePageLoading";
import { DEFAULT_SETTINGS } from "../data/defaults";
import { useAdmin } from "../store/AdminStore";
import type { Settings } from "../types";
import clsx from "clsx";

function resizeLogo(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 128 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/png"));
      };
      img.onerror = () => rej(new Error("Not a valid image"));
      img.src = String(fr.result);
    };
    fr.onerror = () => rej(new Error("Could not read file"));
    fr.readAsDataURL(file);
  });
}

function Section({ id, icon, title, description, children }: { id: string; icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader title={<span className="flex items-center gap-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-a-accent">{icon}{title}</span>} subtitle={description} />
      <div className="space-y-4 p-5">{children}</div>
    </Card>
  );
}

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-a-line px-4 py-3">
      <div className="min-w-0"><p className="text-sm font-medium text-a-fg">{title}</p>{description && <p className="text-xs text-a-muted">{description}</p>}</div>
      {children}
    </div>
  );
}

export default function SettingsView() {
  const { state, saveSettings, signOut } = useAdmin();
  const toast = useToast();
  const confirm = useConfirm();
  usePageLoading(0);
  const [d, setD] = useState<Settings>(state.settings);
  const [err, setErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(d) !== JSON.stringify(state.settings);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setD((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!d.storeName.trim()) e.storeName = "Store name is required.";
    if (!d.adminName.trim()) e.adminName = "Name is required.";
    if (d.adminEmail.trim() && !/^\S+@\S+\.\S+$/.test(d.adminEmail)) e.adminEmail = "Enter a valid email address.";
    if (!Number.isInteger(Number(d.lowStockThreshold)) || d.lowStockThreshold < 0 || d.lowStockThreshold > 1000) e.low = "Whole number between 0 and 1000.";
    setErr(e);
    if (Object.keys(e).length) return toast.error("Please fix the highlighted fields.");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    saveSettings({ ...d, storeName: d.storeName.trim(), adminName: d.adminName.trim() });
    setSaving(false);
    toast.success("Settings saved.");
  };

  const resetForm = () => { setD({ ...DEFAULT_SETTINGS }); setErr({}); toast.info("Form reset to defaults — click “Save changes” to apply."); };


  const nav = [["store", "Store"], ["currency", "Currency"], ["inventory", "Inventory"], ["profile", "Profile"], ["dashboard", "Dashboard"], ["notifications", "Notifications"], ["theme", "Theme"], ["data", "Data & session"]];
  const themes: { v: Settings["theme"]; label: string; icon: React.ReactNode }[] = [{ v: "light", label: "Light", icon: <Sun className="h-4 w-4" /> }, { v: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> }, { v: "system", label: "System", icon: <Monitor className="h-4 w-4" /> }];

  return (
    <>
      <PageHeader title="Settings" description="Settings are saved to the database and apply to every admin." />
      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="hidden lg:block"><ul className="sticky top-24 space-y-0.5 text-sm">{nav.map(([id, l]) => <li key={id}><a href={`#${id}`} className="block rounded-lg px-3 py-1.5 text-a-muted hover:bg-a-subtle hover:text-a-fg">{l}</a></li>)}</ul></nav>
        <div className="space-y-5 pb-24">
          <Section id="store" icon={<Store />} title="Store" description="Name and logo shown in the sidebar and on invoices.">
            <TextField label="Store name" required value={d.storeName} onChange={(e) => set("storeName", e.target.value)} error={err.storeName} maxLength={40} />
            <Field label="Logo" hint="PNG/JPG, resized to 128px and kept in your browser.">
              {() => (
                <div className="flex items-center gap-3">
                  {d.logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={d.logo} alt="Store logo" className="h-12 w-12 rounded-lg border border-a-line object-cover" /> : <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500 text-white"><Store className="h-5 w-5" /></span>}
                  <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) try { set("logo", await resizeLogo(f)); } catch (x) { toast.error((x as Error).message); } }} />
                  <Button size="sm" onClick={() => file.current?.click()}><Upload className="h-3.5 w-3.5" />Upload logo</Button>
                  {d.logo && <Button size="sm" variant="ghost" onClick={() => set("logo", "")}>Remove</Button>}
                </div>
              )}
            </Field>
          </Section>

          <Section id="currency" icon={<Wallet />} title="Currency display" description="All amounts are displayed in Nepalese Rupees.">
            <SelectField label="Currency" value={d.currency} onChange={() => undefined} hint="All prices are shown in Nepalese Rupees."><option value="NPR">NPR — Nepalese Rupee (NPR 12,500)</option></SelectField>
          </Section>

          <Section id="inventory" icon={<Database />} title="Inventory" description="Defaults used across inventory, products and dashboard alerts.">
            <TextField label="Low-stock threshold (units)" inputMode="numeric" value={String(d.lowStockThreshold)} onChange={(e) => set("lowStockThreshold", Number(e.target.value.replace(/[^\d]/g, "")))} error={err.low} hint="Variants at or below this quantity are flagged as low stock." className="max-w-40" />
          </Section>

          <Section id="profile" icon={<UserCog />} title="Admin profile" description="Shown in the header and on internal notes.">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Full name" required value={d.adminName} onChange={(e) => set("adminName", e.target.value)} error={err.adminName} />
              <TextField label="Email" type="email" value={d.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} error={err.adminEmail} />
              <TextField label="Role" value={d.adminRole} onChange={(e) => set("adminRole", e.target.value)} />
            </div>
            
          </Section>

          <Section id="dashboard" icon={<LayoutDashboard />} title="Dashboard preferences" description="Defaults for charts and tables.">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Default period" value={String(d.defaultPeriod)} onChange={(e) => set("defaultPeriod", Number(e.target.value) as Settings["defaultPeriod"])}><option value="1">Today</option><option value="7">7 Days</option><option value="30">30 Days</option><option value="90">90 Days</option></SelectField>
              <SelectField label="Rows per page" value={String(d.pageSize)} onChange={(e) => set("pageSize", Number(e.target.value))}>{[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}</SelectField>
            </div>
            <Row title="Show sparklines on summary cards"><Toggle checked={d.showSparklines} onChange={(v) => set("showSparklines", v)} label="Show sparklines" /></Row>
            <Row title="Compact tables" description="Tighter row spacing."><Toggle checked={d.compactTables} onChange={(v) => set("compactTables", v)} label="Compact tables" /></Row>
          </Section>

          <Section id="notifications" icon={<Bell />} title="Notification preferences" description="Controls which alerts appear in the header bell.">
            <Row title="Low-stock alerts"><Toggle checked={d.notifyLowStock} onChange={(v) => set("notifyLowStock", v)} label="Low stock alerts" /></Row>
            <Row title="New orders"><Toggle checked={d.notifyNewOrder} onChange={(v) => set("notifyNewOrder", v)} label="New order alerts" /></Row>
            <Row title="Payments awaiting verification"><Toggle checked={d.notifyPayment} onChange={(v) => set("notifyPayment", v)} label="Payment alerts" /></Row>
          </Section>

          <Section id="theme" icon={<Palette />} title="Theme" description="Choose how the admin looks.">
            <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
              {themes.map((t) => (
                <button key={t.v} role="radio" aria-checked={d.theme === t.v} onClick={() => set("theme", t.v)} className={clsx("flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors", d.theme === t.v ? "border-a-accent bg-a-accent-soft text-a-accent" : "border-a-line text-a-muted hover:bg-a-subtle")}>{t.icon}{t.label}</button>
              ))}
            </div>
          </Section>

          <Section id="data" icon={<Database />} title="Data & session" description="All data is stored in your PostgreSQL database and shared with the n8n automations.">
            <Row title="Sign out" description="End this admin session on this browser."><Button size="sm" onClick={signOut}><LogOut className="h-3.5 w-3.5" />Sign out</Button></Row>
          </Section>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-a-line bg-a-surface/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-[1440px] items-center justify-end gap-2 sm:px-2">
          <span className="mr-auto text-xs text-a-muted">{dirty ? "You have unsaved changes." : "All changes saved."}</span>
          <Button onClick={resetForm}><RotateCcw className="h-4 w-4" />Reset to defaults</Button>
          <Button disabled={!dirty} onClick={() => { setD(state.settings); setErr({}); }}>Discard</Button>
          <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}><Save className="h-4 w-4" />Save changes</Button>
        </div>
      </div>
    </>
  );
}
