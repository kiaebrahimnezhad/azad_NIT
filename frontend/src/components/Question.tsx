import React from 'react'
import { useQuiz } from "../pages/exam/ExamContext";

type QuestionType = {
  qid: number;
  examid: number;
  ans: number; // 1: A, 2: B, 3: C, 4: D, 5: E
  quest: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  option5: string;
}

interface QuestionProps {
  examquestion: QuestionType;
  onSelectOption: (questionId: number, optionValue: number) => void;
  selectedOption?: number;
}

const Question: React.FC<QuestionProps> = ({ examquestion, onSelectOption, selectedOption }) => {
  
  const options = [
    { value: 1, text: examquestion.option1 },
    { value: 2, text: examquestion.option2 },
    { value: 3, text: examquestion.option3 },
    { value: 4, text: examquestion.option4 },
    { value: 5, text: examquestion.option5 }
  ].filter(option => option.text && option.text.trim() !== '');

  const handleSelectOption = (optionValue: number) => {
    onSelectOption(examquestion.qid, optionValue);
    
  };

  const deleteAnswer = () => {
    // Dispatch action to remove the answer for this question
    dispatch({ 
      type: 'SELECTED_OPTION', 
      payload: { 
        questionId: examquestion.qid, 
        optionValue: 0 
      } 
    });
  }

  const { state, dispatch } = useQuiz();
  const {status,timeLeft,} = state;

  return (
    <div className="question-container flex flex-col gap-2">
      <h3 className="text-lg font-semibold mb-4">{examquestion.quest}</h3>
      <div className="options flex flex-col gap-3">
        {options.map((option) => (
          <div key={option.value} className="answer-option flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                disabled={timeLeft === 0}
                type="radio"
                name={`question-${examquestion.qid}`}
                value={option.value}
                id={`question-${examquestion.qid}-option-${option.value}`}
                checked={selectedOption === option.value}
                onChange={() => handleSelectOption(option.value)}
                className="w-4 h-4"
              />
              <span className="text-sm">{option.text}</span>
            </label>
            <button onClick={(e) => {
              e.preventDefault();
              deleteAnswer();
            }} className='cursor-pointer underline-offset-1 flex items-center justify-center p-1 rounded-md border border-red-500'>
              <svg className='text-red-500' xmlns="http://www.w3.org/2000/svg" width="10px" height="10px" viewBox="0 0 24 24" fill="none">
                <path d="M20 20L4 4.00003M20 4L4.00002 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Question
