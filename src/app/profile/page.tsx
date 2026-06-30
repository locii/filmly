import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";
import { Profile } from "@/lib/types";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Edit your display name and details.",
  robots: { index: false },
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, bio, location, website, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (data as Profile | null) ?? null;
  // created_at on the profile row, or fall back to the auth user's.
  const joinedAt = profile?.created_at ?? user.created_at;

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-brand font-medium">Account</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Your profile</h1>
        <p className="text-zinc-400">Add your details so your published stacks are properly credited to you.</p>
      </div>

      <ProfileForm profile={profile} email={user.email ?? null} joinedAt={joinedAt} />
    </div>
  );
}
