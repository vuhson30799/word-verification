import * as React from 'react';
import {ComponentProps, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import LinearProgress, {LinearProgressProps} from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import {MyCircularProgress} from "./MyCircularProgress";
import {TimeoutContext} from "../modules/join/context";
import {useInterval} from "usehooks-ts";

export interface ProgressQuestionBarProps extends ComponentProps<any> {
    timeout: number
    handleTimeout: any
}

interface LinearProgressWithLabelProps extends LinearProgressProps {
    timeout: number
    display: number
}

function LinearProgressWithLabel(props: LinearProgressWithLabelProps) {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', paddingLeft: '15vw'}}>
            <Box sx={{width: '60vw', mr: 1, margin: '0 1vw 0 1vw'}}>
                <LinearProgress
                    sx={{
                        height: "10px",
                        backgroundColor: "#2D2237",
                        borderRadius: "20px",
                        "& .MuiLinearProgress-bar": {
                            borderRadius: "20px",
                            backgroundClip: "padding-box",
                            backgroundImage: "linear-gradient(to right top, #E05178, #B541E2)",
                        }
                    }}
                    variant="determinate" {...props} />
            </Box>
            <Box sx={{
                minWidth: '4vw'
            }}>
                <MyCircularProgress
                    circleSize={6}
                    finishStatement="0"
                    fontSize="body1"
                    timeout={props.timeout}
                    size={3}/>
            </Box>
        </Box>
    );
}

export default function ProgressQuestionBar(props: ProgressQuestionBarProps) {
    const [progress, setProgress] = useState(100);
    const [displayProgress, setDisplayProgress] = useState(props.timeout);
    const triggerTimeout = useContext(TimeoutContext)

    const updateProgress = useCallback(() => {
        const reducedProgress = 100 / props.timeout;
        setProgress((prevProgress) => (prevProgress - reducedProgress >= 0 ? prevProgress - reducedProgress : 100));
        setDisplayProgress(prevState => {
            return prevState - 1
        })
    }, [props])

    const calculateDelay = useMemo(() => {
        if (displayProgress == 0 || triggerTimeout) {
            props.handleTimeout(new CustomEvent('TimeoutEvent'))
            return null
        }
        return 1000
    }, [displayProgress, triggerTimeout, props])

    useInterval(updateProgress, calculateDelay)

    useEffect(() => {
        setDisplayProgress(props.timeout)
        if (triggerTimeout) {
            setProgress(100)
        }
    }, [props.timeout, triggerTimeout])


    return <Box sx={{width: '100vw'}} {...props}>
        <LinearProgressWithLabel timeout={props.timeout}
                                 value={progress}
                                 display={displayProgress}/>
    </Box>;
}
