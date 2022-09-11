import React, {FormEvent, useEffect, useState} from "react";
import styles from "../styles/Join.module.css";
import {Button, FormControl, InputLabel, OutlinedInput} from "@mui/material";
import useSWRImmutable from 'swr/immutable'
import {ExaminationData} from "./admin/examination";
import {fetcher, fetcherWithForm} from "../modules/configuration/Configuration";
import {useRouter} from "next/router";
import {convertDate} from "../modules/utils/dateUtils";
import StartingQuestion from "../components/StartingQuestion";
import {translateKey, verifyAnswer} from "../modules/utils/verification";
import ProgressQuestionBar from "../components/ProgressQuestionBar";
import {StudentResult, StudentResultType} from "../components/StudentResult";
import DoneIcon from '@mui/icons-material/Done';
import {
    timeBetweenQuestions,
    timeBetweenStartingComponents,
    timeToDisplay3,
    timeToDisplayFirstQuestion
} from "../constant/ApplicationConstant";
import MyToast from "../components/MyToast";
import {MySpinner} from "../components/MySpinner";
import Head from "next/head";
import useSWR from "swr";
import Script from "next/script";

export interface StudentAnswer {
    id?: string
    examId: string
    homeworkId: string
    studentName: string
    correctAnswers: number
    trial: number
    questionNumber?: number
    beginningAt?: string
    finishAt?: string
}

interface CurrentQuestion {
    questionNumber: number
    studentAnswer: string
}

interface DisplayState {
    displayStudentName: boolean
    displayQuestion: boolean
    displayStartingComponent: boolean
    displayStudentResult: boolean
    displayKey: boolean
    displayFinishPage: boolean
    displayCheatingPage: boolean
}

interface Allowance {
    answer: boolean
    start: boolean
}

export interface HomeworkExam {
    examination: ExaminationData
    homeworkId: string
}

const initialDisplayState: DisplayState = {
    displayStudentName: true,
    displayQuestion: false,
    displayStartingComponent: false,
    displayStudentResult: false,
    displayKey: false,
    displayFinishPage: false,
    displayCheatingPage: false
}

const initialStudentAnswer: StudentAnswer = {
    examId: "",
    homeworkId: "",
    studentName: "",
    correctAnswers: 0,
    trial: 1,
    beginningAt: "",
    finishAt: ""
}

const initialCurrentQuestion: CurrentQuestion = {
    questionNumber: 0,
    studentAnswer: ""
}

const initialAllowance: Allowance = {
    answer: true,
    start: true
}

function shuffleExamination(examinationData: ExaminationData): ExaminationData {
    const shuffledQuestions = []
    const questions = examinationData.questions
    while (questions.length !== 0) {
        const index = Math.floor(Math.random() * questions.length);
        shuffledQuestions.push(examinationData.questions[index])
        questions.splice(index, 1)
    }

    examinationData.questions = shuffledQuestions
    return examinationData

}

