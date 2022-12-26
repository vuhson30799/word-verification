import styles from "../styles/StartingQuestion.module.css"
import {MyCircularProgress} from "./MyCircularProgress";

export default function StartingQuestion() {
    return (
        <div className={styles.StartingQuestionTitle}>
            <MyCircularProgress
                finishStatement="Go!!!"
                timeout={4}
                size={15}
            />
        </div>
    )
}
