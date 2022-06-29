import {decoding, emptyString, encoding} from "../../constant/ApplicationConstant";

export function verifyAnswer(studentAnswer: string, keys: string[]): boolean {
    const encodedAnswer = Buffer.from(studentAnswer.toLowerCase()).toString(encoding)
    const decodedKeys = keys.map((key) => {
        const decodedKey = Buffer.from(key, encoding)
            .toString(decoding)
        return decodedKey.replace(`${process.env.NEXT_PUBLIC_ENCODING_KEY}`, emptyString)
    })

    return decodedKeys.some(key => key === encodedAnswer)
}

export function translateKey(key: string): string {
    const decodedKey = Buffer.from(key, encoding).toString(decoding)
    return Buffer.from(decodedKey.replace(`${process.env.NEXT_PUBLIC_ENCODING_KEY}`, ''), encoding)
        .toString(decoding)
}
