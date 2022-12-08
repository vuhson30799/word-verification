import * as React from 'react';
import {ComponentProps, useEffect, useState} from 'react';
import LinearProgress, {LinearProgressProps} from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import {MyCircularProgress} from "./MyCircularProgress";
import {timeBetweenStartingComponents} from "../constant/ApplicationConstant";

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
        <Box sx={{display: 'flex', alignItems: 'center'}}>
            <Box sx={{width: '91vw', mr: 1, margin: '0 1vw 0 1vw'}}>
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
                    timeout={timeBetweenStartingComponents}
                                    duration={props.timeout}
                                    size={3}/>
            </Box>
        </Box>
    );
}

export default function ProgressQuestionBar(props: ProgressQuestionBarProps) {
    const [progress, setProgress] = useState(100);
    const [displayProgress, setDisplayProgress] = useState(props.timeout);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((preProgress) => preProgress - (100 / props.timeout));
            setDisplayProgress((prevState => {
                if (prevState == 0) {
                    props.handleTimeout(new CustomEvent('TimeoutEvent'))
                }
                return prevState - 1
            }))
        }, 1000)
        return () => clearInterval(timer)
    }, [props.timeout, props.handleTimeout, props]);


    return <>
        { (!!props.timeout && progress >= 0) &&
            <Box sx={{width: '100vw'}}>
                <LinearProgressWithLabel timeout={props.timeout}
                                         value={progress}
                                         display={displayProgress}/>
            </Box>
        }
    </>;
}
