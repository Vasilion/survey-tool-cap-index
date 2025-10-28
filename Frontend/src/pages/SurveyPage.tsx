import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";
import { useSurvey, useSurveyList, useSubmitResponse } from "@/api/surveys";
import { QuestionDto, SubmitAnswerItem, SubmitResponseRequest } from "@/types";
import Question from "@/components/Question";
import { computeVisibleQuestionIds } from "@/utils/visibility";

export default function SurveyPage() {
  const {
    data: surveys,
    isLoading: listLoading,
    isError: listError,
  } = useSurveyList();

  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("");
  const { data: survey, isLoading, isError } = useSurvey(selectedSurveyId);
  const submit = useSubmitResponse(selectedSurveyId);

  const [answers, setAnswers] = useState<Record<string, SubmitAnswerItem>>({});
  const visibleIds = useMemo(
    () =>
      survey
        ? computeVisibleQuestionIds(survey.questions, answers)
        : new Set<string>(),
    [survey, answers]
  );

  const progress = useMemo(() => {
    if (!survey) return 0;
    const totalVisible = survey.questions.filter((q) =>
      visibleIds.has(q.id)
    ).length;
    const answered = Object.keys(answers).filter((id) =>
      visibleIds.has(id)
    ).length;
    return totalVisible > 0 ? (answered / totalVisible) * 100 : 0;
  }, [survey, answers, visibleIds]);

  useEffect(() => {
    if (!survey) return;
    const updated = { ...answers };
    for (const q of survey.questions) {
      if (!visibleIds.has(q.id) && updated[q.id]) delete updated[q.id];
    }
    setAnswers(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds.size]);

  const handleChange = (q: QuestionDto, value: SubmitAnswerItem) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedSurveyId) return;
    const payload: SubmitResponseRequest = { answers: Object.values(answers) };
    await submit.mutateAsync(payload);
  };

  const handleSurveyChange = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    setAnswers({});
  };

  if (listLoading || isLoading) return <CircularProgress />;
  if (listError || isError)
    return <Alert severity="error">Failed to load survey</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Take a Survey
      </Typography>

      {surveys && surveys.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Select Survey</InputLabel>
              <Select
                value={selectedSurveyId}
                onChange={(e) => handleSurveyChange(e.target.value)}
                label="Select Survey"
              >
                {surveys.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {!survey ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {surveys && surveys.length === 0
                ? "No surveys available"
                : "Select a survey to begin"}
            </Typography>
            {surveys && surveys.length === 0 && (
              <Typography color="text.secondary">
                Create a survey in the "Build Survey" tab to get started
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h5" gutterBottom>
                  {survey.title}
                </Typography>
                <Chip
                  label={`${Math.round(progress)}% Complete`}
                  color="primary"
                  variant="outlined"
                />
              </Box>
              {survey.description && (
                <Typography color="text.secondary" gutterBottom>
                  {survey.description}
                </Typography>
              )}
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ mt: 2, height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>

          <Paper elevation={2} sx={{ p: 3 }}>
            {survey.questions
              .sort((a, b) => a.order - b.order)
              .filter((q) => visibleIds.has(q.id))
              .map((q) => (
                <Question
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={(v) => handleChange(q, v)}
                />
              ))}

            <Divider sx={{ my: 3 }} />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" color="text.secondary">
                {Object.keys(answers).length} question(s) answered
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={submit.isPending || Object.keys(answers).length === 0}
                sx={{ minWidth: 120 }}
              >
                {submit.isPending ? (
                  <CircularProgress size={24} />
                ) : (
                  "Submit Survey"
                )}
              </Button>
            </Box>
          </Paper>

          {submit.isSuccess && (
            <Card
              sx={{
                mt: 3,
                bgcolor: "success.light",
                color: "success.contrastText",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎉 Survey Completed!
                </Typography>
                <Typography variant="h4" gutterBottom>
                  Your Score: {submit.data.totalScore}
                </Typography>
                <Typography variant="body1">
                  Thank you for taking the survey. Your responses have been
                  recorded.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setAnswers({});
                    submit.reset();
                  }}
                  sx={{ mt: 2, color: "inherit", borderColor: "inherit" }}
                >
                  Take Again
                </Button>
              </CardContent>
            </Card>
          )}

          {submit.isError && (
            <Alert severity="error" sx={{ mt: 3 }}>
              Submission failed. Please try again.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
