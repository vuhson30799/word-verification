import {CircularProgress} from "@mui/material";
import {useCallback, useState} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useInterval} from "usehooks-ts";
import {DefaultGradient} from "../constant/DefaultGradient";
import {defaultGradientId} from "../constant/ApplicationConstant";
import {OverridableStringUnion} from "@mui/types";
import {Variant} from "@mui/material/styles/createTypography";
import {TypographyPropsVariantOverrides} from "@mui/material/Typography/Typography";

interface CircularProgressProps {
    /**
     * Finish statement when it counts to zero.
     */
    finishStatement: string
    /**
     * Size of the circle
     */
    timeout: number
    /**
     * Size of the circle
     */
    duration: number
    /**
     * Size of the component.
     */
    size: number
    /**
     * Size of the circle.
     */
    circleSize?: number
    /**
     * Size of the number in circle.
     */
    fontSize?: OverridableStringUnion<Variant | 'inherit', TypographyPropsVariantOverrides>
    /**
     * Function to trigger when finish counting.
     */
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
                              sx={{
                                  '& .MuiCircularProgress-circle': {
                                      strokeWidth: `${props.circleSize || '3px'}`,
                                      stroke: `url(#${defaultGradientId})`
                                  },
                                  '& .MuiCircularProgress-svg': {
                                      overflow: 'visible'
                                  }
            }}
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
                    variant={props.fontSize || "h3"}
                    component="div"
                    color="#FFFFFF"
                >{value == 0 ? props.finishStatement : value}</Typography>
            </Box>
        </Box>
        <DefaultGradient />
    </>
}
