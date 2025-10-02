"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientAccountsTab } from "./client-accounts-tab"
import { MyTasksTab } from "./my-tasks-tab"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ManagerDashboardProps {
  managerId: string
}

export function ManagerDashboard({ managerId }: ManagerDashboardProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="clients">Client Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <MyTasksTab managerId={managerId} />
          </TabsContent>

          <TabsContent value="clients" className="mt-6">
            <ClientAccountsTab managerId={managerId} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
