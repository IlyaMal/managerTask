"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ClientAccount } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditClientAccountDialogProps {
  client: ClientAccount
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditClientAccountDialog({ client, open, onOpenChange, onSuccess }: EditClientAccountDialogProps) {
  const [accountName, setAccountName] = useState(client.account_name)
  const [contactPerson, setContactPerson] = useState(client.contact_person || "")
  const [email, setEmail] = useState(client.email || "")
  const [phone, setPhone] = useState(client.phone || "")
  const [status, setStatus] = useState<"active" | "inactive">(client.status)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: updateError } = await supabase
        .from("client_accounts")
        .update({
          account_name: accountName,
          contact_person: contactPerson || null,
          email: email || null,
          phone: phone || null,
          status,
        })
        .eq("id", client.id)

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
          <DialogTitle>Edit Client Account</DialogTitle>
          <DialogDescription>Update client account information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input id="accountName" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: "active" | "inactive") => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
