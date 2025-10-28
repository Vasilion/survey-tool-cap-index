import { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useSurvey, useCreateSurvey, useUpdateSurvey } from "@/api/surveys";
import {
  CreateSurveyRequest,
  UpdateSurveyRequest,
  QuestionUpsertDto,
  AnswerOptionUpsertDto,
  QuestionType,
} from "@/types";

type Props = {
  surveyId?: string;
  onClose: () => void;
};

export default function SurveyBuilderDialog({ surveyId, onClose }: Props) {
  const { data: existingSurvey, isLoading } = useSurvey(surveyId);
  const createSurvey = useCreateSurvey();
  const updateSurvey = useUpdateSurvey();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuestionUpsertDto[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    questions?: { [key: number]: { text?: string; options?: { [key: number]: string } } };
  }>({});
  const [apiError, setApiError] = useState<string>("");

  useEffect(() => {
    // Only initialize once per surveyId to prevent duplicate loading
    if (isInitialized) return;

    if (existingSurvey) {
      setTitle(existingSurvey.title);
      setDescription(existingSurvey.description || "");
      setQuestions(
        existingSurvey.questions.map((q) => ({
          text: q.text,
          type: q.type,
          order: q.order,
          parentQuestionId: q.parentQuestionId,
          visibleWhenSelectedOptionIds: q.visibleWhenSelectedOptionIds,
          options: q.options.map((o) => ({
            text: o.text,
            weight: o.weight,
          })),
        }))
      );
      setIsInitialized(true);
    } else if (surveyId === undefined) {
      // Reset form when no survey is selected (creating new)
      setTitle("");
      setDescription("");
      setQuestions([]);
      setIsInitialized(true);
    }
  }, [existingSurvey, surveyId, isInitialized]);

  // Reset initialization when surveyId changes
  useEffect(() => {
    setIsInitialized(false);
  }, [surveyId]);

  const addQuestion = (): void => {
    const newQuestion: QuestionUpsertDto = {
      text: "",
      type: QuestionType.SingleChoice,
      order: questions.length,
      options: [{ text: "", weight: 1 }],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updated: QuestionUpsertDto): void => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...updated, order: index };
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number): void => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number): void => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({ text: "", weight: 1 });
    setQuestions(newQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    updated: AnswerOptionUpsertDto
  ): void => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = updated;
    setQuestions(newQuestions);
  };

  const deleteOption = (questionIndex: number, optionIndex: number): void => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  const validateForm = (): boolean => {
    const newErrors: {
      title?: string;
      questions?: { [key: number]: { text?: string; options?: { [key: number]: string } } };
    } = {};

    // Validate title
    if (!title.trim()) {
      newErrors.title = "Survey title is required";
    }

    // Validate questions
    const questionErrors: { [key: number]: { text?: string; options?: { [key: number]: string } } } = {};
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionError: { text?: string; options?: { [key: number]: string } } = {};

      // Validate question text
      if (!q.text.trim()) {
        questionError.text = "Question text is required";
      }

      // Validate options for choice questions
      if (q.type !== QuestionType.FreeText) {
        if (!q.options || q.options.length === 0) {
          questionError.text = "At least one option is required for choice questions";
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
  };

  const clearErrors = (): void => {
    setErrors({});
    setApiError("");
  };

  const handleSave = async (): Promise<void> => {
    // Clear previous errors
    clearErrors();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    const payload: CreateSurveyRequest | UpdateSurveyRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      questions: questions.map((q, index) => ({
        text: q.text.trim(),
        type: q.type,
        order: index,
        parentQuestionId: q.parentQuestionId || null,
        visibleWhenSelectedOptionIds: q.visibleWhenSelectedOptionIds || null,
        options: q.options.map((o) => ({
          text: o.text.trim(),
          weight: o.weight,
        })),
      })),
    };

    try {
      if (surveyId) {
        await updateSurvey.mutateAsync({
          id: surveyId,
          payload: payload as UpdateSurveyRequest,
        });
      } else {
        await createSurvey.mutateAsync(payload as CreateSurveyRequest);
      }
      onClose();
    } catch (error: any) {
      // Show more detailed error message
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
  };

  if (isLoading) {
    return (
      <Dialog open={true} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={true}
      maxWidth="lg"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          margin: { xs: 0, sm: 2 },
          height: { xs: "100vh", sm: "auto" },
          maxHeight: { xs: "100vh", sm: "90vh" },
          width: { xs: "100vw", sm: "auto" },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          pb: { xs: 1, sm: 2 },
        }}
      >
        {surveyId ? "Edit Survey" : "Create New Survey"}
      </DialogTitle>
      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Survey Title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) clearErrors();
                }}
                margin="normal"
                required
                error={!!errors.title}
                helperText={errors.title}
              />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={2}
          />

          <Box sx={{ mt: 3, mb: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Questions</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addQuestion}
                size="small"
              >
                Add Question
              </Button>
            </Box>

            {questions.map((question, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                    flexDirection={{ xs: "column", sm: "row" }}
                    gap={1}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        flexGrow: 1,
                        fontSize: { xs: "1rem", sm: "1.25rem" },
                      }}
                    >
                      Question {index + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => deleteQuestion(index)}
                      size="small"
                      sx={{ alignSelf: { xs: "flex-end", sm: "auto" } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                      <TextField
                        fullWidth
                        label="Question Text"
                        value={question.text}
                        onChange={(e) => {
                          updateQuestion(index, {
                            ...question,
                            text: e.target.value,
                          });
                          if (errors.questions?.[index]?.text) {
                            const newErrors = { ...errors };
                            if (newErrors.questions?.[index]) {
                              delete newErrors.questions[index].text;
                              if (Object.keys(newErrors.questions[index]).length === 0) {
                                delete newErrors.questions[index];
                              }
                            }
                            setErrors(newErrors);
                          }
                        }}
                        margin="normal"
                        required
                        error={!!errors.questions?.[index]?.text}
                        helperText={errors.questions?.[index]?.text}
                      />

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Question Type</InputLabel>
                    <Select
                      value={question.type}
                      onChange={(e) =>
                        updateQuestion(index, {
                          ...question,
                          type: e.target.value as QuestionType,
                          options:
                            e.target.value === QuestionType.FreeText
                              ? []
                              : question.options,
                        })
                      }
                    >
                      <MenuItem value={QuestionType.SingleChoice}>
                        Single Choice (only one answer allowed)
                      </MenuItem>
                      <MenuItem value={QuestionType.MultipleChoice}>
                        Multiple Choice (more than one answer can be checked)
                      </MenuItem>
                      <MenuItem value={QuestionType.FreeText}>
                        Free Text (open-ended response)
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {question.type !== QuestionType.FreeText && (
                    <Box sx={{ mt: 2 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Typography variant="subtitle2">
                          Answer Options
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => addOption(index)}
                          size="small"
                        >
                          Add Option
                        </Button>
                      </Box>

                      {question.options.map((option, optionIndex) => (
                        <Box
                          key={optionIndex}
                          display="flex"
                          alignItems="center"
                          gap={1}
                          mb={1}
                          flexDirection={{ xs: "column", sm: "row" }}
                        >
                              <TextField
                                fullWidth
                                label={`Option ${optionIndex + 1}`}
                                value={option.text}
                                onChange={(e) => {
                                  updateOption(index, optionIndex, {
                                    ...option,
                                    text: e.target.value,
                                  });
                                  if (errors.questions?.[index]?.options?.[optionIndex]) {
                                    const newErrors = { ...errors };
                                    if (newErrors.questions?.[index]?.options) {
                                      delete newErrors.questions[index].options![optionIndex];
                                      if (Object.keys(newErrors.questions[index].options!).length === 0) {
                                        delete newErrors.questions[index].options;
                                        if (Object.keys(newErrors.questions[index]).length === 0) {
                                          delete newErrors.questions[index];
                                        }
                                      }
                                    }
                                    setErrors(newErrors);
                                  }
                                }}
                                size="small"
                                required
                                error={!!errors.questions?.[index]?.options?.[optionIndex]}
                                helperText={errors.questions?.[index]?.options?.[optionIndex]}
                                sx={{ mb: { xs: 1, sm: 0 } }}
                              />
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            width={{ xs: "100%", sm: "auto" }}
                          >
                            <TextField
                              label="Weight"
                              type="number"
                              value={option.weight}
                              onChange={(e) =>
                                updateOption(index, optionIndex, {
                                  ...option,
                                  weight: parseInt(e.target.value) || 1,
                                })
                              }
                              size="small"
                              sx={{
                                width: { xs: "100px", sm: 100 },
                                flexShrink: 0,
                              }}
                            />
                            <IconButton
                              color="error"
                              onClick={() => deleteOption(index, optionIndex)}
                              size="small"
                              sx={{ flexShrink: 0 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}

            {questions.length === 0 && (
              <Alert severity="info">
                No questions added yet. Click "Add Question" to get started.
              </Alert>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={createSurvey.isPending || updateSurvey.isPending}
        >
          {createSurvey.isPending || updateSurvey.isPending ? (
            <CircularProgress size={20} />
          ) : (
            "Save Survey"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
