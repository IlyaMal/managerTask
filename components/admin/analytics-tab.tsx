"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface TaskStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  newTasks: number
  averageCompletionTime: number
}

interface TasksByType {
  type: string
  count: number
}

interface TasksByManager {
  manager: string
  tasks: number
  completed: number
}

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"]

export function AnalyticsTab() {
  const [stats, setStats] = useState<TaskStats>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    newTasks: 0,
    averageCompletionTime: 0,
  })
  const [tasksByType, setTasksByType] = useState<TasksByType[]>([])
  const [tasksByManager, setTasksByManager] = useState<TasksByManager[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    const supabase = createClient()
    setIsLoading(true)

    try {
      // Get all tasks with manager info
      const { data: tasks } = await supabase.from("tasks").select(
        `
        *,
        manager:managers(
          *,
          user:users(*)
        )
      `,
      )

      if (tasks) {
        // Calculate basic stats
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t) => t.status === "closed").length
        const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length
        const newTasks = tasks.filter((t) => t.status === "new").length

        // Calculate average completion time (in days)
        const completedTasksWithTime = tasks.filter((t) => t.closed_at && t.created_at)
        const totalCompletionTime = completedTasksWithTime.reduce((acc, task) => {
          const created = new Date(task.created_at).getTime()
          const closed = new Date(task.closed_at!).getTime()
          return acc + (closed - created) / (1000 * 60 * 60 * 24) // Convert to days
        }, 0)
        const averageCompletionTime =
          completedTasksWithTime.length > 0 ? totalCompletionTime / completedTasksWithTime.length : 0

        setStats({
          totalTasks,
          completedTasks,
          inProgressTasks,
          newTasks,
          averageCompletionTime,
        })

        // Group by task type
        const typeGroups = tasks.reduce(
          (acc, task) => {
            acc[task.task_type] = (acc[task.task_type] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        const typeLabels: Record<string, string> = {
          agreement: "Agreement",
          review: "Review",
          new_account: "New Account",
        }

        setTasksByType(
          Object.entries(typeGroups).map(([type, count]) => ({
            type: typeLabels[type] || type,
            count,
          })),
        )

        // Group by manager
        const managerGroups = tasks.reduce(
          (acc, task) => {
            const managerName = (task.manager as any)?.user?.full_name || "Unknown"
            if (!acc[managerName]) {
              acc[managerName] = { total: 0, completed: 0 }
            }
            acc[managerName].total++
            if (task.status === "closed") {
              acc[managerName].completed++
            }
            return acc
          },
          {} as Record<string, { total: number; completed: number }>,
        )

        setTasksByManager(
          Object.entries(managerGroups).map(([manager, data]) => ({
            manager,
            tasks: data.total,
            completed: data.completed,
          })),
        )
      }
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>Task completion metrics and performance analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{stats.totalTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Tasks</CardDescription>
            <CardTitle className="text-3xl">{stats.completedTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{stats.inProgressTasks}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Completion Time</CardDescription>
            <CardTitle className="text-3xl">{stats.averageCompletionTime.toFixed(1)} days</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tasks by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Type</CardTitle>
            <CardDescription>Distribution of task types</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={tasksByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label>
                    {tasksByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Tasks by Manager */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Manager</CardTitle>
            <CardDescription>Total and completed tasks per manager</CardDescription>
          </CardHeader>
          <CardContent>
            {tasksByManager.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tasksByManager}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="manager" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="hsl(var(--chart-1))" name="Total Tasks" />
                  <Bar dataKey="completed" fill="hsl(var(--chart-2))" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Manager Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Manager Performance</CardTitle>
          <CardDescription>Detailed breakdown of tasks per manager</CardDescription>
        </CardHeader>
        <CardContent>
          {tasksByManager.length > 0 ? (
            <div className="space-y-4">
              {tasksByManager.map((manager) => {
                const completionRate = manager.tasks > 0 ? (manager.completed / manager.tasks) * 100 : 0
                return (
                  <div key={manager.manager} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{manager.manager}</span>
                      <span className="text-sm text-muted-foreground">
                        {manager.completed} / {manager.tasks} ({completionRate.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
