import { useReducer, createContext, useContext, } from 'react';


type QuizState = {
    currentQuestion: number,
    answers: Record<number, number>;
    status: 'idle' | 'started' | 'finished';
    score: number;
    selectedOption: number;// گزینه انتخابی کاربر
}

const quizReducer = (state: QuizState, action: any): QuizState => {
    switch (action.type) {
        case 'START_QUIZ':
            return { ...state, status: 'started', currentQuestion: 0 }
        case 'SUBMIT_ANSWERS':
            return {
                ...state, answers: { ...state.answers, [state.currentQuestion]: action.payload.answer }
            }
        case 'SELECTED_OPTION':
            return { ...state, selectedOption: action.payload.optionValue, answers: { ...state.answers, [action.payload.questionId]: action.payload.optionValue } }
        case 'CLEAR_ANSWER': {
            const rest = { ...state.answers };
            delete rest[action.payload.questionId];
            return { ...state, answers: rest }
        }
        case 'NEXT_QUESTION':
            return { ...state, currentQuestion: state.currentQuestion + 1 }
        case 'FINISH_QUIZ':
            return { ...state, status: 'finished' }
        case 'INCREAS_SCORE':
            return { ...state, score: state.score + 1 }
        default:
            return state
    }

}


const QuizContext = createContext<{
    state: QuizState;
    dispatch: (action: any) => void;
} | undefined>(undefined);


const QuizProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(quizReducer, {
        currentQuestion: 0,
        answers: {},
        status: 'idle',
        score: 0,
        selectedOption: 0
    });

    return (
        <QuizContext.Provider value={{ state, dispatch }}>
            {children}
        </QuizContext.Provider>
    );
}


const useQuiz = () => {
    const context = useContext(QuizContext);
    if (!context) throw new Error('useQuiz must be used within QuizProvider');
    return context;
};

export { QuizProvider, useQuiz };
