import {AssignHomeworkData} from "../../components/AssignHomeWorkModal";

export const fetcher = (url: string, method: string) => fetch(url, {method})
    .then(res => res.json())
export const fetcherWithForm = (url: string, method: string, object: any) => {
    return fetch(url, {
        method,
        body: JSON.stringify(object)
    }).then(res => res.json())
}
export const assignHomeworkFetcher = (url: string, method: string, assignHomeworkData: AssignHomeworkData) => {
    return fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignHomeworkData)
    }).then(res => res.text())
}
