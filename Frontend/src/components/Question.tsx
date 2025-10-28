import { QuestionDto, QuestionType, SubmitAnswerItem } from "@/types";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Checkbox,
  TextField,
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

  return (
    <Box mb={2}>
      <FormControl fullWidth>
        <FormLabel>{question.text}</FormLabel>
        {question.type === QuestionType.SingleChoice && (
          <RadioGroup
            value={value?.selectedOptionIds?.[0] || ""}
            onChange={(e) => handleSingle((e.target as HTMLInputElement).value)}
          >
            {question.options.map((o) => (
              <FormControlLabel
                key={o.id}
                value={o.id}
                control={<Radio />}
                label={o.text}
              />
            ))}
          </RadioGroup>
        )}
        {question.type === QuestionType.MultipleChoice && (
          <Box>
            {question.options.map((o) => {
              const checked = (value?.selectedOptionIds || []).includes(o.id);
              return (
                <FormControlLabel
                  key={o.id}
                  control={
                    <Checkbox
                      checked={checked}
                      onChange={(e) => handleMulti(o.id, e.target.checked)}
                    />
                  }
                  label={o.text}
                />
              );
            })}
          </Box>
        )}
        {question.type === QuestionType.FreeText && (
          <TextField
            fullWidth
            value={value?.freeText || ""}
            onChange={(e) => handleText(e.target.value)}
          />
        )}
      </FormControl>
    </Box>
  );
}
