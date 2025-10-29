import { QuestionDto, SubmitAnswerItem } from "@/types";

export function computeVisibleQuestionIds(
  questions: QuestionDto[],
  answers: Record<string, SubmitAnswerItem>
): Set<string> {
  const visible = new Set<string>();
  const ordered = [...questions].sort((a, b) => a.order - b.order);

  for (const q of ordered) {
    if (!q.parentQuestionId) {
      visible.add(q.id);
      continue;
    }

    if (
      !q.visibleWhenSelectedOptionIds ||
      q.visibleWhenSelectedOptionIds.length === 0
    ) {
      continue;
    }

    const parentAns = answers[q.parentQuestionId];
    if (!parentAns) {
      continue;
    }

    if (
      !parentAns.selectedOptionIds ||
      parentAns.selectedOptionIds.length === 0
    ) {
      continue;
    }

    const set = new Set(parentAns.selectedOptionIds);
    const matches = q.visibleWhenSelectedOptionIds.some((id) => set.has(id));

    if (matches) {
      visible.add(q.id);
    }
  }

  return visible;
}
