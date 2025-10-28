import { QuestionDto, QuestionType, SubmitAnswerItem } from "@/types";
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  TextField,
  Card,
  CardContent,
  Typography,
  Chip,
} from "@mui/material";

type Props = {
  question: QuestionDto;
  value?: SubmitAnswerItem;
  onChange: (val: SubmitAnswerItem) => void;
};

export default function Question({ question, value, onChange }: Props) {
  const handleSingle = (optionId: string) => {
    onChange({ questionId: question.id, selectedOptionIds: [optionId] });
  };

  const handleMulti = (optionId: string, checked: boolean) => {
    const curr = new Set(value?.selectedOptionIds || []);
    if (checked) curr.add(optionId);
    else curr.delete(optionId);
    onChange({ questionId: question.id, selectedOptionIds: Array.from(curr) });
  };

  const handleText = (text: string) => {
    onChange({ questionId: question.id, freeText: text });
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

  return (
    <Card className="custom-card question-card">
      <CardContent sx={{ p: 3 }}>
        <Box className="question-header">
          <Typography
            variant="h6"
            component="legend"
            className="question-title"
          >
            {question.text}
          </Typography>
          <Chip
            label={getQuestionTypeLabel(question.type)}
            color={getQuestionTypeColor(question.type)}
            size="small"
            className="question-type-chip"
          />
        </Box>

        <FormControl component="fieldset" fullWidth>
          {question.type === QuestionType.SingleChoice && (
            <RadioGroup
              value={value?.selectedOptionIds?.[0] || ""}
              onChange={(e) =>
                handleSingle((e.target as HTMLInputElement).value)
              }
              className="radio-group"
            >
              {question.options.map((o) => (
                <FormControlLabel
                  key={o.id}
                  value={o.id}
                  control={<Radio className="radio-primary" />}
                  label={
                    <Box className="option-content">
                      <Typography variant="body1" className="option-text">
                        {o.text}
                      </Typography>
                      <Chip
                        label={`Weight: ${o.weight}`}
                        size="small"
                        variant="outlined"
                        className="option-weight"
                      />
                    </Box>
                  }
                  className="option-label"
                />
              ))}
            </RadioGroup>
          )}

          {question.type === QuestionType.MultipleChoice && (
            <Box className="option-container">
              {question.options.map((o) => {
                const checked = (value?.selectedOptionIds || []).includes(o.id);
                return (
                  <FormControlLabel
                    key={o.id}
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(e) => handleMulti(o.id, e.target.checked)}
                        className="checkbox-secondary"
                      />
                    }
                    label={
                      <Box className="option-content">
                        <Typography variant="body1" className="option-text">
                          {o.text}
                        </Typography>
                        <Chip
                          label={`Weight: ${o.weight}`}
                          size="small"
                          variant="outlined"
                          className="option-weight"
                        />
                      </Box>
                    }
                    className="option-label"
                  />
                );
              })}
            </Box>
          )}

          {question.type === QuestionType.FreeText && (
            <TextField
              multiline
              rows={4}
              fullWidth
              value={value?.freeText || ""}
              onChange={(e) => handleText(e.target.value)}
              placeholder="Enter your response here..."
              className="custom-input text-field-custom"
            />
          )}
        </FormControl>
      </CardContent>
    </Card>
  );
}
