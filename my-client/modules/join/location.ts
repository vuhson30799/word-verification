export interface TestLocation {
    latitude: number
    longitude: number
    accuracyMeters: number
    capturedAt: string
}

export function requestTestLocation(): Promise<TestLocation> {
    return new Promise((resolve, reject) => {
        if (!window.isSecureContext) {
            reject(new Error('Location requires a secure connection. Please open this test using HTTPS.'))
            return
        }
        if (!navigator.geolocation) {
            reject(new Error('This browser does not support location sharing. Please use a browser with location support.'))
            return
        }
        navigator.geolocation.getCurrentPosition(
            ({coords, timestamp}) => resolve({
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracyMeters: coords.accuracy,
                capturedAt: new Date(timestamp).toISOString()
            }),
            (error) => reject(Object.assign(new Error(error.code === 1
                ? 'Location access is blocked. Allow location for this site in your browser settings, then retry.'
                : error.code === 3
                    ? 'Location request timed out. Check that device location is enabled, then retry.'
                    : 'Your location is unavailable. Enable device location services and check your connection, then retry.'), {code: error.code})),
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 0}
        )
    })
}
