import { redirect } from "next/navigation";

/**
 * Root path redirects to `/overview` per the V1 spec.
 */
export default function RootPage(): never {
  redirect("/overview");
}
