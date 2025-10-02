export type UserRole = "admin" | "manager"

export type TaskType = "agreement" | "review" | "new_account"

export type TaskStatus = "new" | "in_progress" | "agreement_done" | "waiting_for_review" | "review_done" | "closed"

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Manager {
  id: string
  user_id: string
  phone: string | null
  status: "active" | "inactive"
  created_at: string
  created_by: string | null
  user?: User
}

export interface ClientAccount {
  id: string
  account_name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  manager_id: string
  status: "active" | "inactive"
  created_at: string
  manager?: Manager
}

export interface Task {
  id: string
  task_type: TaskType
  client_account_id: string
  manager_id: string
  status: TaskStatus
  description: string | null
  created_at: string
  created_by: string | null
  started_at: string | null
  completed_at: string | null
  closed_at: string | null
  client_account?: ClientAccount
  manager?: Manager
}
