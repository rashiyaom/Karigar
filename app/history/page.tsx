import { HistoryTimeline } from "@/components/history-timeline"

export default function HistoryPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Change History</h1>
        <p className="text-muted-foreground">View recent changes and undo actions if needed</p>
      </div>

      <HistoryTimeline />
    </div>
  )
}
