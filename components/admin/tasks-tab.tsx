"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task, ClientAccount, Manager, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { CreateTaskDialog } from "./create-task-dialog"

type TaskWithRelations = Task & {
  client_account: ClientAccount & {
    manager: Manager & { user: User }
  }
  manager: Manager & { user: User }
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  in_progress: "secondary",
  agreement_done: "outline",
  waiting_for_review: "outline",
  review_done: "outline",
  closed: "secondary",
}

const taskTypeLabels: Record<string, string> = {
  agreement: "Agreement",
  review: "Review",
  new_account: "New Account",
}

export function TasksTab() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const loadTasks = async () => {
    const supabase = createClient()
    setIsLoading(true)

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        client_account:client_accounts(
          *,
          manager:managers(
            *,
            user:users(*)
          )
        ),
        manager:managers(
          *,
          user:users(*)
        )
      `,
      )
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTasks(data as TaskWithRelations[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage and track all tasks</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found. Create your first task to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Client Account</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Badge variant="outline">{taskTypeLabels[task.task_type]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{task.client_account?.account_name}</TableCell>
                    <TableCell>{task.manager?.user?.full_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[task.status]}>{task.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateTaskDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={loadTasks} />
    </>
  )
}
