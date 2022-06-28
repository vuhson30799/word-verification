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

export interface StudentAnswer {
    examId: string
    homeworkId: string
    studentName: string
    correctAnswers: number
    beginningAt: string
    finishAt: string
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
    displayFinishPage: false
}

const initialStudentAnswer: StudentAnswer = {
    examId: "",
    homeworkId: "",
    studentName: "",
    correctAnswers: 0,
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
        data: submitAnswerSuccess
    } = useSWRImmutable<{ success: string }>(displayState.displayFinishPage ? [`/api/answers`, 'post', studentAnswer] : null, fetcherWithForm)
    useEffect(() => {
        if (data) {
            setExaminationData(shuffleExamination(data.examination))
            setStudentAnswer({
                ...studentAnswer,
                examId: `${examId}`,
                homeworkId: `${data.homeworkId}`
            })
        }
    }, [data])
    useEffect(() => {
        if (studentAnswer.studentName.length === 0) {
            setAllowance({
                ...allowance,
                start: false
            })
            return
        } else {
            setAllowance({
                ...allowance,
                start: true
            })
        }
    }, [studentAnswer.studentName.length])

    if (error) return <MyToast message={error.message} severity={"error"} />
    if (!data) return <MySpinner/>
    if (displayState.displayFinishPage && !submitAnswerSuccess) return <MySpinner/>
    if (displayState.displayStartingComponent) setTimeout(() => setDisplayState({
        ...displayState,
        displayQuestion: true,
        displayStartingComponent: false
    }), timeToDisplayFirstQuestion)

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

    function OnStudentAnswerSubmit(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>) {
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
                          onSubmit={(e) => OnStudentAnswerSubmit(e)}>
                        {allowance.answer && <ProgressQuestionBar className={styles.QuestionProgress}
                                                                  timeout={examinationData.questions[currentQuestion.questionNumber].timeout}
                                                                  handleTimeout={OnStudentAnswerSubmit}/>}
                        <div className={styles.QuestionTitle}>
                            <h2>{examinationData.questions[currentQuestion.questionNumber].title}</h2>
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
                                    onClick={(e) => OnStudentAnswerSubmit(e)}>
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
        </>
    )
}
