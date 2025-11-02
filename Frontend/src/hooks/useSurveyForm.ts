import { useState, useEffect, useCallback, useMemo } from "react";
import { useSurvey, useCreateSurvey, useUpdateSurvey } from "@/api/surveys";
import { api } from "@/api/client";
import {
  SurveyDto,
  QuestionUpsertDto,
  AnswerOptionUpsertDto,
  CreateSurveyRequest,
  UpdateSurveyRequest,
  QuestionType,
} from "@/types";

type FormErrors = {
  title?: string;
  questions?: {
    [key: number]: { text?: string; options?: { [key: number]: string } };
  };
};

export function useSurveyForm(surveyId?: string, onSuccess?: () => void) {
  const { data: existingSurvey, isLoading } = useSurvey(surveyId);
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionUpsertDto[]>([]);
  const [initializedSurveyId, setInitializedSurveyId] = useState<
    string | undefined
  >(undefined);
  const [questionIdMap, setQuestionIdMap] = useState<Map<number, string>>(
    new Map()
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string>("");

  useEffect(() => {
    if (initializedSurveyId === surveyId) return;

    if (existingSurvey && surveyId) {
      setTitle(existingSurvey.title);
      setDescription(existingSurvey.description || "");

      const sortedQuestionsForMap = [...existingSurvey.questions].sort(
        (a, b) => a.order - b.order
      );
      const idMap = new Map<number, string>();
      sortedQuestionsForMap.forEach((q, index) => {
        idMap.set(index, q.id);
      });
      setQuestionIdMap(idMap);

      const mappedQuestions = existingSurvey.questions.map((q) => {
        let frontendParentQuestionId: string | null = null;
        let frontendVisibleWhenSelectedOptionIds: string[] | null = null;

        if (q.parentQuestionId) {
          const sortedQuestions = [...existingSurvey.questions].sort(
            (a, b) => a.order - b.order
          );
          const parentIndex = sortedQuestions.findIndex(
            (pq) => pq.id === q.parentQuestionId
          );

          if (parentIndex !== -1) {
            frontendParentQuestionId = `parent-${parentIndex}`;

            if (
              q.visibleWhenSelectedOptionIds &&
              q.visibleWhenSelectedOptionIds.length > 0
            ) {
              const parentQuestion = sortedQuestions[parentIndex];
              frontendVisibleWhenSelectedOptionIds =
                q.visibleWhenSelectedOptionIds
                  .map((optionId) => {
                    const optionIndex = parentQuestion.options.findIndex(
                      (opt) => opt.id === optionId
                    );
                    return optionIndex !== -1 ? `option-${optionIndex}` : null;
                  })
                  .filter((id): id is string => id !== null);
            }
          }
        }

        return {
          text: q.text,
          type: q.type,
          order: q.order,
          parentQuestionId: frontendParentQuestionId,
          visibleWhenSelectedOptionIds: frontendVisibleWhenSelectedOptionIds,
          options: q.options.map((o) => ({ text: o.text, weight: o.weight })),
        };
      });

      setQuestions(mappedQuestions);
      setInitializedSurveyId(surveyId);
    } else if (surveyId === undefined) {
      setTitle("");
      setDescription("");
      setQuestions([]);
      setQuestionIdMap(new Map());
      setInitializedSurveyId(undefined);
    }
  }, [existingSurvey, surveyId, initializedSurveyId]);

  const addQuestion = useCallback((): void => {
    setQuestions((prev) => [
      ...prev,
      {
        text: "",
        type: QuestionType.SingleChoice,
        order: prev.length,
        options: [{ text: "", weight: 1 }],
      },
    ]);
  }, []);

  const updateQuestion = useCallback(
    (index: number, updated: QuestionUpsertDto): void => {
      setQuestions((prev) => {
        const newQuestions = [...prev];
        newQuestions[index] = { ...updated, order: index };
        return newQuestions;
      });
    },
    []
  );

  const deleteQuestion = useCallback((index: number): void => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addOption = useCallback((questionIndex: number): void => {
    setQuestions((prev) => {
      const newQuestions = [...prev];
      newQuestions[questionIndex].options.push({ text: "", weight: 1 });
      return newQuestions;
    });
  }, []);

  const updateOption = useCallback(
    (
      questionIndex: number,
      optionIndex: number,
      updated: AnswerOptionUpsertDto
    ): void => {
      setQuestions((prev) => {
        const newQuestions = [...prev];
        newQuestions[questionIndex].options[optionIndex] = updated;
        return newQuestions;
      });
    },
    []
  );

  const deleteOption = useCallback(
    (questionIndex: number, optionIndex: number): void => {
      setQuestions((prev) => {
        const newQuestions = [...prev];
        newQuestions[questionIndex].options.splice(optionIndex, 1);
        return newQuestions;
      });
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = "Survey title is required";
    }

    const questionErrors: {
      [key: number]: { text?: string; options?: { [key: number]: string } };
    } = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionError: {
        text?: string;
        options?: { [key: number]: string };
      } = {};

      if (!q.text.trim()) {
        questionError.text = "Question text is required";
      }

      if (q.type !== QuestionType.FreeText) {
        if (!q.options || q.options.length === 0) {
          questionError.text =
            "At least one option is required for choice questions";
        } else {
          const optionErrors: { [key: number]: string } = {};
          for (let j = 0; j < q.options.length; j++) {
            if (!q.options[j].text.trim()) {
              optionErrors[j] = "Option text is required";
            }
          }
          if (Object.keys(optionErrors).length > 0) {
            questionError.options = optionErrors;
          }
        }
      }

      if (Object.keys(questionError).length > 0) {
        questionErrors[i] = questionError;
      }
    }

    if (Object.keys(questionErrors).length > 0) {
      newErrors.questions = questionErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, questions]);

  const clearErrors = useCallback((): void => {
    setErrors({});
    setApiError("");
  }, []);

  const handleSave = useCallback(async (): Promise<void> => {
    clearErrors();
    if (!validateForm()) {
      return;
    }

    const payload: CreateSurveyRequest | UpdateSurveyRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      questions: questions.map((q, index) => {
        let parentQuestionId: string | null = null;
        let visibleWhenSelectedOptionIds: string[] | null = null;

        if (q.parentQuestionId) {
          const parentIndex = parseInt(
            q.parentQuestionId.replace("parent-", "")
          );
          const parentQuestion = questions[parentIndex];

          if (parentQuestion && existingSurvey) {
            const parentQuestionExists = existingSurvey.questions.some(
              (pq) => pq.id === questionIdMap.get(parentIndex)
            );
            if (parentQuestionExists) {
              parentQuestionId = questionIdMap.get(parentIndex) || null;
            }

            if (
              q.visibleWhenSelectedOptionIds &&
              q.visibleWhenSelectedOptionIds.length > 0 &&
              parentQuestionId
            ) {
              const parentQuestion = existingSurvey.questions.find(
                (q) => q.id === parentQuestionId
              );
              if (parentQuestion) {
                visibleWhenSelectedOptionIds = q.visibleWhenSelectedOptionIds
                  .map((optionId) => {
                    const optionIndex = parseInt(
                      optionId.replace("option-", "")
                    );
                    const existingOption = parentQuestion.options[optionIndex];
                    return existingOption?.id || "";
                  })
                  .filter((id) => id !== "");
              }
            }
          }
        }

        return {
          text: q.text.trim(),
          type: q.type,
          order: index,
          parentQuestionId,
          visibleWhenSelectedOptionIds,
          options: q.options.map((o) => ({
            text: o.text.trim(),
            weight: o.weight,
          })),
        };
      }),
    };

    try {
      if (surveyId) {
        await updateSurvey.mutateAsync({
          id: surveyId,
          payload: payload as UpdateSurveyRequest,
        });
        onSuccess?.();
      } else {
        const hasConditionalLogic = questions.some((q) => q.parentQuestionId);

        if (hasConditionalLogic) {
          const createPayload: CreateSurveyRequest = {
            ...payload,
            questions: payload.questions.map((q) => ({
              ...q,
              parentQuestionId: null,
              visibleWhenSelectedOptionIds: null,
            })),
          };

          const { id: newSurveyId } = await createSurvey.mutateAsync(
            createPayload
          );

          const { data: createdSurvey } = await api.get<SurveyDto>(
            `/api/surveys/${newSurveyId}`
          );

          const sortedCreatedQuestions = [...createdSurvey.questions].sort(
            (a, b) => a.order - b.order
          );

          const updatePayload: UpdateSurveyRequest = {
            ...payload,
            questions: questions.map((q, questionIndex) => {
              if (q.parentQuestionId) {
                const parentIndex = parseInt(
                  q.parentQuestionId.replace("parent-", "")
                );
                const createdParentQuestion =
                  sortedCreatedQuestions[parentIndex];

                if (createdParentQuestion) {
                  const parentQuestionId = createdParentQuestion.id;
                  let visibleWhenSelectedOptionIds = null;

                  if (
                    q.visibleWhenSelectedOptionIds &&
                    q.visibleWhenSelectedOptionIds.length > 0
                  ) {
                    visibleWhenSelectedOptionIds =
                      q.visibleWhenSelectedOptionIds
                        .map((optionId) => {
                          const optionIndex = parseInt(
                            optionId.replace("option-", "")
                          );
                          return (
                            createdParentQuestion.options[optionIndex]?.id || ""
                          );
                        })
                        .filter((id) => id !== "");
                  }

                  return {
                    ...q,
                    parentQuestionId,
                    visibleWhenSelectedOptionIds,
                  };
                }
              }
              return q;
            }),
          };

          await updateSurvey.mutateAsync({
            id: newSurveyId,
            payload: updatePayload,
          });
        } else {
          await createSurvey.mutateAsync(payload as CreateSurveyRequest);
        }
        onSuccess?.();
      }
    } catch (error: any) {
      if (error?.response?.data) {
        const errorData = error.response.data;

        if (Array.isArray(errorData) && errorData.length > 0) {
          const errorMessages = errorData
            .map(
              (err: any) =>
                `${err.PropertyName || "Field"}: ${
                  err.ErrorMessage || err.message || "Invalid data"
                }`
            )
            .join(", ");
          setApiError(`Validation errors: ${errorMessages}`);
        } else {
          setApiError(`Error: ${errorData.message || "Failed to save survey"}`);
        }
      } else {
        setApiError("Failed to save survey. Please try again.");
      }
    }
  }, [
    title,
    description,
    questions,
    existingSurvey,
    questionIdMap,
    surveyId,
    validateForm,
    clearErrors,
    updateSurvey,
    createSurvey,
    onSuccess,
  ]);

  const clearQuestionError = useCallback(
    (
      questionIndex: number,
      field?: "text" | "options",
      optionIndex?: number
    ): void => {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (!newErrors.questions?.[questionIndex]) return prev;

        if (field === "text") {
          delete newErrors.questions![questionIndex].text;
        } else if (field === "options" && optionIndex !== undefined) {
          if (newErrors.questions![questionIndex].options) {
            delete newErrors.questions![questionIndex].options![optionIndex];
            if (
              Object.keys(newErrors.questions![questionIndex].options!)
                .length === 0
            ) {
              delete newErrors.questions![questionIndex].options;
            }
          }
        }

        if (Object.keys(newErrors.questions![questionIndex]).length === 0) {
          delete newErrors.questions![questionIndex];
        }

        if (
          newErrors.questions &&
          Object.keys(newErrors.questions).length === 0
        ) {
          delete newErrors.questions;
        }

        return newErrors;
      });
    },
    []
  );

  return {
    isLoading,
    title,
    setTitle,
    description,
    setDescription,
    questions,
    errors,
    apiError,
    isSaving: createSurvey.isPending || updateSurvey.isPending,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addOption,
    updateOption,
    deleteOption,
    handleSave,
    clearErrors,
    clearQuestionError,
  };
}
