import { Section } from "@/components/storefront/section";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Section>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-10">
        <ProductGridSkeleton count={8} />
      </div>
    </Section>
  );
}
