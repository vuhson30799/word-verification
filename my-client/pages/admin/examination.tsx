import useSWR from "swr";
import {Admin} from "../../layout/Admin";
import styles from "../../styles/Examination.module.css"
import {getSWRConfiguration} from "../../modules/configuration/Configuration";

interface Question {
    title: string
    keys: string[]
    timeout: number
    questionType: string
}

export interface ExaminationData {
    id: string
    title: string
    questions: Question[]
    createdDate: string
    grade: number
    creator: string
}

function Examination() {
    const {data: examinations} = useSWR<ExaminationData[]>('/exams', getSWRConfiguration('http://localhost:8080/exams', 'get'))
    return (
        !!examinations ? <Admin>
            <div className={styles.Examination}>
                {
                    examinations.map((examination, key) => {
                        return (
                            <div key={key}>
                                {examination.creator}
                            </div>
                        )
                    })
                }
            </div>
        </Admin> : <div>Loading page...</div>
    )
}

export default Examination;
