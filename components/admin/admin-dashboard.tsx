"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ManagersTab } from "./managers-tab"
import { TasksTab } from "./tasks-tab"
import { AnalyticsTab } from "./analytics-tab"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AdminDashboard() {
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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="managers" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="managers">Managers</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="managers" className="mt-6">
            <ManagersTab />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <TasksTab />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
