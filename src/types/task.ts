export type Task = {
  id: string
  userId: string
  title: string
  notes: string
  projectId: string | null
  scheduledAt: string | null // ISO 8601
  estimateMinutes: number | null
  done: boolean
  createdAt: string
  updatedAt: string
}
