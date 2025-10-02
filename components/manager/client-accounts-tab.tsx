"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ClientAccount } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { AddClientAccountDialog } from "./add-client-account-dialog"
import { EditClientAccountDialog } from "./edit-client-account-dialog"
import { DeleteClientAccountDialog } from "./delete-client-account-dialog"

interface ClientAccountsTabProps {
  managerId: string
}

export function ClientAccountsTab({ managerId }: ClientAccountsTabProps) {
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientAccount | null>(null)
  const [deletingClient, setDeletingClient] = useState<ClientAccount | null>(null)

  const loadClientAccounts = async () => {
    const supabase = createClient()
    setIsLoading(true)

    const { data, error } = await supabase
      .from("client_accounts")
      .select("*")
      .eq("manager_id", managerId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setClientAccounts(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadClientAccounts()
  }, [managerId])

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Accounts</CardTitle>
              <CardDescription>Manage your client accounts</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading client accounts...</div>
          ) : clientAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No client accounts found. Add your first client to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientAccounts.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.account_name}</TableCell>
                    <TableCell>{client.contact_person || "N/A"}</TableCell>
                    <TableCell>{client.email || "N/A"}</TableCell>
                    <TableCell>{client.phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === "active" ? "default" : "secondary"}>{client.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingClient(client)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingClient(client)}>
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

      <AddClientAccountDialog
        managerId={managerId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={loadClientAccounts}
      />

      {editingClient && (
        <EditClientAccountDialog
          client={editingClient}
          open={!!editingClient}
          onOpenChange={(open) => !open && setEditingClient(null)}
          onSuccess={loadClientAccounts}
        />
      )}

      {deletingClient && (
        <DeleteClientAccountDialog
          client={deletingClient}
          open={!!deletingClient}
          onOpenChange={(open) => !open && setDeletingClient(null)}
          onSuccess={loadClientAccounts}
        />
      )}
    </>
  )
}
