import * as React from 'react';
import {HTMLProps, useEffect, useState} from 'react';
import LinearProgress, {LinearProgressProps} from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function LinearProgressWithLabel(props: LinearProgressProps & { display: number }) {
    return (
        <Box sx={{display: 'flex', alignItems: 'center'}}>
            <Box sx={{width: '94vw', mr: 1, margin: '0 1vw 0 1vw'}}>
                <LinearProgress variant="determinate" {...props} />
            </Box>
            <Box sx={{minWidth: '4vw'}}>
                <Typography variant="body2" color="white">{`${props.display}s`}</Typography>
            </Box>
        </Box>
    );
}

export default function ProgressQuestionBar(props: HTMLProps<any> & { timeout: number, handleTimeout: any }) {
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
    }, []);


    return (
        <>
            { !!props.timeout && progress >= 0 ?
                <Box sx={{width: '100vw'}}>
                    <LinearProgressWithLabel value={progress}
                                             display={displayProgress}/>
                </Box>
                : undefined
            }
        </>
    );
}
