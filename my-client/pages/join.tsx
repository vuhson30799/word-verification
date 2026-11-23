import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/router';
import useSWRImmutable from 'swr/immutable';
import type {ExaminationData} from './admin/examination';
import type {JoinAssignee} from '../modules/join/assignees';
import {fetcher} from '../modules/configuration/Configuration';
import {studentErrorMessage} from '../modules/join/studentErrorMessage';
import {requestTestLocation, TestLocation} from '../modules/join/location';
import {maximumIncorrectAnswers} from '../modules/utils/examinationPassing';
import {verifyAnswer} from '../modules/utils/verification';
import {convertDate} from '../modules/utils/dateUtils';
import {StudentLayout, Button, Heading, StatusIcon} from '../components/student/StudentLayout';
import NameScreen from '../components/student/NameScreen';
import LocationScreen, {LocationStatus} from '../components/student/LocationScreen';
import QuestionScreen from '../components/student/QuestionScreen';
import ResultScreen from '../components/student/ResultScreen';
import styles from '../styles/Join.module.css';
import {useAttempt} from '../modules/progress/useAttempt';
import {post, studentUser} from '../modules/progress/client';
import {allAttempts} from '../modules/progress/storage';
import type {Attempt, LocalAttempt} from '../modules/progress/types';

export interface StudentAnswer {
    attemptId?: string; ownerUid?: string; revision?: number; status?: 'inProgress' | 'interrupted' | 'completed';
    provisional?: boolean; receivedAt?: number; requestId?: string;
    id?: string; studentId?: string; examId: string; homeworkId: string; studentName: string;
    correctAnswers: number; trial: number; questionNumber?: number; beginningAt?: string; finishAt?: string; location?: TestLocation
}
export interface HomeworkExam {assignees?: JoinAssignee[]; examination: ExaminationData; homeworkId: string}
type Stage = 'name' | 'location' | 'question' | 'result' | 'interrupted';

function shuffle(exam: ExaminationData) {
    const questions = [...exam.questions];
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
}

