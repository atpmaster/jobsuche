import { getDashboardData } from "./actions";
import { Dashboard } from "./dashboard";

export const dynamic = "force-dynamic";

// Ahmet Tepe Başvuru takibi sayfası.
export default async function Home() {
  const data = await getDashboardData();
  return <Dashboard {...data} today={new Date().toISOString().slice(0, 10)} />;
}
