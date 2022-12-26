import {OutlinedInput} from "@mui/material";
import React, {ComponentProps} from "react";

interface MyInputProps extends ComponentProps<"input"> {
    [key: string]: any
}

const defaultInputProps: MyInputProps = {
    color: "#eaeaea !important",
    fontFamily: "Arial, sans-serif",
    backgroundClip: "padding-box",
    border: "3px solid transparent",
    backgroundImage: "linear-gradient(to right top, #38253D, #1C1E2E)",
    borderRadius: "40px",
    position: "relative",
    minWidth: "40vw",
    textAlign: "start",
    '&::before': {
        content: '""',
        margin: "-3px",
        backgroundImage: "linear-gradient(to right top, #E05178, #B541E2)",
        borderRadius: "inherit",
        inset: 0,
        zIndex: "-1",
        position: "absolute",
        minWidth: "40vw",
    },
    '& .MuiOutlinedInput-notchedOutline': {
        border: "0"
    }
}

export default function MyInput(props: MyInputProps) {
    return (
        <OutlinedInput
            sx={{
                color: props.color || defaultInputProps.color,
                textAlign: props.textAlign || defaultInputProps.textAlign,
                fontFamily: props.fontFamily || defaultInputProps.fontFamily,
                backgroundClip: props.backgroundClip || defaultInputProps.backgroundClip,
                border: props.border || defaultInputProps.border,
                backgroundImage: props.backgroundImage || defaultInputProps.backgroundImage,
                borderRadius: props.borderRadius || defaultInputProps.borderRadius,
                position: props.position || defaultInputProps.position,
                minWidth: props.minWidth || defaultInputProps.minWidth,
                minHeight: props.minHeight,
                maxWidth: props.maxWidth,
                fontSize: props.fontSize,
                '&::before': {
                    ...props['&::before'] || defaultInputProps['&::before'],
                    minWidth: props.minWidth || defaultInputProps['&::before'].minWidth
                },
                '& .MuiOutlinedInput-notchedOutline': props['& .MuiOutlinedInput-notchedOutline'] || defaultInputProps['& .MuiOutlinedInput-notchedOutline']
            }}
            id={props.id}
            value={props.value}
            placeholder={props.placeholder}
            autoComplete="off"
            onChange={props.onChange}
            readOnly={props.readOnly}
        />
    )
}
