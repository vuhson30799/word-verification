import React, {FormEvent, useCallback, useEffect, useRef, useState} from "react";
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
import {isEmpty} from "lodash";
import {decodeHomeworkUrl} from "../modules/utils/dataUtils";
import {requestTestLocation, TestLocation} from "../modules/join/location";

import {hasPassedExamination, maximumIncorrectAnswers} from "../modules/utils/examinationPassing";

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
    location?: TestLocation
}

interface CurrentQuestion {
    questionNumber: number
    studentAnswer: string
}

interface Allowance {
    answer: boolean
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
    answer: true
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
    const {q} = router.query
    const {examId, beginningDate, deadlineDate} = !isEmpty(q)
      ? decodeHomeworkUrl(`${q}`)
      // to be removed when all homework uses new structure: with 'data' query
      : router.query
    const [examinationData, setExaminationData] = useState<ExaminationData | undefined>(undefined)
    const [studentAnswer, setStudentAnswer] = useState<StudentAnswer>(initialStudentAnswer)
    const [allowance, setAllowance] = useState<Allowance>(initialAllowance)

    const [displayState, setDisplayState] = useState<DisplayState>(initialDisplayState)
    const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion>(initialCurrentQuestion)
    const [triggerTimeout, setTriggerTimeout] = useState(false)
    const questionFormRef = useRef<HTMLFormElement>(null)
    const locationRequestPending = useRef(false)
    const [requestingLocation, setRequestingLocation] = useState(false)
    const [locationError, setLocationError] = useState('')

    useEffect(() => {
        if (!isDisplayed(displayState, DisplayStateEnum.STARTING_COMPONENT)) return
        const timeout = setTimeout(() => setDisplayState({
            components: [DisplayStateEnum.QUESTION]
        }), timeToDisplayFirstQuestion)
        return () => clearTimeout(timeout)
    }, [displayState])

    useEffect(() => {
        if (!isDisplayed(displayState, DisplayStateEnum.QUESTION)) return
        const selector = allowance.answer ? '#currentAnswer' : 'button[type="submit"]'
        questionFormRef.current?.querySelector<HTMLElement>(selector)?.focus()
    }, [displayState, allowance.answer, currentQuestion.questionNumber])

    useEffect(() => {
        const viewport = window.visualViewport
        if (!viewport) return

        // Keep the mobile controls above keyboards that shrink only the visual viewport.
        const updateKeyboardInset = () => {
            const inset = viewport.scale === 1
                ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
                : 0
            document.documentElement.style.setProperty('--join-keyboard-inset', `${inset}px`)
        }
        updateKeyboardInset()
        viewport.addEventListener('resize', updateKeyboardInset)
        viewport.addEventListener('scroll', updateKeyboardInset)
        return () => {
            viewport.removeEventListener('resize', updateKeyboardInset)
            viewport.removeEventListener('scroll', updateKeyboardInset)
            document.documentElement.style.removeProperty('--join-keyboard-inset')
        }
    }, [])

    const {
        data,
        error
    } = useSWRImmutable<HomeworkExam>((examId && beginningDate && deadlineDate) || q ?
        [`/api/join?examId=${examId}&beginningDate=${beginningDate}&deadlineDate=${deadlineDate}&q=${q ?? ''}`, 'get'] : null, fetcher)

    const {
        data: submitAnswerSuccess,
        error: submitAnswerError
    } = useSWR<{ success: string }>(isDisplayed(displayState, DisplayStateEnum.FINISH_PAGE) ? ['/api/answers', 'post', studentAnswer] : null, fetcherWithForm)

