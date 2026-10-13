import Providers from "../providers";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
