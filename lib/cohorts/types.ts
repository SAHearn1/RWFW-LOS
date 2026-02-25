export interface CohortRecord {
  id: string;
  name: string;
  status: "active" | "pending" | "completed";
  learnerIds: string[];
  createdAtIso: string;
}
