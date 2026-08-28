import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '../../components/common/Footer';
import Header from '../../components/common/Header';
import { type Exam } from './components/ExamCard';
import { coreApi, isAxiosErrorWithMessage } from '../../lib/api';
import LoadingInformaition from '../../components/ui/LoadingInformaition';

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch exam details and questions
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch exam details
                const examResponse = await coreApi.post('/exam/by-eid', { eid: Number(eid) });
                setExam(examResponse.data.data);

                // Fetch questions
                const questionResponse = await coreApi.post('/exam/question-by-eid', { eid: Number(eid) });
                setQuestions(questionResponse.data.questions || []);
            } catch (err) {
                const message =
                    isAxiosErrorWithMessage(err) && err.response?.data?.message
                        ? err.response.data.message
                        : 'خطایی رخ داد';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        if (eid) {
            fetchData();
        }
    }, [eid]);

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
                    <LoadingInformaition />
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
                                                    <td className='text-right py-1.5 px-2'>
                                                        <div className='flex flex-col gap-1 items-start'>
                                                            <span>A. {q.option1}</span>
                                                            <span>B. {q.option2}</span>
                                                            <span>C. {q.option3}</span>
                                                            <span>D. {q.option4}</span>
                                                            {q.option5 && <span>E. {q.option5}</span>}
                                                        </div>
                                                    </td>
                                                    <td className='text-center py-1.5 px-1'>
                                                        {{
                                                            1: 'A',
                                                            2: 'B',
                                                            3: 'C',
                                                            4: 'D',
                                                            5: 'E'
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
