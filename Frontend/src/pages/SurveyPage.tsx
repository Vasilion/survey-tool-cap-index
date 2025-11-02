import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const prevVisibleIdsRef = useRef<string>("");
  const prevSurveyIdRef = useRef<string>("");

  const visibleIds: Set<string> = useMemo(() => {
    if (!survey) return new Set<string>();
    return computeVisibleQuestionIds(survey.questions, answers);
  }, [survey, answers]);

  const visibleIdsString = useMemo(() => {
    return Array.from(visibleIds).sort().join(",");
  }, [visibleIds]);

  const visibleQuestions = useMemo((): QuestionDto[] => {
    if (!survey) return [] as QuestionDto[];
    const sorted: QuestionDto[] = [...survey.questions].sort(
      (a, b) => a.order - b.order
    );
    return sorted.filter((q) => visibleIds.has(q.id));
  }, [survey, visibleIds]);

  const answeredVisibleCount = useMemo(() => {
    return Object.keys(answers).filter((id) => visibleIds.has(id)).length;
  }, [answers, visibleIds]);

  const progress = useMemo(() => {
    const totalVisible = visibleQuestions.length;
    return totalVisible > 0 ? (answeredVisibleCount / totalVisible) * 100 : 0;
  }, [visibleQuestions, answeredVisibleCount]);

  useEffect(() => {
    if (!survey) return;

    if (prevSurveyIdRef.current !== survey.id) {
      prevSurveyIdRef.current = survey.id;
      prevVisibleIdsRef.current = "";
    }

    if (visibleIdsString === prevVisibleIdsRef.current) return;

    prevVisibleIdsRef.current = visibleIdsString;

    setAnswers((prev) => {
      const updated: Record<string, SubmitAnswerItem> = { ...prev };
      let hasChanges = false;
      for (const q of survey.questions) {
        if (!visibleIds.has(q.id) && updated[q.id]) {
          delete updated[q.id];
          hasChanges = true;
        }
      }
      return hasChanges ? updated : prev;
    });
  }, [survey, visibleIds, visibleIdsString]);

  const handleChange = useCallback(
    (q: QuestionDto, value: SubmitAnswerItem): void => {
      setAnswers((prev) => ({ ...prev, [q.id]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (!selectedSurveyId) return;
    const payload: SubmitResponseRequest = { answers: Object.values(answers) };
    await submit.mutateAsync(payload);
  }, [selectedSurveyId, answers, submit]);

  const handleSurveyChange = useCallback((surveyId: string): void => {
    setSelectedSurveyId(surveyId);
    setAnswers({});
  }, []);

  const handleReset = useCallback((): void => {
    setAnswers({});
    submit.reset();
  }, [submit]);

  if (listLoading || isLoading) return <CircularProgress />;
  if (listError || isError)
    return <Alert severity="error">Failed to load survey</Alert>;

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        className="gradient-text"
        sx={{
          textAlign: { xs: "center", sm: "left" },
          fontSize: { xs: "1.75rem", sm: "2.125rem" },
        }}
      >
        Take a Survey
      </Typography>

      {surveys?.length ? (
        <Card className="survey-card">
          <CardContent className="survey-card-content">
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
      ) : null}

      {!survey ? (
        <Card>
          <CardContent className="empty-state">
            <Typography
              variant="h6"
              color="text.secondary"
              gutterBottom
              className="survey-title"
            >
              {surveys?.length === 0
                ? "No surveys available"
                : "Select a survey to begin"}
            </Typography>
            {surveys?.length === 0 && (
              <Typography color="text.secondary" className="survey-description">
                Create a survey in the "Manage Surveys" tab to get started
              </Typography>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="survey-card">
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
                className="progress-container"
              />
            </CardContent>
          </Card>

          <Paper elevation={2} className="questions-container">
            {visibleQuestions.map((q: QuestionDto) => (
              <Question
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={(v) => handleChange(q, v)}
              />
            ))}

            <Divider className="divider" />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="body2" color="text.secondary">
                {answeredVisibleCount} question(s) answered
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={submit.isPending || answeredVisibleCount === 0}
                className="select-container"
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
                  onClick={handleReset}
                  className="submit-button"
                >
                  Take Again
                </Button>
              </CardContent>
            </Card>
          )}

          {submit.isError && (
            <Alert severity="error" className="error-alert">
              Submission failed. Please try again.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
