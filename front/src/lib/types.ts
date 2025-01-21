export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  restricted: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  assigned_to: string | null
  team_id: string | null
}

export interface NewTicket {
  title: string
  description?: string
  priority?: TicketPriority
  team_id?: string
}

export type Role = 'customer' | 'worker' | 'manager'

export interface Profile {
  id: string
  username: string
  email: string
  role: Role
  created_at: string
  updated_at: string
} 