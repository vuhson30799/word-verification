import React, {FormEvent, useCallback, useEffect, useState} from "react";
import styles from "../styles/Join.module.css";
import {FormControl, useMediaQuery} from "@mui/material";
import useSWRImmutable from 'swr/immutable'
import {ExaminationData} from "./admin/examination";
import {fetcher, fetcherWithForm} from "../modules/configuration/Configuration";
import {useRouter} from "next/router";
import {convertDate} from "../modules/utils/dateUtils";
import {translateKey, verifyAnswer} from "../modules/utils/verification";
import ProgressQuestionBar from "../components/ProgressQuestionBar";
import {rightAnswerColor, timeToDisplayFirstQuestion, wrongAnswerColor} from "../constant/ApplicationConstant";
import MyToast from "../components/MyToast";
import {MySpinner} from "../components/MySpinner";
import Head from "next/head";
import useSWR from "swr";
import StartingQuestion from "../components/StartingQuestion";
import MyInput from "../components/MyInput";
import {MyButton} from "../components/MyButton";
import Typography from "@mui/material/Typography";
import {DisplayState, DisplayStateEnum, isDisplayed} from "../modules/join/display/DisplayService";
import {TimeoutContext} from "../modules/join/context";
import MyColorDiv from "../components/MyColorDiv";

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

interface Allowance {
    answer: boolean
    start: boolean
}

export interface HomeworkExam {
    examination: ExaminationData
    homeworkId: string
}

