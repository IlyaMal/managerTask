"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
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

interface AddClientAccountDialogProps {
  managerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddClientAccountDialog({ managerId, open, onOpenChange, onSuccess }: AddClientAccountDialogProps) {
  const [accountName, setAccountName] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: insertError } = await supabase.from("client_accounts").insert({
        account_name: accountName,
        contact_person: contactPerson || null,
        email: email || null,
        phone: phone || null,
        manager_id: managerId,
        status,
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
    setAccountName("")
    setContactPerson("")
    setEmail("")
    setPhone("")
    setStatus("active")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Client Account</DialogTitle>
          <DialogDescription>Create a new client account</DialogDescription>
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
              {isLoading ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
