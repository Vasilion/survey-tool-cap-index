import { useSurvey } from "@/api/surveys";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import { QuestionType } from "@/types";

type Props = {
  surveyId: string;
};

export default function SurveyViewDialog({ surveyId }: Props) {
  const { data: survey, isLoading, isError } = useSurvey(surveyId);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !survey) {
    return <Alert severity="error">Failed to load survey details</Alert>;
  }

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SingleChoice:
        return "Single Choice";
      case QuestionType.MultipleChoice:
        return "Multiple Choice";
      case QuestionType.FreeText:
        return "Free Text";
      default:
        return "Unknown";
    }
  };

  const getQuestionTypeColor = (type: QuestionType) => {
    switch (type) {
      case QuestionType.SingleChoice:
        return "primary";
      case QuestionType.MultipleChoice:
        return "secondary";
      case QuestionType.FreeText:
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontSize: { xs: "1.5rem", sm: "2rem" },
              wordBreak: "break-word",
            }}
          >
            {survey.title}
          </Typography>
          {survey.description && (
            <Typography color="text.secondary" paragraph>
              {survey.description}
            </Typography>
          )}
          <Box
            display="flex"
            gap={1}
            flexWrap="wrap"
            justifyContent={{ xs: "center", sm: "flex-start" }}
          >
            <Chip
              label={`${survey.questions.length} Questions`}
              color="info"
              size="small"
            />
            <Chip label="Active" color="success" size="small" />
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Questions
      </Typography>

      {survey.questions.length === 0 ? (
        <Alert severity="info">This survey has no questions yet.</Alert>
      ) : (
        <List>
          {survey.questions
            .sort((a, b) => a.order - b.order)
            .map((question, index) => (
              <Card key={question.id} sx={{ mb: 2 }}>
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
                      variant="h6"
                      sx={{
                        flexGrow: 1,
                        fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        wordBreak: "break-word",
                      }}
                    >
                      {index + 1}. {question.text}
                    </Typography>
                    <Chip
                      label={getQuestionTypeLabel(question.type)}
                      color={getQuestionTypeColor(question.type)}
                      size="small"
                      sx={{ alignSelf: { xs: "flex-start", sm: "auto" } }}
                    />
                  </Box>

                  {question.description && (
                    <Typography color="text.secondary" paragraph>
                      {question.description}
                    </Typography>
                  )}

                  {question.parentQuestionId && (
                    <Chip
                      label="Conditional Question"
                      color="warning"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  )}

                  {question.options && question.options.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Answer Options:
                      </Typography>
                      <List dense>
                        {question.options.map((option, optionIndex) => (
                          <ListItem key={option.id} sx={{ py: 0.5 }}>
                            <ListItemText
                              primary={`${optionIndex + 1}. ${option.text}`}
                              secondary={`Weight: ${option.weight}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
        </List>
      )}
    </Box>
  );
}
