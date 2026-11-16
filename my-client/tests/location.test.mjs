import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import ts from 'typescript'

function loadLocation({secure = true, geolocation} = {}) {
    const source = readFileSync(new URL('../modules/join/location.ts', import.meta.url), 'utf8')
    const code = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}}).outputText
    const compiled = {exports: {}}
    new Function('module', 'exports', 'window', 'navigator', code)(
        compiled, compiled.exports, {isSecureContext: secure}, {geolocation})
    return compiled.exports.requestTestLocation
}

test('waits for coordinates and requests a fresh location for each attempt', async () => {
    const callbacks = []
    const request = loadLocation({geolocation: {
        getCurrentPosition(success, failure, options) {
            assert.equal(options.maximumAge, 0)
            assert.equal(options.timeout, 15000)
            callbacks.push(success)
        }
    }})
    let received = false
    const first = request().then(location => {received = true; return location})
    await Promise.resolve()
    assert.equal(received, false)
    const position = {coords: {latitude: 10, longitude: 106, accuracy: 25}, timestamp: 1700000000000}
    callbacks[0](position)
    assert.deepEqual(await first, {
        latitude: 10, longitude: 106, accuracyMeters: 25,
        capturedAt: new Date(position.timestamp).toISOString()
    })
    const second = request()
    assert.equal(callbacks.length, 2)
    callbacks[1](position)
    await second
})

for (const [code, message] of [[1, /browser settings/], [2, /unavailable/], [3, /timed out/]]) {
    test(`location error ${code} blocks access and allows a new request`, async () => {
        let calls = 0
        const request = loadLocation({geolocation: {
            getCurrentPosition(success, failure) {calls++; failure({code})}
        }})
        await assert.rejects(request(), message)
        await assert.rejects(request(), message)
        assert.equal(calls, 2)
    })
}

test('unsupported browsers and insecure connections return actionable errors', async () => {
    await assert.rejects(loadLocation()(), /does not support/)
    await assert.rejects(loadLocation({secure: false})(), /HTTPS/)
})
