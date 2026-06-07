import { redirect } from "next/navigation";

/** `/account` → the profile section. */
export default function AccountIndexPage() {
  redirect("/account/profile");
}
