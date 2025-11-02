import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Question from "../Question";
import { QuestionType, SubmitAnswerItem } from "../../types";

const mockSingleChoiceQuestion = {
  id: "1",
  text: "Test Single Choice Question",
  type: QuestionType.SingleChoice,
  order: 1,
  parentQuestionId: null,
  visibleWhenSelectedOptionIds: null,
  options: [
    { id: "opt1", text: "Option 1", weight: 1 },
    { id: "opt2", text: "Option 2", weight: 2 },
  ],
};

const mockMultipleChoiceQuestion = {
  id: "2",
  text: "Test Multiple Choice Question",
  type: QuestionType.MultipleChoice,
  order: 2,
  parentQuestionId: null,
  visibleWhenSelectedOptionIds: null,
  options: [
    { id: "opt3", text: "Option A", weight: 1 },
    { id: "opt4", text: "Option B", weight: 2 },
    { id: "opt5", text: "Option C", weight: 3 },
  ],
};

const mockFreeTextQuestion = {
  id: "3",
  text: "Test Free Text Question",
  type: QuestionType.FreeText,
  order: 3,
  parentQuestionId: null,
  visibleWhenSelectedOptionIds: null,
  options: [],
};

describe("Question Component", () => {
  it("renders question text", () => {
    const handleChange = vi.fn();
    render(
      <Question
        question={mockSingleChoiceQuestion}
        value={undefined}
        onChange={handleChange}
      />
    );

    expect(screen.getByText("Test Single Choice Question")).toBeInTheDocument();
  });

  it("renders radio buttons for single choice question", () => {
    const handleChange = vi.fn();
    render(
      <Question
        question={mockSingleChoiceQuestion}
        value={undefined}
        onChange={handleChange}
      />
    );

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("handles single choice selection", () => {
    const handleChange = vi.fn();
    render(
      <Question
        question={mockSingleChoiceQuestion}
        value={undefined}
        onChange={handleChange}
      />
    );

    const radio1 = screen.getByDisplayValue("opt1");
    fireEvent.click(radio1);

    expect(handleChange).toHaveBeenCalledWith({
      questionId: "1",
      selectedOptionIds: ["opt1"],
    });
  });

  it("renders checkboxes for multiple choice question", () => {
    const handleChange = vi.fn();
    render(
      <Question
        question={mockMultipleChoiceQuestion}
        value={undefined}
        onChange={handleChange}
      />
    );

    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
    expect(screen.getByText("Option C")).toBeInTheDocument();
  });

  it("handles multiple choice selection", () => {
    const handleChange = vi.fn();
    const currentValue: SubmitAnswerItem = {
      questionId: "2",
      selectedOptionIds: ["opt3"],
    };

    render(
      <Question
        question={mockMultipleChoiceQuestion}
        value={currentValue}
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByRole("checkbox", { name: /option b/i });
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalled();
    const call = handleChange.mock.calls[0][0];
    expect(call.questionId).toBe("2");
    expect(call.selectedOptionIds).toContain("opt3");
    expect(call.selectedOptionIds).toContain("opt4");
  });

  it("renders text field for free text question", () => {
    const handleChange = vi.fn();
    render(
      <Question
        question={mockFreeTextQuestion}
        value={undefined}
        onChange={handleChange}
      />
    );

    const textField = screen.getByPlaceholderText(
      "Enter your response here..."
    );
    expect(textField).toBeInTheDocument();
  });

  it("handles free text input", () => {
    const handleChange = vi.fn();
    render(
      <Question
        question={mockFreeTextQuestion}
        value={undefined}
        onChange={handleChange}
      />
    );

    const textField = screen.getByPlaceholderText(
      "Enter your response here..."
    );
    fireEvent.change(textField, { target: { value: "My answer" } });

    expect(handleChange).toHaveBeenCalledWith({
      questionId: "3",
      freeText: "My answer",
    });
  });

  it("displays current value for single choice", () => {
    const handleChange = vi.fn();
    const currentValue: SubmitAnswerItem = {
      questionId: "1",
      selectedOptionIds: ["opt2"],
    };

    render(
      <Question
        question={mockSingleChoiceQuestion}
        value={currentValue}
        onChange={handleChange}
      />
    );

    const radio2 = screen.getByDisplayValue("opt2");
    expect(radio2).toBeChecked();
  });
});
