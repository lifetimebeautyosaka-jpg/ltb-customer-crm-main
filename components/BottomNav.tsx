"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 画面下に浮いた黒い丸型のメニュー。今いる画面に小さなゴールドの点。
const ITEMS = [
  { label: "ホーム", href: "/dashboard", match: ["/dashboard"] },
  { label: "予約", href: "/reservation", match: ["/reservation"] },
  { label: "顧客", href: "/customer", match: ["/customer", "/ltv", "/repeat-rate"] },
  { label: "売上", href: "/sales", match: ["/sales", "/accounting", "/tickets", "/ticket-contracts"] },
  { label: "その他", href: "/dashboard#menu", match: ["/attendance", "/followup", "/account", "/meal"] },
];

// ログイン画面やお客様向けの画面では出さない
const HIDDEN_PREFIXES = ["/login", "/signup", "/register", "/mypage", "/shop", "/cart", "/checkout", "/orders", "/subscription"];

export default function BottomNav() {
  const pathname = usePathname() || "";
  if (pathname === "/" || HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    // ただし /signup/list はスタッフ用なので出す
    if (!pathname.startsWith("/signup/list")) return null;
  }

  return (
    <>
      <style>{`
        .gu-bottom-spacer { height: calc(104px + env(safe-area-inset-bottom)); flex-shrink: 0; }
        @media print { .gu-bottom-nav, .gu-bottom-spacer { display: none; } }
        .gu-bottom-nav {
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: calc(16px + env(safe-area-inset-bottom));
          width: calc(100% - 32px);
          max-width: 480px;
          height: 64px;
          border-radius: 32px;
          background: var(--gu-ink);
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          align-items: center;
          z-index: 50;
          box-shadow: 0 10px 30px rgba(21, 23, 28, 0.18);
        }
        .gu-bottom-nav a {
          height: 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11px;
          color: #A9A49A;
          text-decoration: none;
          font-family: var(--gu-font-body);
        }
        .gu-bottom-nav a[aria-current="page"] {
          color: var(--gu-bg);
        }
        .gu-bottom-nav .dot {
          width: 6px;
          height: 6px;
          border-radius: 3px;
          background: transparent;
        }
        .gu-bottom-nav a[aria-current="page"] .dot {
          background: var(--gu-gold-on-ink);
        }
      `}</style>
      <div className="gu-bottom-spacer" aria-hidden="true" />
      <nav className="gu-bottom-nav" aria-label="メインメニュー">
        {ITEMS.map((item) => {
          const active = item.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          return (
            <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined}>
              <span className="dot" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
