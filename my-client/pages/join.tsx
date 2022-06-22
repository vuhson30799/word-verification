import React, {FormEvent, useState} from "react";
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
import {questionDelayTime} from "../constant/ApplicationConstant";
import MyToast from "../components/MyToast";

export interface StudentAnswer {
    studentName: string
    correctAnswers: number
    beginningAt: string
    finishAt: string
}

enum StudentAnswerEnum {
    StudentName,
    CorrectAnswers,
    FinishAt
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

const initialDisplayState: DisplayState = {
    displayStudentName: true,
    displayQuestion: false,
    displayStartingComponent: false,
    displayStudentResult: false,
    displayKey: false,
    displayFinishPage: false
}

const initialStudentAnswer: StudentAnswer = {
    studentName: "",
    correctAnswers: 0,
    beginningAt: "",
    finishAt: ""
}

const initialAllowAnswer = true
const initialCurrentQuestion: CurrentQuestion = {
    questionNumber: 0,
    studentAnswer: ""
}

export default function AttendingExamination() {
    const router = useRouter()
    const {examId, beginningDate, deadlineDate} = router.query
    const [studentAnswer, setStudentAnswer] = useState<StudentAnswer>(initialStudentAnswer)
    const [allowAnswer, setAllowAnswer] = useState<boolean>(initialAllowAnswer)

    const [displayState, setDisplayState] = useState<DisplayState>(initialDisplayState)
    const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion>(initialCurrentQuestion)

    const {
        data: examinationData,
        error
    } = useSWRImmutable<ExaminationData>(!!examId && !!beginningDate && !!deadlineDate ?
        [`/api/join?examId=${examId}&beginningDate=${beginningDate}&deadlineDate=${deadlineDate}`, 'get'] : null, fetcher)


    const {
        data: submitAnswerSuccess
    } = useSWRImmutable<string>(displayState.displayFinishPage ? [`/api/answers`, 'post', studentAnswer] : null,fetcherWithForm)

    function handleChange(type: StudentAnswerEnum, value: string) {
        switch (type) {
            case StudentAnswerEnum.StudentName:
                setStudentAnswer({
                    ...studentAnswer,
                    studentName: value
                })
                break
            case StudentAnswerEnum.FinishAt:
                setStudentAnswer({
                    ...studentAnswer,
                    finishAt: value
                })
                break
            case StudentAnswerEnum.CorrectAnswers:
                setStudentAnswer({
                    ...studentAnswer,
                    correctAnswers: Number.parseInt(value)
                })
                break
            default:
                throw new Error(`This ${type} can not be resolve.`)
        }
    }

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
        setStudentAnswer({
            ...studentAnswer,
            finishAt: convertDate(new Date())
        })
        setDisplayState({
            ...displayState,
            displayFinishPage: true,
            displayQuestion: false
        })
    }

    function OnStudentAnswerSubmit(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        if (!allowAnswer) return

        setAllowAnswer(false)
        if (!examinationData) throw new Error('Examination data is needed for answer verification')
        const isRightAnswer = verifyAnswer(currentQuestion.studentAnswer, examinationData.questions[currentQuestion.questionNumber].keys)
        if (isRightAnswer) {
            setDisplayState({...displayState, displayStudentResult: true, displayKey: false})
            setStudentAnswer({
                ...studentAnswer,
                correctAnswers: studentAnswer.correctAnswers + 1
            })
        } else {
            setDisplayState({...displayState, displayStudentResult: true, displayKey: true})
        }

        const noQuestionLeft = currentQuestion.questionNumber + 1 == examinationData.questions.length
        if (noQuestionLeft) {
            setTimeout(showFinishPage, 5000)
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

            setAllowAnswer(true)
        }, questionDelayTime)

    }

    if (displayState.displayStartingComponent) setTimeout(() => setDisplayState({
        ...displayState,
        displayQuestion: true,
        displayStartingComponent: false
    }), 5000)

    function onPlayingAgain() {
        setDisplayState(initialDisplayState)
        setCurrentQuestion(initialCurrentQuestion)
        setAllowAnswer(initialAllowAnswer)
        setStudentAnswer(initialStudentAnswer)
    }

    return (
        <>
            {displayState.displayStudentName &&
                <>
                    <form className={styles.StudentNameLayer}
                          onSubmit={(e) => OnStartButtonClick(e)}>
                        <FormControl className={styles.JoinFormControl}>
                            <InputLabel htmlFor="studentName" className={styles.WhiteFont}>Your name is...</InputLabel>
                            <OutlinedInput
                                className={styles.WhiteFont}
                                id="studentName"
                                value={studentAnswer.studentName}
                                onChange={(e) => handleChange(StudentAnswerEnum.StudentName, e.target.value)}
                                label="Your name is..."
                            />
                        </FormControl>
                        <Button variant="contained" onClick={(e) => OnStartButtonClick(e)}>Start</Button>
                    </form>

                </>
            }
            {displayState.displayStartingComponent &&
                <>
                    <StartingQuestion title={"3"} timeout={1500} displayAfter={0}/>
                    <StartingQuestion title={"2"} timeout={1500} displayAfter={1500}/>
                    <StartingQuestion title={"1"} timeout={1500} displayAfter={3000}/>
                    <StartingQuestion title={"Go!"} timeout={1500} displayAfter={4500}/>
                </>
            }
            {displayState.displayQuestion ?
                <>
                    {!!examinationData ?
                        <>
                            <form className={styles.QuestionLayer}
                                  onSubmit={(e) => OnStudentAnswerSubmit(e)}>
                                {allowAnswer && <ProgressQuestionBar className={styles.QuestionProgress}
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
                                            onChange={(e) => handleStudentAnswerChange(e.target.value)}
                                        />
                                    </FormControl>
                                    <Button className={styles.ButtonAnswerSubmit}
                                        variant="contained"
                                            disabled={!allowAnswer}
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
                        : undefined
                    }
                </>
                : undefined
            }
            {displayState.displayFinishPage &&
                <div className={styles.FinishPage}>
                    <h1>The end. Your result
                        is {studentAnswer.correctAnswers} / {examinationData?.questions.length}</h1>
                    <h3>Start at: {studentAnswer.beginningAt}</h3>
                    <h3>Finish at: {studentAnswer.finishAt}</h3>
                    <Button variant="contained" onClick={onPlayingAgain}>
                        Play Again
                    </Button>
                </div>
            }
            {!!submitAnswerSuccess
                && <MyToast message={submitAnswerSuccess} severity="success"/>
            }
            {!!error &&
                <p>Some error happened</p>
            }
        </>
    )
}
