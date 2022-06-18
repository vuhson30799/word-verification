import {useEffect, useState} from "react";
import styles from "../styles/StartingQuestion.module.css"

export interface StartingQuestionProps {
    title: string
    timeout: number
    displayAfter: number
}

export default function StartingQuestion(props: StartingQuestionProps) {
    const [open, setOpen] = useState<boolean>(false)

    useEffect(() => {
        setTimeout(() => setOpen(true), props.displayAfter)
        setTimeout(() => setOpen(false), props.displayAfter + props.timeout)
    }, [])
    return ( open ?
        <>
            <div className={styles.StartingQuestionTitle}>
                {props.title}
            </div>
        </>
            : null
    )
}
