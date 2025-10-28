export enum QuestionType {
  SingleChoice = 0,
  MultipleChoice = 1,
  FreeText = 2,
}

export type SurveySummaryDto = {
  id: string;
  title: string;
};

export type AnswerOptionDto = {
  id: string;
  text: string;
  weight: number;
};

export type QuestionDto = {
  id: string;
  text: string;
  type: number;
  order: number;
  parentQuestionId?: string | null;
  visibleWhenSelectedOptionIds?: string[] | null;
  options: AnswerOptionDto[];
};

export type SurveyDto = {
  id: string;
  title: string;
  description?: string | null;
  questions: QuestionDto[];
};

export type SubmitAnswerItem = {
  questionId: string;
  selectedOptionIds?: string[];
  freeText?: string;
};

export type SubmitResponseRequest = {
  answers: SubmitAnswerItem[];
};

export type SubmitResponseResult = {
  responseId: string;
  totalScore: number;
};

// Survey Management Types
export type CreateSurveyRequest = {
  title: string;
  description?: string;
  questions: QuestionUpsertDto[];
};

export type UpdateSurveyRequest = {
  title: string;
  description?: string;
  questions: QuestionUpsertDto[];
};

export type QuestionUpsertDto = {
  text: string;
  type: number;
  order: number;
  parentQuestionId?: string | null;
  visibleWhenSelectedOptionIds?: string[] | null;
  options: AnswerOptionUpsertDto[];
};

export type AnswerOptionUpsertDto = {
  text: string;
  weight: number;
};
