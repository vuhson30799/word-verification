import {SWRConfiguration} from "swr/dist/types";


export function getSWRConfiguration(url: string, method: string): SWRConfiguration {
    return {
        onError: (error: any) => {
            if (error.status !== 403 && error.status !== 404) {
                // toast will be used when applying redux
                console.log("request got error: " + error.message)
            }
        },
        onSuccess: () => {
            console.log("request is triggered successfully.")
        },
        fetcher: () => fetch(url, {method}).then(res => res.json())
    }
}
