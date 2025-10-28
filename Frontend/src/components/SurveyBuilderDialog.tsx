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
  FormControlLabel,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  DragIndicator as DragIcon,
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

  useEffect(() => {
    // Only initialize once per surveyId to prevent duplicate loading
    if (isInitialized) return;

    if (existingSurvey) {
      console.log("Loading existing survey data:", existingSurvey);
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
    console.log(
      "SurveyBuilderDialog mounted/remounted for surveyId:",
      surveyId
    );
    setIsInitialized(false);
  }, [surveyId]);

  const addQuestion = () => {
    const newQuestion: QuestionUpsertDto = {
      text: "",
      type: QuestionType.SingleChoice,
      order: questions.length,
      options: [{ text: "", weight: 1 }],
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updated: QuestionUpsertDto) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...updated, order: index };
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({ text: "", weight: 1 });
    setQuestions(newQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    updated: AnswerOptionUpsertDto
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = updated;
    setQuestions(newQuestions);
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    setQuestions(newQuestions);
  };

  const handleSave = async () => {
    // Client-side validation
    if (!title.trim()) {
      alert("Please enter a survey title");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        alert(`Please enter text for Question ${i + 1}`);
        return;
      }

      if (q.type !== QuestionType.FreeText) {
        if (!q.options || q.options.length === 0) {
          alert(`Please add at least one option for Question ${i + 1}`);
          return;
        }

        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text.trim()) {
            alert(`Please enter text for Option ${j + 1} in Question ${i + 1}`);
            return;
          }
        }
      }
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

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

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
      console.error("Failed to save survey:", error);

      // Show more detailed error message
      if (error?.response?.data) {
        const errorData = error.response.data;
        console.log("Error response data:", errorData);

        if (Array.isArray(errorData) && errorData.length > 0) {
          const errorMessages = errorData
            .map(
              (err: any) =>
                `${err.PropertyName || "Field"}: ${
                  err.ErrorMessage || err.message || "Invalid data"
                }`
            )
            .join("\n");
          alert(`Validation errors:\n${errorMessages}`);
        } else {
          alert(`Error: ${errorData.message || "Failed to save survey"}`);
        }
      } else {
        alert("Failed to save survey. Please try again.");
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
    <Dialog open={true} maxWidth="lg" fullWidth>
      <DialogTitle>
        {surveyId ? "Edit Survey" : "Create New Survey"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Survey Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
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
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    mb={2}
                  >
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Question {index + 1}
                    </Typography>
                    <IconButton
                      color="error"
                      onClick={() => deleteQuestion(index)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <TextField
                    fullWidth
                    label="Question Text"
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(index, {
                        ...question,
                        text: e.target.value,
                      })
                    }
                    margin="normal"
                    required
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
                        >
                          <TextField
                            fullWidth
                            label={`Option ${optionIndex + 1}`}
                            value={option.text}
                            onChange={(e) =>
                              updateOption(index, optionIndex, {
                                ...option,
                                text: e.target.value,
                              })
                            }
                            size="small"
                            required
                          />
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
                            sx={{ width: 100 }}
                          />
                          <IconButton
                            color="error"
                            onClick={() => deleteOption(index, optionIndex)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
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
