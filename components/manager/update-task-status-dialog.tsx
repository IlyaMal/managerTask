"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task, ClientAccount } from "@/lib/types"
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

type TaskWithClient = Task & {
  client_account: ClientAccount
}

interface UpdateTaskStatusDialogProps {
  task: TaskWithClient
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const statusFlow: Record<string, string[]> = {
  new: ["in_progress"],
  in_progress: ["agreement_done", "waiting_for_review"],
  agreement_done: ["waiting_for_review"],
  waiting_for_review: ["review_done"],
  review_done: ["closed"],
  closed: [],
}

const statusLabels: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  agreement_done: "Agreement Done",
  waiting_for_review: "Waiting for Review",
  review_done: "Review Done",
  closed: "Closed",
}

export function UpdateTaskStatusDialog({ task, open, onOpenChange, onSuccess }: UpdateTaskStatusDialogProps) {
  const [newStatus, setNewStatus] = useState(task.status)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const availableStatuses = statusFlow[task.status] || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
      }

      // Set timestamps based on status
      if (newStatus === "in_progress" && !task.started_at) {
        updateData.started_at = new Date().toISOString()
      }
      if ((newStatus === "agreement_done" || newStatus === "review_done") && !task.completed_at) {
        updateData.completed_at = new Date().toISOString()
      }
      if (newStatus === "closed" && !task.closed_at) {
        updateData.closed_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase.from("tasks").update(updateData).eq("id", task.id)

      if (updateError) throw updateError

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Task Status</DialogTitle>
          <DialogDescription>
            Update the status of this {task.task_type} task for {task.client_account?.account_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current Status</Label>
              <div className="text-sm font-medium">{statusLabels[task.status]}</div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">New Status</Label>
              {availableStatuses.length > 0 ? (
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">No status updates available for this task.</div>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || newStatus === task.status || availableStatuses.length === 0}>
              {isLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