    // update current state of student
    useSWR(currentQuestion.questionNumber % 5 == 0
    && !!studentAnswer.beginningAt && !!studentAnswer.studentName.trim()
    && !isDisplayed(displayState, DisplayStateEnum.FINISH_PAGE)
        ? [`/api/answers/current-state`, 'post', {
            ...studentAnswer,
            questionNumber: currentQuestion.questionNumber + 1,
            finishAt: ''
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

    document.onvisibilitychange = showCheatingPage

    async function OnStartButtonClick(e: FormEvent) {
        e.preventDefault()
        if (!studentAnswer.studentName.trim() || locationRequestPending.current) return
        locationRequestPending.current = true
        setRequestingLocation(true)
        setLocationError('')
        try {
            const location = await requestTestLocation()
            setStudentAnswer(previous => ({
                ...previous,
                location,
                beginningAt: convertDate(new Date())
            }))
            setDisplayState({components: [DisplayStateEnum.STARTING_COMPONENT]})
        } catch (error) {
            setLocationError(error instanceof Error ? error.message : 'Could not get your location. Please retry.')
        } finally {
            locationRequestPending.current = false
            setRequestingLocation(false)
        }
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
        if (!isDisplayed(displayState, DisplayStateEnum.QUESTION)
            && !isDisplayed(displayState, DisplayStateEnum.STARTING_COMPONENT)) return
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
        setLocationError('')
        setTriggerTimeout(false)
        setDisplayState({
            components: [DisplayStateEnum.STUDENT_NAME]
        })
        setCurrentQuestion(initialCurrentQuestion)
        setAllowance(initialAllowance)
        if (data) {
            setExaminationData(shuffleExamination(data.examination))
            setStudentAnswer({
                ...initialStudentAnswer,
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
                        <Typography variant="h2" sx={{color: "#eaeaea", textAlign: "center"}}>WHO ARE YOU?</Typography>
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
                        <Typography id="location-explanation" sx={{color: '#eaeaea', textAlign: 'center', maxWidth: 480}}>
                            📍 Taking the test from Mars? Share your location to start.
                            Saved once per attempt with your results.
                        </Typography>
                        {locationError && <Typography role="alert" sx={{color: '#ffb4ab', textAlign: 'center', maxWidth: 480}}>
                            {locationError} You cannot start the test without sharing your location.
                        </Typography>}
                        {requestingLocation && <Typography role="status" sx={{color: '#eaeaea'}}>
                            📍 Finding your test headquarters… Tap Allow in your browser!
                        </Typography>}
                        <MyButton type="submit" disabled={!studentAnswer.studentName.trim() || requestingLocation}>
                            {requestingLocation ? 'Getting location…' : locationError ? 'Retry location and start test' : 'Share location and start test'}
                        </MyButton>
                    </form>

                </>
            }
            {isDisplayed(displayState, DisplayStateEnum.STARTING_COMPONENT) && <StartingQuestion/>}
            {isDisplayed(displayState, DisplayStateEnum.QUESTION) && examinationData &&
                <>
                    <form ref={questionFormRef}
                          className={styles.QuestionLayer}
                          onSubmit={(e) => {
                              if (allowance.answer) onStudentAnswerSubmit(e)
                              else if (isDisplayed(displayState, DisplayStateEnum.KEY_BUTTON)) onKeyButtonClick(e)
                              else if (isDisplayed(displayState, DisplayStateEnum.TO_NEXT_QUESTION)) onNextButtonClick(e)
                              else e.preventDefault()
                          }}>
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
                                                       style={{minHeight: '5vh', backgroundImage: `${rightAnswerColor}`, display: 'flex', justifyContent: 'center', fontSize: isSmallPhone ? '1rem' : undefined}}
                                                       value={isDisplayed(displayState, DisplayStateEnum.ANSWERS) ? translateKey(key) : "Good try! Find another way ^^"}
                                    />
                                })}
                            </h5>
                        </div>
                        <div className={styles.AnswerSubmit}>
                            <FormControl className={styles.JoinFormControl}
                                         style={{visibility: `${setVisible(!isDisplayed(displayState, DisplayStateEnum.ANSWERS))}`}}>
                                <MyInput id="currentAnswer"
                                         backgroundImage={getAnswerColor(displayState)}
                                         value={currentQuestion.studentAnswer}
                                         autoFocus={true}
                                         autoComplete="off"
                                         onChange={(e) => handleStudentAnswerChange(e.target.value)}/>
                            </FormControl>
                            <MyButton className={styles.ButtonAnswerSubmit}
                                      variant="contained"
                                      type="submit">
                                {allowance.answer ? 'Submit'
                                    : isDisplayed(displayState, DisplayStateEnum.KEY_BUTTON) ? 'Answer' : 'Next'}
                            </MyButton>
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
                        {examinationData && <>
                            {hasPassedExamination(studentAnswer.correctAnswers, examinationData.questions.length, maximumIncorrectAnswers(examinationData)) ?
                                <div className={`${styles.PassingMessage} ${styles.SuccessMessage}`}>
                                    <span className={styles.SuccessIcon} aria-hidden="true">🎉</span>
                                    <h2 className={styles.SuccessTitle}>You passed!</h2>
                                    <p className={styles.SuccessCaption}>Your brain needs a holiday now. <span aria-hidden="true">😎</span></p>
                                </div> :
                            <div className={styles.PassingMessage}>
                                <p className={styles.PassingGoal}>Get at least <strong>{examinationData.questions.length - maximumIncorrectAnswers(examinationData)}</strong> answers right to pass.</p>
                                <p className={styles.PassingEncouragement}>Your brain can snack after! <span aria-hidden="true">🧠🍪</span></p>
                            </div>}
                        </>}
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
