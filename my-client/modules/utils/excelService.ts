import {Question} from "../../pages/admin/examination";
import {readSheet} from "read-excel-file/browser";
import {emptyString} from "../../constant/ApplicationConstant";

export function extractQuestionsFromExcel(file: File): Promise<Question[]> {
    return readSheet(file).then((rows) => {
        let questions: Question[] = []
        rows.forEach((row, index) => {
            if (index >= 2) {
                const title = <string>row[0]
                const questionType = <string>row[1]
                const timeout = <number>row[8]
                let keys: string[] = []
                row.filter((row, index) => index >= 2 && index <= 6)
                    .forEach((cell) => {
                        if (!!cell && cell !== emptyString) keys.push(<string>cell)
                    })
                questions.push({title, questionType, keys, timeout})
            }
        })
        return questions
    })

}
