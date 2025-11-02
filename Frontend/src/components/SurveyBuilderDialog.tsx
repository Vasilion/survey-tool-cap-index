import { memo } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { useSurveyForm } from "@/hooks/useSurveyForm";
import { QuestionUpsertDto } from "@/types";
import QuestionFormField from "./survey-form/QuestionFormField";

type Props = {
  surveyId?: string;
  onClose: () => void;
};

const SurveyBuilderDialog = memo(({ surveyId, onClose }: Props) => {
  const {
    isLoading,
    title,
    setTitle,
    description,
    setDescription,
    questions,
    errors,
    apiError,
    isSaving,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addOption,
    updateOption,
    deleteOption,
    handleSave,
    clearErrors,
    clearQuestionError,
  } = useSurveyForm(surveyId, onClose);

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
              <Box
                component="h6"
                sx={{ m: 0, fontSize: "1.25rem", fontWeight: 600 }}
              >
                Questions
              </Box>
              <Button variant="contained" onClick={addQuestion} size="small">
                Add Question
              </Button>
            </Box>

            {questions.map((question: QuestionUpsertDto, index: number) => (
              <QuestionFormField
                key={index}
                question={question}
                index={index}
                allQuestions={questions}
                error={errors.questions?.[index]}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
                onClearError={clearQuestionError}
              />
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
          disabled={isSaving}
        >
          {isSaving ? <CircularProgress size={20} /> : "Save Survey"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

SurveyBuilderDialog.displayName = "SurveyBuilderDialog";

export default SurveyBuilderDialog;
