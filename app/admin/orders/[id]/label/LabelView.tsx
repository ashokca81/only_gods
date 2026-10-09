'use client';

import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { formatPrice } from '@/lib/format';

export interface LabelItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
}

export interface LabelOrder {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  address_line: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  payment_method: string;
  total: number;
  created_at: string;
  order_items: LabelItem[];
}

// Company / return address printed on the label. Edit here to change it.
const RETURN_ADDRESS = {
  name: 'ONLY GODS',
  line: 'D.No 12-3-45, Governorpet, Vijayawada, Andhra Pradesh - 520002',
  phone: '+91 90005 49009',
};

export default function LabelView({
  order,
  autoPrint = true,
}: {
  order: LabelOrder;
  autoPrint?: boolean;
}) {
  // Open the print dialog automatically once the label has rendered.
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [autoPrint]);

  const isCod = (order.payment_method || 'cod').toLowerCase() === 'cod';
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const addr = [order.address_line, order.city, order.state]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="screen-wrap">
      {/* Controls (never printed) */}
      <div className="no-print toolbar">
        <button onClick={() => window.print()} className="print-btn">
          <Printer size={16} /> Print label
        </button>
        <span className="hint">4&quot; × 6&quot; · black &amp; white · thermal-ready</span>
      </div>

      {/* The 4x6 label */}
      <div className="label-sheet">
        {/* Logo */}
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dark_logo.png" alt="ONLY GODS" className="logo" />
        </div>

        {/* Return / company address */}
        <div className="fromblock">
          <span className="mini">RETURN TO (IF UNDELIVERED)</span>
          <div className="fromtext">
            <span className="bold">{RETURN_ADDRESS.name}</span> · {RETURN_ADDRESS.line} · {RETURN_ADDRESS.phone}
          </div>
        </div>

        <div className="divider" />

        {/* Order no + date */}
        <div className="row between">
          <div>
            <div className="mini">ORDER</div>
            <div className="orderno">{order.order_no}</div>
          </div>
          <div className="right">
            <div className="mini">DATE</div>
            <div className="bold">{date}</div>
          </div>
        </div>

        <div className="divider" />

        {/* Ship to + QR */}
        <div className="row gap">
          <div className="shipto">
            <div className="mini">SHIP TO</div>
            <div className="name">{order.customer_name}</div>
            <div className="bold phone">{order.customer_phone}</div>
            <div className="addr">{addr}</div>
            {order.pincode && <div className="pin">PIN: {order.pincode}</div>}
          </div>
          <div className="qr">
            <QRCodeSVG value={order.order_no} size={104} level="M" />
            <div className="qrcaption">{order.order_no}</div>
          </div>
        </div>

        {/* Payment banner */}
        <div className={`pay ${isCod ? '' : 'prepaid'}`}>
          {isCod ? (
            <>
              <span className="paylabel">CASH ON DELIVERY</span>
              <span className="payamt">COLLECT {formatPrice(Number(order.total))}</span>
            </>
          ) : (
            <>
              <span className="paylabel">PREPAID</span>
              <span className="payamt">{formatPrice(Number(order.total))}</span>
            </>
          )}
        </div>

        {/* Items */}
        <div className="items">
          <div className="mini">ITEMS ({order.order_items?.length ?? 0})</div>
          <ul>
            {order.order_items?.map((it) => (
              <li key={it.id}>
                <span className="iname">
                  {it.name}
                  {(it.size || it.color) && (
                    <span className="opt"> — {[it.size, it.color].filter(Boolean).join('/')}</span>
                  )}
                </span>
                <span className="qty">×{it.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="spacer" />
        <div className="divider" />

        {/* Footer */}
        <div className="footer">
          <div className="bold">ONLY GODS</div>
          <div>Vijayawada, Andhra Pradesh · +91 90005 49009</div>
          <div className="thanks">Thank you for shopping with us ♡</div>
        </div>
      </div>

      <style jsx global>{`
        @page {
          size: 4in 6in;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          .label-sheet,
          .label-sheet * {
            visibility: visible !important;
          }
          .label-sheet {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0 !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <style jsx>{`
        .screen-wrap {
          min-height: 100vh;
          background: #e5e5e5;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 12px 60px;
          gap: 16px;
        }
        .toolbar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .print-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .hint {
          font-size: 11px;
          color: #666;
        }

        .label-sheet {
          width: 4in;
          height: 6in;
          box-sizing: border-box;
          background: #fff;
          color: #000;
          border: 2px dashed #000;
          border-radius: 6px;
          padding: 0.18in;
          display: flex;
          flex-direction: column;
          font-family: "Helvetica Neue", Arial, sans-serif;
          line-height: 1.25;
          overflow: hidden;
        }
        .brand {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2px 0 6px;
        }
        .logo {
          height: 46px;
          width: auto;
          object-fit: contain;
          max-width: 90%;
        }
        .fromblock {
          text-align: center;
          margin-top: 3px;
        }
        .fromtext {
          font-size: 9px;
          margin-top: 1px;
          line-height: 1.2;
        }
        .divider {
          border-top: 1.5px dashed #000;
          margin: 6px 0;
        }
        .row {
          display: flex;
        }
        .row.between {
          justify-content: space-between;
          align-items: flex-start;
        }
        .row.gap {
          gap: 10px;
          align-items: flex-start;
        }
        .mini {
          font-size: 8px;
          letter-spacing: 1.5px;
          font-weight: 700;
          color: #000;
          opacity: 0.6;
        }
        .orderno {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .right {
          text-align: right;
        }
        .bold {
          font-weight: 700;
        }
        .shipto {
          flex: 1;
          min-width: 0;
        }
        .name {
          font-size: 15px;
          font-weight: 800;
          margin-top: 1px;
        }
        .phone {
          font-size: 13px;
        }
        .addr {
          font-size: 12px;
          margin-top: 2px;
        }
        .pin {
          font-size: 12px;
          font-weight: 700;
          margin-top: 2px;
        }
        .qr {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }
        .qrcaption {
          font-size: 7px;
          font-weight: 700;
          margin-top: 2px;
          letter-spacing: 0.5px;
        }
        .pay {
          margin: 8px 0;
          border: 2px solid #000;
          border-radius: 6px;
          padding: 6px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .paylabel {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
        }
        .payamt {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }
        .pay.prepaid {
          background: #000;
          color: #fff;
        }
        .items {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .items ul {
          list-style: none;
          margin: 4px 0 0;
          padding: 0;
        }
        .items li {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 11px;
          padding: 2px 0;
          border-bottom: 1px dotted #999;
        }
        .iname {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .opt {
          opacity: 0.7;
        }
        .qty {
          font-weight: 800;
          flex-shrink: 0;
        }
        .spacer {
          flex: 1;
        }
        .footer {
          text-align: center;
          font-size: 10px;
        }
        .thanks {
          margin-top: 2px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
