import { memo, useCallback } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { QuestionUpsertDto } from "@/types";

type Props = {
  question: QuestionUpsertDto;
  index: number;
  allQuestions: QuestionUpsertDto[];
  onParentQuestionChange: (parentQuestionId: string | null) => void;
  onTriggerOptionsChange: (
    visibleWhenSelectedOptionIds: string[] | null
  ) => void;
};

const ConditionalLogicField = memo(
  ({
    question,
    index,
    allQuestions,
    onParentQuestionChange,
    onTriggerOptionsChange,
  }: Props) => {
    const parentIndex = question.parentQuestionId
      ? parseInt(question.parentQuestionId.replace("parent-", ""))
      : null;
    const parentQuestion =
      parentIndex !== null ? allQuestions[parentIndex] : null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Conditional Logic (Optional)
        </Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel>Show this question when...</InputLabel>
          <Select
            value={question.parentQuestionId || ""}
            onChange={(e) => onParentQuestionChange(e.target.value || null)}
            label="Show this question when..."
          >
            <MenuItem value="">
              <em>Always show this question</em>
            </MenuItem>
            {allQuestions.slice(0, index).map((parentQ, parentIdx) => (
              <MenuItem key={parentIdx} value={`parent-${parentIdx}`}>
                Question {parentIdx + 1}: {parentQ.text.substring(0, 50)}
                {parentQ.text.length > 50 ? "..." : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {question.parentQuestionId && parentQuestion && (
          <FormControl fullWidth margin="normal">
            <InputLabel>
              Selected option(s) that trigger this question
            </InputLabel>
            <Select
              multiple
              value={question.visibleWhenSelectedOptionIds || []}
              onChange={(e) => {
                const selected = e.target.value as string[];
                onTriggerOptionsChange(selected.length > 0 ? selected : null);
              }}
              label="Selected option(s) that trigger this question"
            >
              {parentQuestion.options?.map((option, optionIndex) => (
                <MenuItem key={optionIndex} value={`option-${optionIndex}`}>
                  {option.text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    );
  }
);

ConditionalLogicField.displayName = "ConditionalLogicField";

export default ConditionalLogicField;
