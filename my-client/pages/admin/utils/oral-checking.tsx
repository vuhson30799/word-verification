import {Admin} from "../../../layout/Admin";
import Box from "@mui/material/Box";
import styles from "./OralChecking.module.css";
import {Button, TextareaAutosize} from "@mui/material";
import React, {useCallback, useState} from "react";
import {shuffle} from "lodash";

export default function OralChecking() {
    const [input, setInput] = useState<string>('')
    const [outputSize, setOutputSize] = useState<number>(1)

    const shuffleWords = useCallback(() => {
        const shuffledWords = shuffle(input.split("\n")).join("\n")
        setInput(shuffledWords)
    }, [input])

    const handleZoomingWord = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.metaKey || e.ctrlKey && e.key == '=' || e.key == '-') {
            e.preventDefault()
            switch (e.key) {
                case '=':
                    setOutputSize(pre => pre + 0.25)
                    break
                case '-':
                    setOutputSize(pre => pre - 0.25)
                    break
            }
        }
    }, [])

    return (
        <Admin>
            <Box className={styles.OralCheckingContainer}>
                <Box>
                    <TextareaAutosize className={styles.InputOralChecking}
                                      aria-label="maximum height"
                                      placeholder="Input"
                                      onChange={(e) => setInput(e.target.value)}
                    />
                </Box>
                <Button variant="contained"
                        className={styles.ShuffleButton}
                        onClick={shuffleWords}>
                    Shuffle
                </Button>
                {input.length > 0 &&
                    <Box>
                        <TextareaAutosize className={styles.OutputOralChecking}
                                          style={{fontSize: `${outputSize}rem`}}
                                          aria-label="maximum height"
                                          placeholder="result after shuffling..."
                                          readOnly
                                          onKeyDown={(e) => handleZoomingWord(e)}
                                          value={input}
                        />
                    </Box>
                }
            </Box>
        </Admin>
    )
}
