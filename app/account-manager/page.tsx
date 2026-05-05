import { redirect } from "next/navigation";

/**
 * `/account-manager` defaults to the first family tab per spec.
 */
export default function AccountManagerIndex(): never {
  redirect("/account-manager/github");
}
