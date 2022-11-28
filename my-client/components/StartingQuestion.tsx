import styles from "../styles/StartingQuestion.module.css"
import {MyCircularProgress} from "./MyCircularProgress";
import {timeBetweenStartingComponents} from "../constant/ApplicationConstant";

export default function StartingQuestion() {
    return (
        <div className={styles.StartingQuestionTitle}>
            <MyCircularProgress
                finishStatement="Go!!!"
                timeout={timeBetweenStartingComponents}
                duration={4}
                size={15}
            />
        </div>
    )
}
