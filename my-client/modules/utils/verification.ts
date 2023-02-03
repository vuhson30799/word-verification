import {decoding, emptyString, encoding} from "../../constant/ApplicationConstant";

export function verifyAnswer(studentAnswer: string, keys?: string[]): boolean {
    if (!keys) return false
    const decodedKeys = keys.map((key) => {
        const decodedKey = Buffer.from(key, encoding)
            .toString(decoding).replace(`${process.env.NEXT_PUBLIC_ENCODING_KEY}`, emptyString)
        return Buffer.from(decodedKey, encoding).toString(decoding)
    })

    return decodedKeys.some(key => preTransform(key) === preTransform(studentAnswer))
}

export function translateKey(key: string): string {
    const decodedKey = Buffer.from(key, encoding).toString(decoding)
    return Buffer.from(decodedKey.replace(`${process.env.NEXT_PUBLIC_ENCODING_KEY}`, emptyString), encoding)
        .toString(decoding)
}

function preTransform(input: string): string {
    // replace all special characters, spaces and lower case input.
    // do not trim due to some trick of students on their phone.
    return input.replace(/[^a-zA-Z\s]/g, emptyString)
        .toLowerCase()
}