const initialDisplayState: DisplayState = {
    components: [DisplayStateEnum.STUDENT_NAME]
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

function getAnswerColor(displayState: DisplayState) {
    if (isDisplayed(displayState, DisplayStateEnum.KEY_BUTTON)) return wrongAnswerColor
    if (isDisplayed(displayState, DisplayStateEnum.TO_NEXT_QUESTION)) return rightAnswerColor

    //default color will be used
    return undefined
}

function setVisible(predicate: boolean) {
    return predicate ? 'visible' : 'hidden'
}

export default function AttendingExamination() {
    const isSmallPhone = useMediaQuery('(max-width:430px)')
    const router = useRouter()
    const {examId, beginningDate, deadlineDate} = router.query
    const [examinationData, setExaminationData] = useState<ExaminationData | undefined>(undefined)
    const [studentAnswer, setStudentAnswer] = useState<StudentAnswer>(initialStudentAnswer)
    const [allowance, setAllowance] = useState<Allowance>(initialAllowance)

    const [displayState, setDisplayState] = useState<DisplayState>(initialDisplayState)
    const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion>(initialCurrentQuestion)
    const [triggerTimeout, setTriggerTimeout] = useState(false)

    const {
        data,
        error
    } = useSWRImmutable<HomeworkExam>(!!examId && !!beginningDate && !!deadlineDate ?
        [`/api/join?examId=${examId}&beginningDate=${beginningDate}&deadlineDate=${deadlineDate}`, 'get'] : null, fetcher)

    const {
        data: submitAnswerSuccess,
        error: submitAnswerError
    } = useSWR<{ success: string }>(isDisplayed(displayState, DisplayStateEnum.FINISH_PAGE) ? ['/api/answers', 'post', studentAnswer] : null, fetcherWithForm)

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
    }, [data, studentAnswer.studentName])
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

    const updateHomeworkLocalStorage = useCallback(() => {
        localStorage.setItem('examId', `${examId}`)
        localStorage.setItem('homeworkId', `${data?.homeworkId}`)
        localStorage.setItem('trial', `${studentAnswer.trial + 1}`)
        localStorage.setItem('studentName', `${studentAnswer.studentName}`)
    }, [examId, data?.homeworkId, studentAnswer.trial, studentAnswer.studentName])

    useEffect(() => {
        window.onbeforeunload = updateHomeworkLocalStorage
    }, [updateHomeworkLocalStorage])


    if (error) return <MyToast message={error.message} severity={"error"}/>
    if (submitAnswerError) return <MyToast message={submitAnswerError.message} severity={"error"}/>
    if (!data) return <MySpinner/>
    if (isDisplayed(displayState, DisplayStateEnum.FINISH_PAGE) && !submitAnswerSuccess) return <MySpinner/>
    if (isDisplayed(displayState, DisplayStateEnum.STARTING_COMPONENT)) setTimeout(() => setDisplayState({
        components: [DisplayStateEnum.QUESTION]
    }), timeToDisplayFirstQuestion)

    document.onvisibilitychange = showCheatingPage

    function OnStartButtonClick(e: FormEvent) {
        e.preventDefault()
        setDisplayState({
            components: [DisplayStateEnum.STARTING_COMPONENT]
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
            components: [DisplayStateEnum.FINISH_PAGE]
        })
    }

    function showCheatingPage() {
        if (isDisplayed(displayState, DisplayStateEnum.FINISH_PAGE)) return
        setTriggerTimeout(false)
        setDisplayState({
            components: [DisplayStateEnum.CHEATING_PAGE]
        })
    }

    function onStudentAnswerSubmit(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        if (!allowance.answer) return

        setAllowance({
            ...allowance,
            answer: false
        })
        const isRightAnswer = verifyAnswer(currentQuestion.studentAnswer, examinationData?.questions[currentQuestion.questionNumber].keys)
        if (isRightAnswer) {
            setDisplayState({components: [DisplayStateEnum.QUESTION, DisplayStateEnum.TO_NEXT_QUESTION]})
            setStudentAnswer({
                ...studentAnswer,
                correctAnswers: studentAnswer.correctAnswers + 1,
                // On the last question, I update student answer twice, then the second override value of correct answers cause a bug
                // That's why I update finishAt here as a workaround.
                finishAt: convertDate(new Date())
            })
        } else {
            setDisplayState({components: [DisplayStateEnum.QUESTION, DisplayStateEnum.KEY_BUTTON]})
            setStudentAnswer({
                ...studentAnswer,
                finishAt: convertDate(new Date())
            })
        }
        setTriggerTimeout(true)
    }

    function onNextButtonClick(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        setTriggerTimeout(false)
        const noQuestionLeft = currentQuestion.questionNumber + 1 == examinationData?.questions.length
        if (noQuestionLeft) {
            showFinishPage()
            return
        }

        setCurrentQuestion({
            studentAnswer: "",
            questionNumber: currentQuestion.questionNumber + 1
        })

        setAllowance({
            ...allowance,
            answer: true
        })
        setDisplayState({
            components: [DisplayStateEnum.QUESTION]
        })

    }

    function onKeyButtonClick(e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLAnchorElement> | React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        setDisplayState({components: [DisplayStateEnum.QUESTION, DisplayStateEnum.ANSWERS, DisplayStateEnum.TO_NEXT_QUESTION]})
    }

    function onPlayingAgain() {
        setDisplayState({
            components: [DisplayStateEnum.STARTING_COMPONENT]
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
        <TimeoutContext.Provider value={triggerTimeout}>
            <style global jsx>
                {`body {
                  margin: 0;
                  background-image: url('/background.svg');
                  background-repeat: no-repeat;
                  background-size: cover;
                  background-color: #343a40;
                }`}
            </style>
            <Head>
                <title>Play Homework</title>
                <meta name="description" content="Student zone page"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </Head>
            {isDisplayed(displayState, DisplayStateEnum.STUDENT_NAME) &&
                <>
                    <form className={styles.StudentNameLayer}
                          onSubmit={(e) => OnStartButtonClick(e)}>
                        <Typography variant="h2" color="#eaeaea" textAlign="center">WHO ARE YOU?</Typography>
                        <FormControl className={styles.JoinFormControl} required={true}>
                            <MyInput id="studentName"
                                     value={studentAnswer.studentName}
                                     onChange={(e) => setStudentAnswer({
                                         ...studentAnswer,
                                         studentName: e.target.value
                                     })}
                                     autoFocus={true}
                                     placeholder="Your name is..."
                                     autoComplete="off"/>
                        </FormControl>
                        <MyButton disabled={!allowance.start}
                                  onClick={(e) => OnStartButtonClick(e)}>Start</MyButton>
                    </form>

                </>
            }
            {isDisplayed(displayState, DisplayStateEnum.STARTING_COMPONENT) && <StartingQuestion/>}
            {isDisplayed(displayState, DisplayStateEnum.QUESTION) && examinationData &&
                <>
                    <form className={styles.QuestionLayer}
                          onSubmit={(e) => onStudentAnswerSubmit(e)}>
                        <ProgressQuestionBar className={styles.QuestionProgress}
                                             style={{visibility: `${setVisible(allowance.answer)}`}}
                                             timeout={examinationData.questions[currentQuestion.questionNumber].timeout}
                                             handleTimeout={onStudentAnswerSubmit}/>
                        <div className={styles.QuestionTitle}>
                            <MyColorDiv style={{minWidth: '80vw', padding: '32px 32px'}}
                                        value={`Question ${currentQuestion.questionNumber + 1}: ${examinationData.questions[currentQuestion.questionNumber].title}`}
                            />
                            <h5 className={styles.KeyContainer}
                                style={{visibility: `${setVisible(isDisplayed(displayState, DisplayStateEnum.ANSWERS))}`}}>
                                {examinationData.questions[currentQuestion.questionNumber].keys.map((key, index) => {
                                    return <MyColorDiv key={index}
                                                       style={{minHeight: '5vh', backgroundImage: `${rightAnswerColor}`, display: 'flex', justifyContent: 'center', fontSize: `${isSmallPhone && '0.75rem'}`}}
                                                       value={translateKey(key)}
                                    />
                                })}
                            </h5>
                        </div>
                        <div className={styles.AnswerSubmit}>
                            <FormControl className={styles.JoinFormControl}
                                         style={{visibility: `${setVisible(!isDisplayed(displayState, DisplayStateEnum.ANSWERS))}`, margin: '5px 0 10px 0'}}>
                                <MyInput id="currentAnswer"
                                         backgroundImage={getAnswerColor(displayState)}
                                         value={currentQuestion.studentAnswer}
                                         autoFocus={true}
                                         autoComplete="off"
                                         onChange={(e) => handleStudentAnswerChange(e.target.value)}/>
                            </FormControl>
                            {allowance.answer &&
                                <MyButton className={styles.ButtonAnswerSubmit}
                                          variant="contained"
                                          onClick={(e) => onStudentAnswerSubmit(e)}>
                                    Submit
                                </MyButton>
                            }
                            {isDisplayed(displayState, DisplayStateEnum.TO_NEXT_QUESTION) &&
                                <MyButton className={styles.ButtonAnswerSubmit}
                                          variant="contained"
                                          onClick={(e) => onNextButtonClick(e)}>
                                    Next
                                </MyButton>
                            }
                            {isDisplayed(displayState, DisplayStateEnum.KEY_BUTTON) &&
                                <MyButton className={styles.ButtonAnswerSubmit}
                                          variant="contained"
                                          onClick={(e) => onKeyButtonClick(e)}>
                                    Answer
                                </MyButton>
                            }
                        </div>
                    </form>
                </>
            }
            {isDisplayed(displayState, DisplayStateEnum.FINISH_PAGE) &&
                <div className={styles.FinishPage}>
                    <MyColorDiv style={{display: "flex", justifyContent: "space-around", flexDirection: "column",
                        minHeight: `${isSmallPhone ? "35vh" : "50vh"}`,
                        minWidth: `${isSmallPhone ? "60vw" : "40vw"}`,
                        fontSize: `${isSmallPhone ? "1em" : "2.25em"}`}}>
                        <h1>Your result</h1>
                        <h1>{studentAnswer.correctAnswers} / {examinationData?.questions.length}</h1>
                        <MyButton style={{margin: "2vh 0"}} variant="contained" onClick={onPlayingAgain}>
                            Play Again
                        </MyButton>
                        {!!submitAnswerSuccess
                            && <MyToast message={submitAnswerSuccess.success} severity="success"/>
                        }
                    </MyColorDiv>
                </div>
            }
            {isDisplayed(displayState, DisplayStateEnum.CHEATING_PAGE) &&
                <div className={styles.FinishPage}>
                    <MyColorDiv style={{display: "flex", justifyContent: "space-around", flexDirection: "column",
                        minHeight: `${isSmallPhone ? "35vh" : "50vh"}`,
                        minWidth: `${isSmallPhone ? "60vw" : "40vw"}`,
                        fontSize: `${isSmallPhone ? "1em" : "2.25em"}`}}>
                        <h1>Your result</h1>
                        <h1>{studentAnswer.correctAnswers} / {examinationData?.questions.length}</h1>
                        <h5>Detecting cheating when you open another tab or different application. Your result will not be
                            submitted. Please start over.</h5>
                        <MyButton style={{margin: "2vh 0"}} variant="contained" onClick={onPlayingAgain}>
                            Play Again
                        </MyButton>
                    </MyColorDiv>

                </div>
            }
        </TimeoutContext.Provider>
    )
}