export default function AttendingExamination() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    useEffect(() => {if (router.isReady) setReady(true)}, [router.isReady]);
    const params = new URLSearchParams();
    for (const key of ['q', 'examId', 'beginningDate', 'deadlineDate']) {
        const value = router.query[key];
        if (typeof value === 'string') params.set(key, value);
    }
    const hasLink = params.has('q') || ['examId', 'beginningDate', 'deadlineDate'].every(key => params.has(key));
    const {data, error, mutate} = useSWRImmutable<HomeworkExam>(ready && hasLink ? [`/api/join?${params}`, 'get'] : null, fetcher);
    const [stage, setStage] = useState<Stage>('name');
    const [name, setName] = useState('');
    const [studentId, setStudentId] = useState<string>();
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
    const [locationError, setLocationError] = useState('');
    const [countdown, setCountdown] = useState(3);
    const [questions, setQuestions] = useState<ExaminationData['questions']>([]);
    const [index, setIndex] = useState(0);
    const [feedback, setFeedback] = useState<boolean | null>(null);
    const progress = useAttempt(data?.examination.id, data?.homeworkId);
    const {local, latest, saving, saveError, storageError, syncError, recoverable, write} = progress;
    const attempt = local?.result;
    const [recoveryError, setRecoveryError] = useState('');
    const locationPending = useRef(false);
    const answered = useRef(false);
    const questionCount = data?.examination.questions.length ?? 0;
    const required = questionCount - maximumIncorrectAnswers(data?.examination ?? {});

    useEffect(() => {
        setStage('name'); setQuestions([]); setIndex(0); setFeedback(null);
        setLocationStatus('idle'); setLocationError(''); setRecoveryError('');
    }, [data?.examination.id, data?.homeworkId]);

    useEffect(() => {
        if (stage !== 'location' || locationStatus !== 'received') return;
        const timer = setInterval(() => setCountdown(value => Math.max(0, value - 1)), 1000);
        return () => clearInterval(timer);
    }, [stage, locationStatus]);
    useEffect(() => {
        if (stage === 'location' && locationStatus === 'received' && countdown === 0) {
            const current = latest.current;
            if (current) void write({...current, questionDeadline: Date.now() + Math.max(1, current.questions[0].timeout || 30) * 1000});
            setStage('question');
        }
    }, [stage, locationStatus, countdown, latest, write]);
    useEffect(() => {
        if (stage !== 'question') return;
        const interrupt = () => {
            if (!document.hidden || !latest.current || latest.current.result.status !== 'inProgress') return;
            const current = latest.current;
            void write({...current, result: {...current.result, status: 'interrupted', revision: current.result.revision + 1}});
            setStage('interrupted');
        };
        document.addEventListener('visibilitychange', interrupt);
        return () => document.removeEventListener('visibilitychange', interrupt);
    }, [stage, latest, write]);

    async function start() {
        if (!data || locationPending.current) return;
        locationPending.current = true;
        setLocationStatus('pending');
        setLocationError('');
        try {
            const location = await requestTestLocation();
            const user = await studentUser();
            let previous: LocalAttempt[] = [];
            try {previous = await allAttempts()} catch { /* The recovery warning is shown by useAttempt. */ }
            const trial = 1 + Math.max(0, ...previous.filter(a => a.result.examId === data.examination.id && a.result.homeworkId === data.homeworkId &&
                (studentId ? a.result.studentId === studentId : a.result.studentName === name.trim())).map(a => a.result.trial));
            const result: Attempt = {attemptId: crypto.randomUUID(), ownerUid: user.uid, revision: 0, status: 'inProgress',
                examId: data.examination.id!, homeworkId: data.homeworkId, studentName: name.trim(), ...(studentId ? {studentId} : {}),
                correctAnswers: 0, trial, beginningAt: convertDate(new Date()), location};
            await post('/api/progress/session', {idToken: await user.getIdToken(), attempt: result, link: Object.fromEntries(params)});
            const shuffled = shuffle(data.examination);
            await progress.claim({result, questions: shuffled, index: 0, feedback: null, pending: false, saved: false, active: true});
            setQuestions(shuffled);
            setIndex(0);
            setFeedback(null);
            answered.current = false;
            setCountdown(3);
            setLocationStatus('received');
        } catch (error) {
            setLocationStatus((error as {code?: number}).code === 1 ? 'blocked' : 'unavailable');
            setLocationError(studentErrorMessage(error, 'Không thể bắt đầu làm bài. Em hãy thử lại.'));
        } finally {locationPending.current = false}
    }

    function answer(value: string) {
        const current = latest.current;
        if (answered.current || !current || stage !== 'question') return;
        answered.current = true;
        const correct = verifyAnswer(value, questions[index].keys);
        setFeedback(correct);
        void write({...current, feedback: correct,
            answers: [...(current.answers ?? []).filter(answer => answer.questionIndex !== index), {questionIndex: index, value, correct, answeredAt: new Date().toISOString()}], result: {...current.result,
            correctAnswers: current.result.correctAnswers + (correct ? 1 : 0), revision: current.result.revision + 1}});
    }

    function next() {
        const current = latest.current;
        if (feedback === null || !current) return;
        if (index + 1 === questions.length) {
            const completed: LocalAttempt = {...current, pending: true, saved: false,
                result: {...current.result, status: 'completed', finishAt: convertDate(new Date()), revision: current.result.revision + 1}};
            void write(completed);
            setStage('result');
        } else {
            void write({...current, index: index + 1, feedback: null,
                questionDeadline: Date.now() + Math.max(1, questions[index + 1].timeout || 30) * 1000,
                result: {...current.result, revision: current.result.revision + 1}});
            setIndex(value => value + 1); setFeedback(null); answered.current = false;
        }
    }

    async function restore() {
        if (!recoverable) return;
        try {
            const user = await studentUser();
            if (user.uid !== recoverable.result.ownerUid) {
                setRecoveryError('Bài làm này thuộc một phiên trình duyệt khác. Em hãy mở lại phiên trình duyệt ban đầu.');
                return;
            }
            await progress.claim(recoverable);
            setName(recoverable.result.studentName);
            setStudentId(recoverable.result.studentId);
            setQuestions(recoverable.questions);
            setIndex(recoverable.index);
            setFeedback(recoverable.feedback);
            answered.current = recoverable.feedback !== null;
            setStage(recoverable.result.status === 'completed' ? 'result' : recoverable.result.status === 'interrupted' ? 'interrupted' : 'question');
            setRecoveryError('');
        } catch (error) {setRecoveryError(studentErrorMessage(error, 'Không thể mở lại bài làm này.'))}
    }

    async function playAgain() {
        await progress.leave();
        setStage('name'); setLocationStatus('idle'); setLocationError(''); setRecoveryError('');
    }

    const problem = error ? studentErrorMessage(error, 'Không thể tải bài tập. Em hãy thử lại.') : (ready && !hasLink ? 'Em hãy mở liên kết bài tập do giáo viên gửi để làm bài.' : data && !questionCount ? 'Bài kiểm tra này chưa có câu hỏi. Em hãy liên hệ với giáo viên.' : '');
    if (problem || !data) return <StudentLayout title="Tham gia làm bài"><section className={styles.content}><StatusIcon kind={problem ? 'error' : 'waiting'}/><Heading title={problem ? 'Không thể mở bài kiểm tra' : 'Đang mở bài kiểm tra…'}>{problem || 'Em vui lòng chờ trong giây lát.'}</Heading>{error && <Button onClick={() => mutate()}>Thử lại</Button>}</section></StudentLayout>;

    return <StudentLayout title={data.examination.title} progress={stage === 'question' ? `${index + 1} / ${questions.length}` : undefined}>
        <p className={styles.examTitle}>{data.examination.title}</p>
        {progress.pendingCount > (local?.pending ? 1 : 0) && <section className={styles.recovery} aria-label="Kết quả đang chờ gửi">
            <p>{progress.pendingCount - (local?.pending ? 1 : 0)} kết quả trước đó đang chờ gửi. Em hãy giữ lại dữ liệu trình duyệt cho đến khi kết quả được lưu.</p>
            {progress.queueError && <p role="status">{progress.queueError}</p>}
            <Button secondary onClick={progress.retry}>Thử gửi lại kết quả đang chờ</Button>
        </section>}
        {stage === 'name' && recoverable && <section className={styles.recovery} aria-label="Bài làm đã lưu">
            <p>Bài làm đã lưu của <strong>{recoverable.result.studentName}</strong> · {recoverable.result.status === 'completed' ? 'Kết quả' : recoverable.result.status === 'interrupted' ? 'Bị gián đoạn' : `Câu ${recoverable.index + 1}`}</p>
            <Button onClick={restore}>Mở lại bài làm đã lưu</Button>
            <Button secondary onClick={playAgain}>Bắt đầu lượt làm mới</Button>
        </section>}
        {stage === 'name' && !recoverable && <NameScreen name={name} selectedId={studentId} roster={data.assignees ?? []} questionCount={questionCount} required={required}
            onChange={(value, id) => {setName(value); setStudentId(id)}} onContinue={student => {if (student) setName(student.name); setStudentId(student?.id); setStage('location'); setLocationStatus('idle')}}/>}
        {stage === 'location' && <LocationScreen status={locationStatus} error={locationError} countdown={countdown} onStart={start} onBack={() => setStage('name')}/>}
        {stage === 'question' && questions[index] && <QuestionScreen key={index} question={questions[index]} index={index} total={questions.length} feedback={feedback}
            initialAnswer={local?.answers?.find(answer => answer.questionIndex === index)?.value} deadline={local?.questionDeadline} onAnswer={answer} onNext={next}/>}
        {(storageError || syncError || recoveryError) && <p role="status" className={styles.notice}>{storageError || syncError || recoveryError}</p>}
        {(stage === 'result' || stage === 'interrupted') && attempt && <ResultScreen score={attempt.correctAnswers} total={questions.length} required={required} interrupted={stage === 'interrupted'} saving={saving} saved={!!local?.saved} error={saveError || (local?.permanentError && studentErrorMessage(local.permanentError, 'Không thể lưu kết quả.')) || (local?.pending && !navigator.onLine ? 'Đang ngoại tuyến. Kết quả của em đang chờ gửi.' : '')} onRetrySave={progress.retry} onPlayAgain={playAgain}/>}
    </StudentLayout>;
}