export default function AttendingExamination() {
    const router = useRouter()
    const {examId, beginningDate, deadlineDate} = router.query
    const [examinationData, setExaminationData] = useState<ExaminationData | undefined>(undefined)
    const [studentAnswer, setStudentAnswer] = useState<StudentAnswer>(initialStudentAnswer)
    const [allowance, setAllowance] = useState<Allowance>(initialAllowance)

    const [displayState, setDisplayState] = useState<DisplayState>(initialDisplayState)
    const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion>(initialCurrentQuestion)

    const {
        data,
        error
    } = useSWRImmutable<HomeworkExam>(!!examId && !!beginningDate && !!deadlineDate ?
        [`/api/join?examId=${examId}&beginningDate=${beginningDate}&deadlineDate=${deadlineDate}`, 'get'] : null, fetcher)

    const {
        data: submitAnswerSuccess,
        error: submitAnswerError
    } = useSWR<{ success: string }>(displayState.displayFinishPage ? ['/api/answers', 'post', studentAnswer] : null, fetcherWithForm)

    // update current state of student
    useSWR(currentQuestion.questionNumber % 5 == 0
    && currentQuestion.questionNumber != 0
        ? [`/api/answers/current-state`, 'post', {
        ...studentAnswer,
        questionNumber: currentQuestion.questionNumber + 1
    }] : null, fetcherWithForm)
    useEffect(() => {
        const lastExamId = localStorage.getItem('examId')
        const lastHomeworkId = localStorage.getItem('homeworkId')
        const lastTrial = localStorage.getItem('trial')
        const lastStudentName = localStorage.getItem('studentName')
        if (data) {
            if (lastExamId === examId
                && lastHomeworkId === data.homeworkId
                && lastStudentName === studentAnswer.studentName
                && lastTrial) {
                setStudentAnswer({
                    ...studentAnswer,
                    examId: `${examId}`,
                    homeworkId: `${data.homeworkId}`,
                    trial: Number.parseInt(lastTrial)
                })
            } else {
                setStudentAnswer({
                    ...studentAnswer,
                    examId: `${examId}`,
                    homeworkId: `${data.homeworkId}`
                })
            }
            setExaminationData(shuffleExamination(data.examination))
        }
    }, [data])
    useEffect(() => {
        if (studentAnswer.studentName.length === 0) {
            setAllowance({
                ...allowance,
                start: false
            })
        } else {
            setAllowance({
                ...allowance,
                start: true
            })
        }
    }, [studentAnswer.studentName.length])

    if (error) return <MyToast message={error.message} severity={"error"} />
    if (submitAnswerError) return <MyToast message={submitAnswerError.message} severity={"error"} />
    if (!data) return <MySpinner/>
    if (displayState.displayFinishPage && !submitAnswerSuccess) return <MySpinner/>
    if (displayState.displayStartingComponent) setTimeout(() => setDisplayState({
        ...displayState,
        displayQuestion: true,
        displayStartingComponent: false
    }), timeToDisplayFirstQuestion)


    window.onbeforeunload = function updateHomeworkLocalStorage(): void {
        localStorage.setItem('examId', `${examId}`)
        localStorage.setItem('homeworkId', `${data?.homeworkId}`)
        localStorage.setItem('trial', `${studentAnswer.trial + 1}`)
        localStorage.setItem('studentName', `${studentAnswer.studentName}`)
    }
    document.onvisibilitychange = showCheatingPage

    function OnStartButtonClick(e: FormEvent) {
        e.preventDefault()
        setDisplayState({
            ...displayState,
            displayStudentName: false,
            displayStartingComponent: true
        })
        setStudentAnswer({
            ...studentAnswer,
            beginningAt: convertDate(new Date())
        })
    }

    function handleStudentAnswerChange(value: string) {
        setCurrentQuestion({
            ...currentQuestion,
            studentAnswer: value
        })
    }

    function showFinishPage() {
        setDisplayState({
            ...displayState,
            displayFinishPage: true,
            displayQuestion: false
        })
    }

    function showCheatingPage() {
        setDisplayState({
            ...displayState,
            displayCheatingPage: true,
            displayQuestion: false
        })
    }

    function onStudentAnswerSubmit(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        if (!allowance.answer) return

        setAllowance({
            ...allowance,
            answer: false
        })
        if (!examinationData) throw new Error('Examination data is needed for answer verification')
        const isRightAnswer = verifyAnswer(currentQuestion.studentAnswer, examinationData.questions[currentQuestion.questionNumber].keys)
        if (isRightAnswer) {
            setDisplayState({...displayState, displayStudentResult: true, displayKey: false})
            setStudentAnswer({
                ...studentAnswer,
                correctAnswers: studentAnswer.correctAnswers + 1,
                // On the last question, I update student answer twice, then the second override value of correct answers cause a bug
                // That's why I update finishAt here as a workaround.
                finishAt: convertDate(new Date())
            })
        } else {
            setDisplayState({...displayState, displayStudentResult: true, displayKey: true})
            setStudentAnswer({
                ...studentAnswer,
                finishAt: convertDate(new Date())
            })
        }

        const noQuestionLeft = currentQuestion.questionNumber + 1 == examinationData.questions.length
        if (noQuestionLeft) {
            setTimeout(showFinishPage, timeBetweenQuestions)
            return
        }

        setTimeout(() => {
            setCurrentQuestion({
                studentAnswer: "",
                questionNumber: currentQuestion.questionNumber + 1
            })
            setDisplayState({
                ...displayState,
                displayStudentResult: false,
                displayKey: false
            })

            setAllowance({
                ...allowance,
                answer: true
            })
        }, timeBetweenQuestions)

    }

    function onPlayingAgain() {
        setDisplayState({
            ...initialDisplayState,
            displayStartingComponent: true,
            displayStudentName: false
        })
        setCurrentQuestion(initialCurrentQuestion)
        setAllowance(initialAllowance)
        if (data) {
            setExaminationData(shuffleExamination(data.examination))
            setStudentAnswer({
                ...initialStudentAnswer,
                beginningAt: convertDate(new Date()),
                studentName: studentAnswer.studentName,
                trial: studentAnswer.trial + 1,
                examId: `${examId}`,
                homeworkId: `${data.homeworkId}`
            })
        }
    }

    return (
        <>
            <style global jsx>{`body {margin: 0;}`}</style>
            <Head>
                <title>Play Homework</title>
                <meta name="description" content="Student zone page" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </Head>
            {displayState.displayStudentName &&
                <>
                    <form className={styles.StudentNameLayer}
                          onSubmit={(e) => OnStartButtonClick(e)}>
                        <FormControl className={styles.JoinFormControl} required={true}>
                            <InputLabel htmlFor="studentName" className={styles.WhiteFont}>Your name is...</InputLabel>
                            <OutlinedInput
                                className={styles.WhiteFont}
                                id="studentName"
                                value={studentAnswer.studentName}
                                onChange={(e) => setStudentAnswer({
                                    ...studentAnswer,
                                    studentName: e.target.value
                                })}
                                label="Your name is..."
                                autoComplete="off"
                            />
                        </FormControl>
                        <Button variant="contained"
                                disabled={!allowance.start}
                                onClick={(e) => OnStartButtonClick(e)}>Start</Button>
                    </form>

                </>
            }
            {displayState.displayStartingComponent &&
                <>
                    <StartingQuestion title={"3"} timeout={timeBetweenStartingComponents} displayAfter={timeToDisplay3}/>
                    <StartingQuestion title={"2"} timeout={timeBetweenStartingComponents} displayAfter={timeToDisplay3 + timeBetweenStartingComponents}/>
                    <StartingQuestion title={"1"} timeout={timeBetweenStartingComponents} displayAfter={timeToDisplay3 + 2 * timeBetweenStartingComponents}/>
                    <StartingQuestion title={"Go!"} timeout={timeBetweenStartingComponents} displayAfter={timeToDisplay3 + 3 * timeBetweenStartingComponents}/>
                </>
            }
            {displayState.displayQuestion && examinationData &&
                <>
                    <form className={styles.QuestionLayer}
                          onSubmit={(e) => onStudentAnswerSubmit(e)}>
                        {allowance.answer && <ProgressQuestionBar className={styles.QuestionProgress}
                                                                  timeout={examinationData.questions[currentQuestion.questionNumber].timeout}
                                                                  handleTimeout={onStudentAnswerSubmit}/>}
                        <div className={styles.QuestionTitle}>
                            <h2>Question {currentQuestion.questionNumber + 1}: {examinationData.questions[currentQuestion.questionNumber].title}</h2>
                            {displayState.displayKey && !!examinationData &&
                                <h5 className={styles.KeyContainer}>
                                    {examinationData.questions[currentQuestion.questionNumber].keys.map((key, index) => {
                                        return <div key={index} className={styles.KeyStyle}>
                                            <DoneIcon color={"success"}/>{translateKey(key)}
                                        </div>
                                    })}
                                </h5>
                            }
                        </div>
                        <div className={styles.AnswerSubmit}>
                            <FormControl className={styles.JoinFormControl}>
                                <InputLabel htmlFor="currentAnswer" className={styles.WhiteFont}>Your answer
                                    is...</InputLabel>
                                <OutlinedInput
                                    className={styles.WhiteFont}
                                    id="currentAnswer"
                                    value={currentQuestion.studentAnswer}
                                    autoComplete="off"
                                    onChange={(e) => handleStudentAnswerChange(e.target.value)}
                                />
                            </FormControl>
                            <Button className={styles.ButtonAnswerSubmit}
                                    variant="contained"
                                    disabled={!allowance.answer}
                                    onClick={(e) => onStudentAnswerSubmit(e)}>
                                Submit
                            </Button>
                        </div>
                        {displayState.displayStudentResult ?
                            displayState.displayKey ? <StudentResult type={StudentResultType.Wrong} /> : <StudentResult type={StudentResultType.Correct} />
                            : undefined
                        }
                    </form>
                </>
            }
            {displayState.displayFinishPage &&
                <div className={styles.FinishPage}>
                    {examinationData && <h1>Examination - {examinationData.title}</h1>}
                    <h1>Your result</h1>
                    <h1>{studentAnswer.correctAnswers} / {examinationData?.questions.length}</h1>
                    <Button variant="contained" onClick={onPlayingAgain}>
                        Play Again
                    </Button>
                    {!!submitAnswerSuccess
                        && <MyToast message={submitAnswerSuccess.success} severity="success"/>
                    }
                </div>
            }
            {displayState.displayCheatingPage &&
                <div className={styles.FinishPage}>
                    {examinationData && <h1>Examination - {examinationData.title}</h1>}

                    <h1>Your result</h1>
                    <h1>{studentAnswer.correctAnswers} / {examinationData?.questions.length}</h1>
                    <h5>Detecting cheating when you open another tab or different application. Your result will not be submitted. Please start over.</h5>
                    <Button variant="contained" onClick={onPlayingAgain}>
                        Play Again
                    </Button>

                </div>
            }
        </>
    )
}
