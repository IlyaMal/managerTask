"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Manager, ClientAccount, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type ManagerWithUser = Manager & { user: User }

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateTaskDialog({ open, onOpenChange, onSuccess }: CreateTaskDialogProps) {
  const [managers, setManagers] = useState<ManagerWithUser[]>([])
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([])
  const [selectedManager, setSelectedManager] = useState("")
  const [selectedClient, setSelectedClient] = useState("")
  const [taskType, setTaskType] = useState<"agreement" | "review" | "new_account">("agreement")
  const [description, setDescription] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadManagers()
    }
  }, [open])

  useEffect(() => {
    if (selectedManager) {
      loadClientAccounts(selectedManager)
    } else {
      setClientAccounts([])
      setSelectedClient("")
    }
  }, [selectedManager])

  const loadManagers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("managers")
      .select(
        `
        *,
        user:users!managers_user_id_fkey(*)
      `,
      )
      .eq("status", "active")

    if (data) {
      setManagers(data as ManagerWithUser[])
    }
  }

  const loadClientAccounts = async (managerId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("client_accounts")
      .select("*")
      .eq("manager_id", managerId)
      .eq("status", "active")

    if (data) {
      setClientAccounts(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Check for duplicate tasks based on business rules
      if (taskType === "agreement" || taskType === "review") {
        const { data: existingTasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("client_account_id", selectedClient)
          .eq("manager_id", selectedManager)
          .eq("task_type", taskType)
          .in("status", ["new", "in_progress", "agreement_done", "waiting_for_review", "review_done"])

        if (existingTasks && existingTasks.length > 0) {
          throw new Error(
            `A ${taskType} task already exists for this client account and manager combination. Please close the existing task first.`,
          )
        }
      }

      const { error: insertError } = await supabase.from("tasks").insert({
        task_type: taskType,
        client_account_id: selectedClient,
        manager_id: selectedManager,
        description,
        created_by: user.id,
      })

      if (insertError) throw insertError

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedManager("")
    setSelectedClient("")
    setTaskType("agreement")
    setDescription("")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Assign a new task to a technical manager</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="taskType">Task Type</Label>
              <Select
                value={taskType}
                onValueChange={(value: "agreement" | "review" | "new_account") => setTaskType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="new_account">New Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager">Manager</Label>
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.user?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client">Client Account</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient} disabled={!selectedManager}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedManager ? "Select a client account" : "Select a manager first"} />
                </SelectTrigger>
                <SelectContent>
                  {clientAccounts.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedManager || !selectedClient}>
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
