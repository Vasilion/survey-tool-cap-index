import { memo, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { QuestionUpsertDto, QuestionType } from "@/types";
import { QUESTION_TYPE_DESCRIPTIONS } from "@/constants/questionTypes";
import ConditionalLogicField from "./ConditionalLogicField";
import OptionsField from "./OptionsField";

type Props = {
  question: QuestionUpsertDto;
  index: number;
  allQuestions: QuestionUpsertDto[];
  error?: { text?: string; options?: { [key: number]: string } };
  onUpdate: (index: number, updated: QuestionUpsertDto) => void;
  onDelete: (index: number) => void;
  onClearError: (
    index: number,
    field?: "text" | "options",
    optionIndex?: number
  ) => void;
};

const QuestionFormField = memo(
  ({
    question,
    index,
    allQuestions,
    error,
    onUpdate,
    onDelete,
    onClearError,
  }: Props) => {
    const handleTextChange = useCallback(
      (text: string) => {
        onUpdate(index, { ...question, text });
        if (error?.text) {
          onClearError(index, "text");
        }
      },
      [question, index, error, onUpdate, onClearError]
    );

    const handleTypeChange = useCallback(
      (type: QuestionType) => {
        onUpdate(index, {
          ...question,
          type,
          options: type === QuestionType.FreeText ? [] : question.options,
        });
      },
      [question, index, onUpdate]
    );

    const handleParentQuestionChange = useCallback(
      (parentQuestionId: string | null) => {
        onUpdate(index, {
          ...question,
          parentQuestionId,
          visibleWhenSelectedOptionIds: parentQuestionId
            ? question.visibleWhenSelectedOptionIds
            : null,
        });
      },
      [question, index, onUpdate]
    );

    const handleTriggerOptionsChange = useCallback(
      (visibleWhenSelectedOptionIds: string[] | null) => {
        onUpdate(index, {
          ...question,
          visibleWhenSelectedOptionIds,
        });
      },
      [question, index, onUpdate]
    );

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
            flexDirection={{ xs: "column", sm: "row" }}
            gap={1}
          >
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                Question {index + 1}
              </Typography>
              {question.parentQuestionId && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.main",
                    fontWeight: 600,
                    px: 1,
                    py: 0.5,
                    bgcolor: "primary.50",
                    borderRadius: 1,
                  }}
                >
                  Conditional
                </Typography>
              )}
            </Box>
            <IconButton
              color="error"
              onClick={() => onDelete(index)}
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
            onChange={(e) => handleTextChange(e.target.value)}
            margin="normal"
            required
            error={!!error?.text}
            helperText={error?.text}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Question Type</InputLabel>
            <Select
              value={question.type}
              onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            >
              {Object.entries(QUESTION_TYPE_DESCRIPTIONS).map(
                ([value, label]) => (
                  <MenuItem key={value} value={parseInt(value)}>
                    {label}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>

          {index > 0 && (
            <ConditionalLogicField
              question={question}
              index={index}
              allQuestions={allQuestions}
              onParentQuestionChange={handleParentQuestionChange}
              onTriggerOptionsChange={handleTriggerOptionsChange}
            />
          )}

          {question.type !== QuestionType.FreeText && (
            <OptionsField
              question={question}
              questionIndex={index}
              error={error?.options}
              onAddOption={() => {
                const newOptions = [
                  ...question.options,
                  { text: "", weight: 1 },
                ];
                onUpdate(index, { ...question, options: newOptions });
              }}
              onUpdateOption={(optionIndex, updated) => {
                const newOptions = [...question.options];
                newOptions[optionIndex] = updated;
                onUpdate(index, { ...question, options: newOptions });
              }}
              onDeleteOption={(optionIndex) => {
                const newOptions = question.options.filter(
                  (_, i) => i !== optionIndex
                );
                onUpdate(index, { ...question, options: newOptions });
              }}
              onClearError={onClearError}
            />
          )}
        </CardContent>
      </Card>
    );
  }
);

QuestionFormField.displayName = "QuestionFormField";

export default QuestionFormField;
