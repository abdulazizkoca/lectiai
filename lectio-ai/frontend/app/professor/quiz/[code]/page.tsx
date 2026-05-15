import { redirect } from "next/navigation";

export default function ProfessorQuizCodePage({ params }: { params: { code: string } }) {
  redirect(`/professor/quiz/${params.code}/control`);
}
