import { memo, useCallback } from "react";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { AnswerOptionUpsertDto } from "@/types";

type Props = {
  question: { options: AnswerOptionUpsertDto[] };
  questionIndex: number;
  error?: { [key: number]: string };
  onAddOption: () => void;
  onUpdateOption: (index: number, updated: AnswerOptionUpsertDto) => void;
  onDeleteOption: (index: number) => void;
  onClearError: (
    questionIndex: number,
    field: "options",
    optionIndex: number
  ) => void;
};

const OptionsField = memo(
  ({
    question,
    questionIndex,
    error,
    onAddOption,
    onUpdateOption,
    onDeleteOption,
    onClearError,
  }: Props) => {
    const handleOptionTextChange = useCallback(
      (optionIndex: number, text: string) => {
        onUpdateOption(optionIndex, {
          ...question.options[optionIndex],
          text,
        });
        if (error?.[optionIndex]) {
          onClearError(questionIndex, "options", optionIndex);
        }
      },
      [question.options, questionIndex, error, onUpdateOption, onClearError]
    );

    const handleOptionWeightChange = useCallback(
      (optionIndex: number, weight: number) => {
        onUpdateOption(optionIndex, {
          ...question.options[optionIndex],
          weight,
        });
      },
      [question.options, onUpdateOption]
    );

    return (
      <Box sx={{ mt: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="subtitle2">Answer Options</Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onAddOption}
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
              onChange={(e) =>
                handleOptionTextChange(optionIndex, e.target.value)
              }
              size="small"
              required
              error={!!error?.[optionIndex]}
              helperText={error?.[optionIndex]}
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
                  handleOptionWeightChange(
                    optionIndex,
                    parseInt(e.target.value) || 1
                  )
                }
                size="small"
                sx={{
                  width: { xs: "100px", sm: 100 },
                  flexShrink: 0,
                }}
              />
              <IconButton
                color="error"
                onClick={() => onDeleteOption(optionIndex)}
                size="small"
                sx={{ flexShrink: 0 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }
);

OptionsField.displayName = "OptionsField";

export default OptionsField;
