import React, {ChangeEvent, useState} from "react";
import {ExaminationData} from "./examination";
import {Admin} from "../../layout/Admin";
import styles from "../../styles/Quiz.module.css"
import MyFileUpload from "../../components/MyFileUpload";
import {fetcherWithForm} from "../../modules/configuration/Configuration";
import {useRouter} from "next/router";
import {MySpinner} from "../../components/MySpinner";
import MyToast from "../../components/MyToast";
import {convertDate} from "../../modules/utils/dateUtils";
import {extractQuestionsFromExcel} from "../../modules/utils/excelService";
import useSWRImmutable from "swr/immutable";

import {defaultMaximumIncorrectAnswers, isValidMaximumIncorrectAnswers} from "../../modules/utils/examinationPassing";

const GRADES = [10, 11, 12]

type ExaminationErrors = Partial<Record<'title' | 'grade' | 'createdDate' | 'questions' | 'maximumIncorrectAnswers', string>>

function validateExamination(examination: ExaminationData, file: File | undefined): ExaminationErrors {
    const errors: ExaminationErrors = {}
    if (!examination.title.trim()) errors.title = 'Title is required.'
    if (!GRADES.includes(examination.grade)) errors.grade = 'Grade is required.'
    if (!examination.createdDate || isNaN(Date.parse(examination.createdDate))) {
        errors.createdDate = 'Created date is required.'
    }
    if (!file) {
        errors.questions = 'Upload a question file.'
    } else if (examination.questions.length === 0) {
        errors.questions = 'The uploaded file contains no questions.'
    }
    if (!isValidMaximumIncorrectAnswers(examination.maximumIncorrectAnswers, examination.questions.length)) {
        errors.maximumIncorrectAnswers = `Enter a whole number from 0 to ${examination.questions.length}.`
    }
    return errors
}

function FieldError({message}: { message?: string }) {
    return message ? <span className={styles.errorText} role="alert">{message}</span> : null
}

export default function Quiz() {
    const [examination, setExamination] = useState<ExaminationData>({
        id: "",
        questions: [],
        maximumIncorrectAnswers: 0,
        title: "",
        createdDate: convertDate(new Date()),
        creator: "Phuong Lien",
        grade: 10
    })
    const [file, setFile] = useState<File | undefined>(undefined)
    const [submit, setSubmit] = useState<boolean>(false)
    const [showErrors, setShowErrors] = useState<boolean>(false)
    const errors: ExaminationErrors = showErrors ? validateExamination(examination, file) : {}
    const router = useRouter()
    const {data, error} = useSWRImmutable(submit ? ['/api/exams', 'post', examination] : null, fetcherWithForm)
    if (error) return <MyToast message={error.message} severity={"error"} />
    if (submit && !data) return <MySpinner/>

    if (submit && data) {
        router.push('/admin/examination')
            .then(() => console.log('redirect to view examinations'))
        setSubmit(false)
    }


    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        const selected = e.target.files[0]
        setFile(selected)
        extractQuestionsFromExcel(selected)
            .then(questions => setExamination(current => ({...current, questions, maximumIncorrectAnswers: defaultMaximumIncorrectAnswers(questions.length)})))
            .catch(() => setExamination(current => ({...current, questions: []})))
    }

    function handleChange(fieldName: string, value: string) {
        switch (fieldName) {
            case "title":
                setExamination({
                    ...examination,
                    title: value
                })
                break
            case "creator":
                setExamination({
                    ...examination,
                    creator: value
                })
                break
            case "grade":
                setExamination({
                    ...examination,
                    grade: Number(value)
                })
                break
            default:
                throw new Error(`Unknown field: ${fieldName}`)
        }
    }

    function handleDateChange(value: string) {
        setExamination({
            ...examination,
            createdDate: value ? `${value}:00` : ''
        })
    }

    function handleSubmitForm() {
        setShowErrors(true)
        if (Object.keys(validateExamination(examination, file)).length > 0) return
        setSubmit(true)
    }

    function handleCancel() {
        router.push('/admin/examination')
            .then(() => console.log('redirect to view examinations'))
    }

    return (
        <Admin>
            <div className={styles.page}>
                <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <h1 className={styles.title}>Create a new exam</h1>
                        <span className={styles.subtitle}>Set the basics, then upload your question bank.</span>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="title">Title</label>
                        <input
                            id="title"
                            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                            aria-invalid={!!errors.title}
                            placeholder="e.g. Unit 6 — Phrasal Verbs"
                            value={examination.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                        />
                        <FieldError message={errors.title}/>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <span className={styles.label} id="grade-label">Grade</span>
                            <div className={styles.segmented} role="radiogroup" aria-labelledby="grade-label">
                                {GRADES.map(grade => (
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={examination.grade === grade}
                                        key={grade}
                                        className={`${styles.segment} ${examination.grade === grade ? styles.segmentActive : ''}`}
                                        onClick={() => handleChange("grade", `${grade}`)}>
                                        {grade}
                                    </button>
                                ))}
                            </div>
                            <FieldError message={errors.grade}/>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="createdDate">Created date</label>
                            <input
                                id="createdDate"
                                type="datetime-local"
                                className={`${styles.input} ${errors.createdDate ? styles.inputError : ''}`}
                                aria-invalid={!!errors.createdDate}
                                value={examination.createdDate.slice(0, 16)}
                                onChange={(e) => handleDateChange(e.target.value)}
                            />
                            <FieldError message={errors.createdDate}/>
                        </div>
                    </div>

                    <div className={styles.divider}/>

                    <div className={styles.uploadSection}>
                        <div className={styles.uploadHint}>
                            Add questions by uploading a filled-in spreadsheet — download the{' '}
                            <a className={styles.templateLink} href="/template.xlsx">question template</a>
                            {' '}first if you don&apos;t have one.
                        </div>
                        <MyFileUpload file={file}
                                      handleFileChange={handleFileChange}
                                      accept=".xlsx"
                                      hint=".xlsx up to 5MB"
                                      invalid={!!errors.questions}/>
                        <FieldError message={errors.questions}/>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="maximumIncorrectAnswers">Maximum incorrect answers allowed</label>
                        <input id="maximumIncorrectAnswers" type="number" min={0} max={examination.questions.length} step={1}
                               className={`${styles.input} ${errors.maximumIncorrectAnswers ? styles.inputError : ''}`}
                               aria-invalid={!!errors.maximumIncorrectAnswers}
                               value={Number.isNaN(examination.maximumIncorrectAnswers) ? '' : examination.maximumIncorrectAnswers}
                               onChange={event => setExamination(current => ({...current, maximumIncorrectAnswers: event.target.value === '' ? NaN : Number(event.target.value)}))}/>
                        <span>Out of {examination.questions.length} questions. Each upload defaults to 10%, rounded down.</span>
                        <FieldError message={errors.maximumIncorrectAnswers}/>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelButton} onClick={handleCancel}>
                            Cancel
                        </button>
                        <button type="button" className={styles.submitButton} onClick={handleSubmitForm}>
                            Create exam
                        </button>
                    </div>
                </form>
            </div>
        </Admin>
    )
}
