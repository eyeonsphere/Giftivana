"use server";

import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
});

export async function updateProfile(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const { user: user } = await requireUser();
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name") ?? undefined,
    phone: formData.get("phone") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name ?? null,
      phone: parsed.data.phone ?? null,
    })
    .eq("id", user.id);

  if (error) return { error: "Failed to update profile." };
  return { success: true };
}
