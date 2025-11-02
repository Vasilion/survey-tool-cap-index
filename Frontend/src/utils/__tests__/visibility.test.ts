import { describe, it, expect } from "vitest";
import { computeVisibleQuestionIds } from "../visibility";
import { QuestionDto, SubmitAnswerItem } from "@/types";
import { QuestionType } from "@/types";

describe("computeVisibleQuestionIds", () => {
  const createQuestion = (
    id: string,
    order: number,
    parentId?: string,
    visibleWhen?: string[]
  ): QuestionDto => ({
    id,
    text: `Question ${id}`,
    type: QuestionType.SingleChoice,
    order,
    parentQuestionId: parentId || null,
    visibleWhenSelectedOptionIds: visibleWhen || null,
    options: [
      { id: `opt-${id}-1`, text: "Option 1", weight: 1 },
      { id: `opt-${id}-2`, text: "Option 2", weight: 2 },
    ],
  });

  it("should show all root questions by default", () => {
    const questions: QuestionDto[] = [
      createQuestion("q1", 1),
      createQuestion("q2", 2),
      createQuestion("q3", 3),
    ];

    const visible = computeVisibleQuestionIds(questions, {});
    expect(visible.has("q1")).toBe(true);
    expect(visible.has("q2")).toBe(true);
    expect(visible.has("q3")).toBe(true);
  });

  it("should show conditional question when parent answer matches", () => {
    const questions: QuestionDto[] = [
      createQuestion("q1", 1),
      createQuestion("q2", 2, "q1", ["opt-q1-1"]),
    ];

    const answers: Record<string, SubmitAnswerItem> = {
      q1: {
        questionId: "q1",
        selectedOptionIds: ["opt-q1-1"],
      },
    };

    const visible = computeVisibleQuestionIds(questions, answers);
    expect(visible.has("q1")).toBe(true);
    expect(visible.has("q2")).toBe(true);
  });

  it("should hide conditional question when parent answer does not match", () => {
    const questions: QuestionDto[] = [
      createQuestion("q1", 1),
      createQuestion("q2", 2, "q1", ["opt-q1-1"]),
    ];

    const answers: Record<string, SubmitAnswerItem> = {
      q1: {
        questionId: "q1",
        selectedOptionIds: ["opt-q1-2"],
      },
    };

    const visible = computeVisibleQuestionIds(questions, answers);
    expect(visible.has("q1")).toBe(true);
    expect(visible.has("q2")).toBe(false);
  });

  it("should hide conditional question when parent has no answer", () => {
    const questions: QuestionDto[] = [
      createQuestion("q1", 1),
      createQuestion("q2", 2, "q1", ["opt-q1-1"]),
    ];

    const visible = computeVisibleQuestionIds(questions, {});
    expect(visible.has("q1")).toBe(true);
    expect(visible.has("q2")).toBe(false);
  });

  it("should handle multiple conditional questions with same parent", () => {
    const questions: QuestionDto[] = [
      createQuestion("q1", 1),
      createQuestion("q2", 2, "q1", ["opt-q1-1"]),
      createQuestion("q3", 3, "q1", ["opt-q1-2"]),
    ];

    const answers: Record<string, SubmitAnswerItem> = {
      q1: {
        questionId: "q1",
        selectedOptionIds: ["opt-q1-1"],
      },
    };

    const visible = computeVisibleQuestionIds(questions, answers);
    expect(visible.has("q1")).toBe(true);
    expect(visible.has("q2")).toBe(true);
    expect(visible.has("q3")).toBe(false);
  });

  it("should handle multiple selected options in parent answer", () => {
    const questions: QuestionDto[] = [
      createQuestion("q1", 1),
      createQuestion("q2", 2, "q1", ["opt-q1-1", "opt-q1-2"]),
    ];

    const answers: Record<string, SubmitAnswerItem> = {
      q1: {
        questionId: "q1",
        selectedOptionIds: ["opt-q1-1", "opt-q1-2"],
      },
    };

    const visible = computeVisibleQuestionIds(questions, answers);
    expect(visible.has("q2")).toBe(true);
  });

  it("should handle question without visibleWhenSelectedOptionIds", () => {
    const questions: QuestionDto[] = [
      createQuestion("q1", 1),
      createQuestion("q2", 2, "q1", undefined),
    ];

    const answers: Record<string, SubmitAnswerItem> = {
      q1: {
        questionId: "q1",
        selectedOptionIds: ["opt-q1-1"],
      },
    };

    const visible = computeVisibleQuestionIds(questions, answers);
    expect(visible.has("q1")).toBe(true);
    expect(visible.has("q2")).toBe(false);
  });
});
