import Link from "next/link";

const SHOP_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/shoes", label: "Shoes" },
  { href: "/bags", label: "Bags" },
  { href: "/glasses", label: "Glasses" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const POLICY_LINKS = [
  { href: "/contact", label: "Shipping & Returns" },
  { href: "/contact", label: "Privacy Policy" },
  { href: "/contact", label: "Terms of Service" },
];

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "X", href: "https://x.com" },
  { label: "Pinterest", href: "https://pinterest.com" },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="font-display text-2xl font-black tracking-tight">
              SABSTATION
            </Link>
            <p className="mt-4 max-w-xs text-sm text-cream/60">
              Premium shoes, bags, and glasses for people who move different,
              carry confidence, and see clear.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/20 text-xs transition-colors hover:border-lime hover:text-lime"
                >
                  {s.label[0]}
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Policies" links={POLICY_LINKS} />
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-cream/10 pt-6 text-xs text-cream/40 sm:flex-row sm:items-center">
          <p>&copy; {new Date().getFullYear()} SABSTATION. All rights reserved.</p>
          <p>Designed for movement. Built to last.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-cream/50">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-cream/80 hover:text-lime">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
