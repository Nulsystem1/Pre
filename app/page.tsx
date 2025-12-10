import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to sign-in page - no landing page needed
  redirect("/sign-in")
}
