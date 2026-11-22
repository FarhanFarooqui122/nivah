import { NivahError } from "@/components/dashboard/Error";

export default function DashboardError({ error }: { error: Error }) {
  return <NivahError error={error.message || "Something went wrong"} />;
}