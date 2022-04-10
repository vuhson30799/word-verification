import {ExaminationData} from "../../pages/admin/examination";

export const fetcher = (url: string, method: string) => fetch(url, {method}).then(res => res.json())
export const fetcherWithForm = (url: string, method: string, examination: ExaminationData, file: File) => {
    const body = new FormData()
    body.append('file', file)
    body.append('title', examination.title)
    body.append('grade', examination.grade.toString())
    body.append('createdDate', examination.createdDate)
    body.append('creator', examination.creator)
    return fetch(url, {
        method,
        body
    }).then(res => res.ok)
}
