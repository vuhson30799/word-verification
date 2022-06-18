import {applicationEncoding, encodingKey} from "../../constant/ApplicationConstant";

export function verifyAnswer(studentAnswer: string, keys: string[]): boolean {
    const encodedAnswer = Buffer.from(studentAnswer).toString(applicationEncoding)
    const decodedKeys = keys.map((key) => {
        const decodedKey = Buffer.from(key, applicationEncoding)
            .toString('ascii')
        return decodedKey.replace(encodingKey, '')
    })

    return decodedKeys.some(key => key === encodedAnswer)
}

export function translateKey(key: string): string {
    const decodedKey = Buffer.from(key, applicationEncoding).toString('ascii')
    return Buffer.from(decodedKey.replace(encodingKey, ''), applicationEncoding)
        .toString('ascii')
}
