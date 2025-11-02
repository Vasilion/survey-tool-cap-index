import { QuestionType } from "@/types";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: "Single Choice",
  [QuestionType.MultipleChoice]: "Multiple Choice",
  [QuestionType.FreeText]: "Free Text",
};

export const QUESTION_TYPE_COLORS: Record<
  QuestionType,
  "primary" | "secondary" | "success" | "default"
> = {
  [QuestionType.SingleChoice]: "primary",
  [QuestionType.MultipleChoice]: "secondary",
  [QuestionType.FreeText]: "success",
};

export const QUESTION_TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  [QuestionType.SingleChoice]: "Single Choice (only one answer allowed)",
  [QuestionType.MultipleChoice]:
    "Multiple Choice (more than one answer can be checked)",
  [QuestionType.FreeText]: "Free Text (open-ended response)",
};

export function getQuestionTypeLabel(type: QuestionType): string {
  return QUESTION_TYPE_LABELS[type] ?? "Unknown";
}

export function getQuestionTypeColor(
  type: QuestionType
): "primary" | "secondary" | "success" | "default" {
  return QUESTION_TYPE_COLORS[type] ?? "default";
}
