import {AssignHomeworkData} from "../../components/AssignHomeWorkModal";

export const fetcher = async (url: string, method: string) => {
    const response = await fetch(url, {method})
    if (response.status === 200) return response.json()
    const data = await response.json()
    throw new Error(data.message)
}
export const fetcherWithForm = async (url: string, method: string, object: any) => {
    const response = await fetch(url, {
        method,
        body: JSON.stringify(object)
    })
    if (response.status === 200) return response.json()
    const data = await response.json()
    throw new Error(data.message)
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
