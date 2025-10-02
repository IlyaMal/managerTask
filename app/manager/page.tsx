import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ManagerDashboard } from "@/components/manager/manager-dashboard"

export default async function ManagerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "manager") {
    redirect("/admin")
  }

  // Get manager profile
  const { data: managerData } = await supabase.from("managers").select("*").eq("user_id", user.id).single()

  if (!managerData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Manager Profile Not Found</h1>
          <p className="text-muted-foreground">Please contact an administrator to set up your manager profile.</p>
        </div>
      </div>
    )
  }

  return <ManagerDashboard managerId={managerData.id} />
}
