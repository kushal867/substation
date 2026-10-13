import { fmtDate, npr } from "../../lib/format";
import { orderSubtotal, orderTotal } from "../../lib/range";
import type { Customer, Order, Settings } from "../../types";

/** Print-friendly invoice. Uses inline styles only so it prints identically regardless of theme. */
export function Invoice({ order, customer, settings }: { order: Order; customer?: Customer; settings: Settings }) {
  const total = orderTotal(order);
  const th: React.CSSProperties = { textAlign: "left", padding: "8px 6px", borderBottom: "2px solid #111", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 };
  const td: React.CSSProperties = { padding: "8px 6px", borderBottom: "1px solid #ddd", fontSize: 13 };
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#111", maxWidth: 760, margin: "0 auto", padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, letterSpacing: 2 }}>{settings.storeName}</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#555" }}>Shoes · Glasses · Bags</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>INVOICE</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>{order.number}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#555" }}>Date: {fmtDate(order.date)}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 32, marginBottom: 24, fontSize: 13 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", color: "#777" }}>Billed to</p>
          <p style={{ margin: "4px 0 0", fontWeight: 700 }}>{customer?.name ?? "Customer"}</p>
          {customer && <p style={{ margin: "2px 0 0" }}>{customer.phone}</p>}
          {customer && <p style={{ margin: "2px 0 0" }}>{customer.email}</p>}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", color: "#777" }}>Deliver to</p>
          <p style={{ margin: "4px 0 0" }}>{order.address}</p>
          <p style={{ margin: "2px 0 0" }}>{order.zoneName}</p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", color: "#777" }}>Status</p>
          <p style={{ margin: "4px 0 0" }}>Order: {order.orderStatus}</p>
          <p style={{ margin: "2px 0 0" }}>Payment: {order.paymentStatus}</p>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr><th style={th}>Item</th><th style={{ ...th, textAlign: "right" }}>Qty</th><th style={{ ...th, textAlign: "right" }}>Price</th><th style={{ ...th, textAlign: "right" }}>Amount</th></tr>
        </thead>
        <tbody>
          {order.items.map((i, idx) => (
            <tr key={idx}>
              <td style={td}><strong>{i.name}</strong><br /><span style={{ color: "#666", fontSize: 12 }}>{i.variantLabel}</span></td>
              <td style={{ ...td, textAlign: "right" }}>{i.qty}</td>
              <td style={{ ...td, textAlign: "right" }}>{npr(i.price)}</td>
              <td style={{ ...td, textAlign: "right" }}>{npr(i.price * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table style={{ marginLeft: "auto", marginTop: 16, fontSize: 13, minWidth: 280 }}>
        <tbody>
          <tr><td style={{ padding: "4px 6px" }}>Subtotal</td><td style={{ padding: "4px 6px", textAlign: "right" }}>{npr(orderSubtotal(order))}</td></tr>
          <tr><td style={{ padding: "4px 6px" }}>Delivery fee ({order.zoneName})</td><td style={{ padding: "4px 6px", textAlign: "right" }}>{npr(order.deliveryFee)}</td></tr>
          <tr><td style={{ padding: "6px", borderTop: "2px solid #111", fontWeight: 700 }}>Total</td><td style={{ padding: "6px", borderTop: "2px solid #111", textAlign: "right", fontWeight: 700 }}>{npr(total)}</td></tr>
          <tr><td style={{ padding: "4px 6px" }}>Paid</td><td style={{ padding: "4px 6px", textAlign: "right" }}>{npr(order.paid)}</td></tr>
          <tr><td style={{ padding: "4px 6px", fontWeight: 700 }}>Balance due</td><td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{npr(order.paymentStatus === "Refunded" || order.orderStatus === "Cancelled" ? 0 : Math.max(0, total - order.paid))}</td></tr>
        </tbody>
      </table>
      <p style={{ marginTop: 48, fontSize: 11, color: "#777", textAlign: "center" }}>Thank you for shopping with {settings.storeName}. This is a computer-generated invoice.</p>
    </div>
  );
}
