import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/router';
import useSWRImmutable from 'swr/immutable';
import type {ExaminationData} from './admin/examination';
import type {JoinAssignee} from '../modules/join/assignees';
import {fetcher, fetcherWithForm} from '../modules/configuration/Configuration';
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

export interface StudentAnswer {
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
    const [attempt, setAttempt] = useState<StudentAnswer>();
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [progressError, setProgressError] = useState('');
    const locationPending = useRef(false);
    const answered = useRef(false);
    const submitPending = useRef(false);
    const questionCount = data?.examination.questions.length ?? 0;
    const required = questionCount - maximumIncorrectAnswers(data?.examination ?? {});

    useEffect(() => {
        if (stage !== 'location' || locationStatus !== 'received') return;
        const timer = setInterval(() => setCountdown(value => Math.max(0, value - 1)), 1000);
        return () => clearInterval(timer);
    }, [stage, locationStatus]);
    useEffect(() => {
        if (stage === 'location' && locationStatus === 'received' && countdown === 0) setStage('question');
    }, [stage, locationStatus, countdown]);
    useEffect(() => {
        if (stage !== 'question') return;
        const interrupt = () => {if (document.hidden) setStage('interrupted')};
        document.addEventListener('visibilitychange', interrupt);
        return () => document.removeEventListener('visibilitychange', interrupt);
    }, [stage]);
    useEffect(() => {
        if (stage !== 'question' || index % 5 !== 0 || !attempt) return;
        // Checkpoints have no finish time, so they cannot be mistaken for a completed test.
        fetcherWithForm(['/api/answers/current-state', 'post', {...attempt, questionNumber: index + 1, finishAt: ''}])
            .then(() => setProgressError('')).catch(() => setProgressError('Your progress could not be saved. Check your connection.'));
        // A checkpoint is recorded once when entering each five-question block.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, index]);

    async function start() {
        if (!data || locationPending.current) return;
        locationPending.current = true;
        setLocationStatus('pending');
        setLocationError('');
        try {
            const location = await requestTestLocation();
            const key = `wv:attempt:${data.examination.id}:${data.homeworkId}:${studentId || name.trim()}`;
            let trial = 1;
            try {trial = Number(localStorage.getItem(key) || 0) + 1; localStorage.setItem(key, `${trial}`)} catch { /* Storage may be disabled. The test can still be submitted. */ }
            setAttempt({examId: data.examination.id!, homeworkId: data.homeworkId, studentName: name.trim(), ...(studentId ? {studentId} : {}), correctAnswers: 0, trial, beginningAt: convertDate(new Date()), location});
            setQuestions(shuffle(data.examination));
            setIndex(0);
            setFeedback(null);
            answered.current = false;
            setSaveError('');
            setProgressError('');
            setCountdown(3);
            setLocationStatus('received');
        } catch (error) {
            setLocationStatus((error as {code?: number}).code === 1 ? 'blocked' : 'unavailable');
            setLocationError(error instanceof Error ? error.message : 'Could not get your location. Please retry.');
        } finally {locationPending.current = false}
    }

    function answer(value: string) {
        if (answered.current || !attempt || stage !== 'question') return;
        answered.current = true;
        const correct = verifyAnswer(value, questions[index].keys);
        setFeedback(correct);
        if (correct) setAttempt(previous => previous && ({...previous, correctAnswers: previous.correctAnswers + 1}));
    }

    async function save(result: StudentAnswer) {
        if (submitPending.current) return;
        submitPending.current = true;
        setSaving(true);
        setSaveError('');
        try {await fetcherWithForm(['/api/answers', 'post', result])}
        catch (error) {setSaveError(error instanceof Error ? error.message : 'Your results could not be saved. Please retry.')}
        finally {submitPending.current = false; setSaving(false)}
    }

    function next() {
        if (feedback === null || !attempt) return;
        if (index + 1 === questions.length) {
            const result = {...attempt, finishAt: convertDate(new Date())};
            setAttempt(result);
            setStage('result');
            void save(result);
        } else {setIndex(value => value + 1); setFeedback(null); answered.current = false}
    }

    function playAgain() {setStage('name'); setLocationStatus('idle'); setLocationError(''); setProgressError('')}

    const problem = error?.message || (ready && !hasLink ? 'Open the homework link shared by your teacher to join this examination.' : data && !questionCount ? 'This examination has no questions. Please contact your teacher.' : '');
    if (problem || !data) return <StudentLayout title="Join examination"><section className={styles.content}><StatusIcon kind={problem ? 'error' : 'waiting'}/><Heading title={problem ? 'We couldn’t open this test.' : 'Opening your test…'}>{problem || 'Getting everything ready for you.'}</Heading>{error && <Button onClick={() => mutate()}>Try again</Button>}</section></StudentLayout>;

    return <StudentLayout title={data.examination.title} progress={stage === 'question' ? `${index + 1} / ${questions.length}` : undefined}>
        <p className={styles.examTitle}>{data.examination.title}</p>
        {stage === 'name' && <NameScreen name={name} selectedId={studentId} roster={data.assignees ?? []} questionCount={questionCount} required={required}
            onChange={(value, id) => {setName(value); setStudentId(id)}} onContinue={student => {if (student) {setName(student.name); setStudentId(student.id)} setStage('location'); setLocationStatus('idle')}}/>}
        {stage === 'location' && <LocationScreen status={locationStatus} error={locationError} countdown={countdown} onStart={start} onBack={() => setStage('name')}/>}
        {stage === 'question' && questions[index] && <QuestionScreen key={index} question={questions[index]} index={index} total={questions.length} feedback={feedback} onAnswer={answer} onNext={next}/>}
        {progressError && stage === 'question' && <p role="status" className={styles.notice}>{progressError}</p>}
        {(stage === 'result' || stage === 'interrupted') && attempt && <ResultScreen score={attempt.correctAnswers} total={questions.length} required={required} interrupted={stage === 'interrupted'} saving={saving} error={saveError} onRetrySave={() => save(attempt)} onPlayAgain={playAgain}/>}
    </StudentLayout>;
}
