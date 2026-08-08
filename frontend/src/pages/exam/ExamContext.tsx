import { useReducer, useEffect, createContext, useContext, } from 'react';


type QuizState = {
    currentQuestion: number,
    answers: Record<number, number>;
    status: 'idle' | 'started' | 'finished' |'timerFinished';
    score: number;
    timeLeft: number; // زمان باقی‌مانده (ثانیه)
    timer: number;
    selectedOption: number;// گزینه انتخابی کاربر
}

const quizReducer = (state: QuizState, action: any): QuizState => {
    switch (action.type) {
        case 'START_QUIZ':
            return { ...state, status: 'started', timeLeft: 60, currentQuestion: 0, timer: state.timer - 1 }
        case 'SUBMIT_ANSWERS':
            return {
                ...state, answers: { ...state.answers, [state.currentQuestion]: action.payload.answer }
            }
        case 'SELECTED_OPTION':
            return { ...state, selectedOption: action.payload.optionValue, answers: { ...state.answers, [action.payload.questionId]: action.payload.optionValue } }
        case 'NEXT_QUESTION':
            return { ...state, currentQuestion: state.currentQuestion + 1 }
        case 'FINISH_QUIZ':
            return { ...state, status: 'finished' }
        case 'TIME_END':
            return { ...state, status: 'timerFinished' }
        case 'UPDATE_TIMER':
            return { ...state, timeLeft: state.timeLeft - 1 }
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
        timeLeft: 60,
        timer: 60,
        selectedOption: 0
    });


    // تایمر
    useEffect(() => {
        let timer: any;
        if (state.status === 'started' && state.timeLeft > 0) {
            timer = setInterval(() => {
                dispatch({ type: 'UPDATE_TIMER' });
            }, 1000);
        } else if (state.timeLeft === 0 && state.status === 'started') {
            dispatch({ type: 'TIME_END' }); //پایان تایمر
        }
        return () => clearInterval(timer);
    }, [state.status, state.timeLeft]);

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
