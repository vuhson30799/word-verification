import {decoding, emptyString, encoding} from "../../constant/ApplicationConstant";

export function verifyAnswer(studentAnswer: string, keys: string[]): boolean {
    const decodedKeys = keys.map((key) => {
        const decodedKey = Buffer.from(key, encoding)
            .toString(decoding).replace(`${process.env.NEXT_PUBLIC_ENCODING_KEY}`, emptyString)
        return Buffer.from(decodedKey, encoding).toString(decoding)
    })

    return decodedKeys.some(key => escapeSpecialCharacter(key) === escapeSpecialCharacter(studentAnswer.toLowerCase()))
}

export function translateKey(key: string): string {
    const decodedKey = Buffer.from(key, encoding).toString(decoding)
    return Buffer.from(decodedKey.replace(`${process.env.NEXT_PUBLIC_ENCODING_KEY}`, emptyString), encoding)
        .toString(decoding)
}

function escapeSpecialCharacter(input: string): string {
    return input.replace(/[^a-zA-Z ]/g, "")
}
