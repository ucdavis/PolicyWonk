// pages/index.js or any specific page
import { auth } from "@/auth";

export default async function ProtectedPage() {
  const session = await auth();

  // Your page content
  return <div>Welcome to the app {session?.user?.name}!</div>;
}
