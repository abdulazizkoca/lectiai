import { redirect } from "next/navigation";

export default function StudyRedirectPage() {
  // Redirects the legacy "Continue Study" link to the new enhanced independent study mode
  redirect("/student/independent/learn?topic=Fizika+-+Termodinamika&mode=tutor");
}
