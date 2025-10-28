import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Question from '../Question'
import { QuestionType } from '../../types'

const mockQuestion = {
  id: '1',
  text: 'Test Question',
  type: QuestionType.SingleChoice,
  order: 1,
  parentQuestionId: null,
  visibleWhenSelectedOptionIds: null,
  options: [
    { id: '1', text: 'Option 1', weight: 1 },
    { id: '2', text: 'Option 2', weight: 2 }
  ]
}

describe('Question Component', () => {
  it('renders question text', () => {
    render(
      <Question
        question={mockQuestion}
        currentAnswer={null}
        onAnswerChange={() => {}}
      />
    )
    
    expect(screen.getByText('Test Question')).toBeInTheDocument()
  })

  it('renders options for single choice question', () => {
    render(
      <Question
        question={mockQuestion}
        currentAnswer={null}
        onAnswerChange={() => {}}
      />
    )
    
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })
})
