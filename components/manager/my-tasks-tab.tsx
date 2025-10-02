"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Task, ClientAccount } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UpdateTaskStatusDialog } from "./update-task-status-dialog"

type TaskWithClient = Task & {
  client_account: ClientAccount
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

interface MyTasksTabProps {
  managerId: string
}

export function MyTasksTab({ managerId }: MyTasksTabProps) {
  const [tasks, setTasks] = useState<TaskWithClient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskWithClient | null>(null)

  const loadTasks = async () => {
    const supabase = createClient()
    setIsLoading(true)

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        client_account:client_accounts(*)
      `,
      )
      .eq("manager_id", managerId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTasks(data as TaskWithClient[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadTasks()
  }, [managerId])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>View and manage your assigned tasks</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tasks assigned yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Client Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Badge variant="outline">{taskTypeLabels[task.task_type]}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{task.client_account?.account_name}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[task.status]}>{task.status.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>{new Date(task.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                        disabled={task.status === "closed"}
                      >
                        Update Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedTask && (
        <UpdateTaskStatusDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onSuccess={loadTasks}
        />
      )}
    </>
  )
}
