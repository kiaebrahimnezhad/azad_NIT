import React, { useState } from 'react'
import { useQuiz } from "./ExamContext";


const ShowResult: React.FC = () => {



    const { state, dispatch } = useQuiz();
    const {
        timer,
        currentQuestion,
        status,
        score,
        answers,
        timeLeft,
        selectedOption
    } = state;


    return (
        <div>
            <h1 className='font-bold text-lg py-3'>مشاهده جواب های شما</h1>
            {Object.entries(answers).map(([qid, answer]) => (
                <div key={qid} className='py-2'>
                    شماره سوال {qid}: گزینه انتخابی شما {answer}
                </div>
            ))}

        </div>
    )
}

export default ShowResult