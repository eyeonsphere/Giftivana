"use server";

import { requireStaff } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function updateProduct(id: string, data: Record<string, unknown>) {
  await requireStaff();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("products")
    .update({
      name: data.name as string,
      slug: data.slug as string,
      short_description: data.shortDescription as string,
      description: data.description as string,
      category_id: data.categoryId as string,
      partner_id: (data.partnerId as string) || null,
      status: data.status as string,
      is_featured: data.isFeatured as boolean,
      base_price_minor: data.basePriceMinor as number,
      currency: data.currency as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}

export async function createProduct(data: Record<string, unknown>) {
  await requireStaff();
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: data.name as string,
      slug: data.slug as string,
      product_type: data.productType as string,
      short_description: (data.shortDescription as string) ?? "",
      description: (data.description as string) ?? "",
      category_id: data.categoryId as string,
      partner_id: (data.partnerId as string) || null,
      status: "draft",
      is_featured: false,
      is_demo: false,
      base_price_minor: data.basePriceMinor as number,
      currency: (data.currency as string) ?? "USD",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/admin/products");
  return { ok: true, id: product.id };
}

export async function toggleFeatured(id: string) {
  await requireStaff();
  const supabase = createAdminClient();

  const { data: current } = await supabase
    .from("products")
    .select("is_featured")
    .eq("id", id)
    .single();

  if (!current) return { error: "Product not found" };

  await supabase
    .from("products")
    .update({ is_featured: !current.is_featured })
    .eq("id", id);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}
