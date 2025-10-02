"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Manager, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { AddManagerDialog } from "./add-manager-dialog"
import { EditManagerDialog } from "./edit-manager-dialog"
import { DeleteManagerDialog } from "./delete-manager-dialog"

type ManagerWithUser = Manager & { user: User }

export function ManagersTab() {
  const [managers, setManagers] = useState<ManagerWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingManager, setEditingManager] = useState<ManagerWithUser | null>(null)
  const [deletingManager, setDeletingManager] = useState<ManagerWithUser | null>(null)

  const loadManagers = async () => {
    const supabase = createClient()
    setIsLoading(true)

    const { data, error } = await supabase
      .from("managers")
      .select(
        `
        *,
        user:users(*)
      `,
      )
      .order("created_at", { ascending: false })

    if (!error && data) {
      setManagers(data as ManagerWithUser[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadManagers()
  }, [])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Technical Managers</CardTitle>
              <CardDescription>Manage technical manager accounts</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Manager
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading managers...</div>
          ) : managers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No managers found. Add your first manager to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managers.map((manager) => (
                  <TableRow key={manager.id}>
                    <TableCell className="font-medium">{manager.user?.full_name || "N/A"}</TableCell>
                    <TableCell>{manager.user?.email}</TableCell>
                    <TableCell>{manager.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={manager.status === "active" ? "default" : "secondary"}>{manager.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(manager.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingManager(manager)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingManager(manager)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddManagerDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={loadManagers} />

      {editingManager && (
        <EditManagerDialog
          manager={editingManager}
          open={!!editingManager}
          onOpenChange={(open) => !open && setEditingManager(null)}
          onSuccess={loadManagers}
        />
      )}

      {deletingManager && (
        <DeleteManagerDialog
          manager={deletingManager}
          open={!!deletingManager}
          onOpenChange={(open) => !open && setDeletingManager(null)}
          onSuccess={loadManagers}
        />
      )}
    </>
  )
}
