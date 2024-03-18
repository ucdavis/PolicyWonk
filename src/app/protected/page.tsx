// pages/index.js or any specific page
import { auth, signIn } from "@/auth";

export default async function ProtectedPage() {
  const session = await auth();

  console.log("session", session);

  // Your page content
  return <div>Welcome to the app!</div>;
}
