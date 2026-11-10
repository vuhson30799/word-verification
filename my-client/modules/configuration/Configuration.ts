import {AssignHomeworkData} from "../../components/AssignHomeWorkModal";

const LOGIN_PATH = '/admin/login'

/**
 * Sends unauthenticated users on admin pages to the login page. The returned promise never settles,
 * so the calling page keeps its loading state instead of flashing an error notification.
 */
const redirectToLoginIfUnauthenticated = (response: Response): Promise<never> | undefined => {
    if (response.status !== 401 || typeof window === 'undefined') return undefined
    if (!window.location.pathname.startsWith('/admin') || window.location.pathname === LOGIN_PATH) return undefined
    window.location.replace(LOGIN_PATH)
    return new Promise<never>(() => {})
}

export const fetcher = async ([url, method]: [string, string]) => {
    const response = await fetch(url, {method})
    if (response.status === 200) return response.json()
    const redirect = redirectToLoginIfUnauthenticated(response)
    if (redirect) return redirect
    const data = await response.json()
    throw new Error(data.message)
}
export const fetcherWithForm = async ([url, method, object]: [string, string, any]) => {
    const response = await fetch(url, {
        method,
        body: JSON.stringify(object)
    })
    if (response.status === 200) return response.json()
    const redirect = redirectToLoginIfUnauthenticated(response)
    if (redirect) return redirect
    const data = await response.json()
    throw new Error(data.message)
}
export const assignHomeworkFetcher = ([url, method, assignHomeworkData]: [string, string, AssignHomeworkData]) => {
    return fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignHomeworkData)
    }).then(async res => {
        if (!res.ok) {
            const redirect = redirectToLoginIfUnauthenticated(res)
            if (redirect) return redirect
            const data = await res.json().catch(() => ({}))
            throw new Error(data.message || 'Could not assign homework. Please try again.')
        }
        return res.text()
    })
}
