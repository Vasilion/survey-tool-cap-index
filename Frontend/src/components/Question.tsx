import { memo, useCallback } from "react";
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
import {
  getQuestionTypeLabel,
  getQuestionTypeColor,
} from "@/constants/questionTypes";

type Props = {
  question: QuestionDto;
  value?: SubmitAnswerItem;
  onChange: (val: SubmitAnswerItem) => void;
};

const Question = memo(({ question, value, onChange }: Props) => {
  const handleSingle = useCallback(
    (optionId: string) => {
      onChange({ questionId: question.id, selectedOptionIds: [optionId] });
    },
    [question.id, onChange]
  );

  const handleMulti = useCallback(
    (optionId: string, checked: boolean) => {
      const curr = new Set(value?.selectedOptionIds || []);
      if (checked) curr.add(optionId);
      else curr.delete(optionId);
      onChange({
        questionId: question.id,
        selectedOptionIds: Array.from(curr),
      });
    },
    [question.id, value?.selectedOptionIds, onChange]
  );

  const handleText = useCallback(
    (text: string) => {
      onChange({ questionId: question.id, freeText: text });
    },
    [question.id, onChange]
  );

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
            label={getQuestionTypeLabel(question.type as QuestionType)}
            color={getQuestionTypeColor(question.type as QuestionType)}
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
});

Question.displayName = "Question";

export default Question;
