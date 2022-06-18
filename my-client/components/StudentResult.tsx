import styles from '../styles/StudentResult.module.css'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';

export enum StudentResultType {
    Correct,
    Wrong
}

export function StudentResult(props: { type: StudentResultType }) {
    switch (props.type) {
        case StudentResultType.Correct:
            return (
                <div className={styles.CorrectMessage}>
                    <CheckCircleRoundedIcon />
                    <h3>Correct!!</h3>
                </div>
            )
        case StudentResultType.Wrong:
            return (
                <div className={styles.WrongMessage}>
                    <ErrorRoundedIcon />
                    <h3>Wrong!!</h3>
                </div>
            )
    }
    return (
        <>
            {
            }
        </>

    )
}
