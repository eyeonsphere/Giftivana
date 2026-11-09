import { CartProvider } from "@/lib/cart/store";
import { DemoBanner } from "@/components/storefront/demo-banner";
import { Footer } from "@/components/storefront/footer";
import { Header } from "@/components/storefront/header";

export default function StorefrontLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DemoBanner />
      <Header />
      <main id="main" className="flex-1">
        <CartProvider>{children}</CartProvider>
      </main>
      <Footer />
    </>
  );
}
