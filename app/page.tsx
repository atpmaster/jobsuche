import { getDashboardData } from "./actions";
import { requireChatGPTUser } from "./chatgpt-auth";
import { Dashboard } from "./dashboard";

export const dynamic = "force-dynamic";

// Ahmet Tepe Başvuru takibi sayfası.
export default async function Home() {
  // The dashboard contains personal application data. Keep the read-only
  // integration feed separate so the interview portal can still sync it.
  await requireChatGPTUser("/");
  const data = await getDashboardData();
  return <Dashboard {...data} today={new Date().toISOString().slice(0, 10)} />;
}
