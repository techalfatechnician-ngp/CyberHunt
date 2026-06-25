import { redirect } from "next/navigation";

export default function AdminRootPage() {
  // Redirect to the volunteer submissions portal by default
  redirect("/admin/submissions");
}
