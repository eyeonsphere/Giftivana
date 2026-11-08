import { requireUser } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/account/profile-form";

export default async function AccountPage() {
  const { user: user } = await requireUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, preferred_currency, role")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold mb-6">Profile</h1>

      <div className="rounded-card border border-sand bg-white p-6 space-y-4">
        <div>
          <p className="text-sm text-ink/60">Email</p>
          <p className="font-medium">{user.email}</p>
        </div>

        <ProfileForm
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </div>
    </div>
  );
}
