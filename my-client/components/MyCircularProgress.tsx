import {CircularProgress} from "@mui/material";
import {useCallback, useState} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useInterval} from "usehooks-ts";
import {DefaultGradient} from "../constant/DefaultGradient";
import {defaultGradientId} from "../constant/ApplicationConstant";

interface CircularProgressProps {
    timeout: number
    duration: number
    size: number
    onfinish?: () => void
}

export function MyCircularProgress(props: CircularProgressProps) {
    const [progress, setProgress] = useState(100);
    const [value, setValue] = useState(props.duration);

    const updateProgress = useCallback(() => {
        const reducedProgress = 100 * props.timeout / (props.duration * 1000);
        setProgress((prevProgress) => (prevProgress - reducedProgress >= 0 ? prevProgress - reducedProgress : 100));
        setValue(prevState => prevState - 1 >= 0 ? prevState - 1 : props.duration)
    }, [props.timeout, props.duration])

    if (value == 0 && props.onfinish) {
        props.onfinish()
    }

    useInterval(updateProgress, value == 0 ? null : props.timeout)

    return <>
        <Box sx={{position: 'relative', display: 'inline-flex'}}>
            <CircularProgress variant="determinate"
                              value={progress} size={`${props.size}rem`}
                              sx={{'& .MuiCircularProgress-circle': {stroke: `url(#${defaultGradientId})`}}}
            />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant="h3"
                    component="div"
                    color="#FFFFFF"
                >{value == 0 ? "Go!!" : value}</Typography>
            </Box>
        </Box>
        <DefaultGradient />
    </>
}
