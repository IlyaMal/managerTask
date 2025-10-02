"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Manager, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type ManagerWithUser = Manager & { user: User }

interface DeleteManagerDialogProps {
  manager: ManagerWithUser
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteManagerDialog({ manager, open, onOpenChange, onSuccess }: DeleteManagerDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error: deleteError } = await supabase.from("managers").delete().eq("id", manager.id)

      if (deleteError) throw deleteError

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Manager</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {manager.user?.full_name}? This action cannot be undone and will also delete
            all associated client accounts and tasks.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
