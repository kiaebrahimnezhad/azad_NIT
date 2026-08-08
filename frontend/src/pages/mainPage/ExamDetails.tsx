import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import Header from '../../components/Header';

interface Exam {
    eid: number;
    start_time: string;
    end_time: string;
    duration: number;
    min_score: number;
    courseid: number;
    is_valid: boolean;
}

interface Question {
    qid: number;
    examid: number;
    ans: number;// 1: A, 2: B, 3: C, 4: D
    quest: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    option5: string;
}

const ExamDetails: React.FC = () => {
    const { eid } = useParams<{ eid: string }>();

    const [exam, setExam] = useState<Exam | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    // Fetch exam details and questions
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('ابتدا وارد شوید');
                    return;
                }
                // Fetch exam details
                const examResponse = await fetch('http://localhost:5000/exam/by-eid', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({ eid: Number(eid) })
                });

                if (!examResponse.ok) {
                    throw new Error(`خطای سرور (${examResponse.status})`);
                }

                const examData = await examResponse.json();
                setExam(examData.data);

                // Fetch questions
                const questionResponse = await fetch('http://localhost:5000/exam/question-by-eid', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({ eid: Number(eid) })
                });

                if (!questionResponse.ok) {
                    throw new Error(`خطای سرور (${questionResponse.status})`);
                }

                const questionData = await questionResponse.json();
                setQuestions(questionData.questions || []);
                console.log(questionData);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'خطایی رخ داد');
            } finally {
                setLoading(false);
            }
        };

        if (eid) {
            fetchData();
        }
    }, [eid]);

    // Handle answer selection
    /*  const handleAnswerSelect = (questionId: number, answer: number) => {
         setUserAnswers(prev => ({
             ...prev,
             [questionId]: answer
         }));
     }; */

    // Submit exam answers
    /* const submitExam = async () => {
        if (!exam) return;

        try {
            setSubmitting(true);
            setSubmitError(null);
            setSubmitSuccess(null);

            // Prepare answers array
            const answers = Object.entries(userAnswers).map(([qid, ans]) => ({
                qid: parseInt(qid),
                ans
            }));

            const response = await fetch('http://localhost:5000/exam/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ eid: exam.eid, answers })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSubmitSuccess(result.message || 'آزمون با موفقیت ثبت شد');
                // Optionally redirect or show results
                // navigate('/exam-results', { state: { score: result.score, passed: result.passed } });
            } else {
                throw new Error(result.message || 'خطا در ثبت آزمون');
            }
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : 'خطایی در ثبت آزمون رخ داد');
        } finally {
            setSubmitting(false);
        }
    }; */

    // Format time for display
    const formatTime = (timeString: string) => {
        return new Date(timeString).toLocaleDateString('fa-IR');
    };

    // Format duration (in minutes) to hours:minutes
    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours} ساعت و ` : ''}${mins} دقیقه`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col w-full">
                <main className="flex-grow pt-20 pb-10">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-center min-h-screen">
                            <p className="text-blue-600 animate-pulse">در حال بارگذاری…</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col w-full">
                <main className="flex-grow pt-20 pb-10">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
                                {error}
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col w-full">
                <main className="flex-grow pt-20 pb-10">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-center min-h-screen">
                            <p className="text-gray-600">آزمونی یافت نشد.</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col w-full">
            <Header />
            <main className="flex-grow pt-20 pb-10">
                <div className="container mx-auto px-4 space-y-10">
                    {/* Exam Details Card */}
                    <section className="bg-white shadow-xl rounded-xl overflow-hidden">
                        <div className="p-8 space-y-6">
                            <h1 className="text-3xl font-extrabold text-gray-800 text-center">جزئیات آزمون</h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-gray-700 border-b pb-2">اطلاعات آزمون</h2>
                                    <div className="space-y-3">
                                        <p className="flex justify-between">
                                            <span className="font-medium text-gray-600">شناسه آزمون:</span>
                                            <span className="text-gray-800">{exam.eid}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="font-medium text-gray-600">تاریخ شروع:</span>
                                            <span className="text-gray-800">{formatTime(exam.start_time)}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="font-medium text-gray-600">تاریخ پایان:</span>
                                            <span className="text-gray-800">{formatTime(exam.end_time)}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="font-medium text-gray-600">مدت آزمون:</span>
                                            <span className="text-gray-800">{formatDuration(exam.duration)}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="font-medium text-gray-600">حداقل نمره قبولی:</span>
                                            <span className="text-gray-800">{exam.min_score}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="font-medium text-gray-600">وضعیت:</span>
                                            <span className={`px-2 py-1 rounded ${exam.is_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {exam.is_valid ? 'فعال' : 'غیرفعال'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-4'>
                                    <h2 className="text-xl font-bold text-gray-700 border-b pb-2">اطلاعات آزمون</h2>
                                    <table>
                                        <thead className='bg-blue-900 text-white '>
                                            <tr className='divide-x-[1px] divide-gray-300'>
                                                <th className='py-1.5' scope="col">ردیف</th>
                                                <th className='py-1.5' scope="col">سوال</th>
                                                <th className='py-1.5' scope="col">گزینه ها</th>
                                                <th className='py-1.5' scope="col">جواب</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {questions.map((q) => (
                                                <tr key={q.qid} className='divide-x-[1px] divide-gray-300 border border-gray-300'>
                                                    <td className='text-center py-1.5 px-1'>
                                                        {q.qid}
                                                    </td>
                                                    <td className='text-center py-1.5 px-1'>
                                                        {q.quest}
                                                    </td>
                                                    <td className='text-center py-1.5 px-1'>
                                                        <div className='flex  justify-between items-center w-full'>
                                                            <span>(A. {q.option1})</span>
                                                            <span>(B. {q.option2})</span>
                                                            <span>(C. {q.option3})</span>
                                                            <span>(D. {q.option4})</span>
                                                        </div>
                                                    </td>
                                                    <td className='text-center py-1.5 px-1'>
                                                        {{
                                                            1: 'A',
                                                            2: 'B',
                                                            3: 'C',
                                                            4: 'D'
                                                        }[q.ans] || ''}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ExamDetails;
