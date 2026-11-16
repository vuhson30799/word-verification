import {Button} from "@mui/material";
import {ComponentProps} from "react";

interface MyButtonProps extends ComponentProps<"button"> {
    variant?: "text" | "outlined" | "contained"
    [key: string]: any
}

const defaultButtonProps: MyButtonProps = {
    color: "#eaeaea !important",
    fontFamily: "Arial, sans-serif",
    backgroundClip: "padding-box",
    backgroundImage: "linear-gradient(to right top, #E05178, #B541E2)",
    borderRadius: "20px",
    minWidth: "10vw",
    variant: "contained"
}

export function MyButton(props: MyButtonProps) {
    return <Button
        sx={{
            color: props.color || defaultButtonProps.color,
            fontFamily: props.fontFamily || defaultButtonProps.fontFamily,
            backgroundClip: props.backgroundClip || defaultButtonProps.backgroundClip,
            backgroundImage: props.backgroundImage || defaultButtonProps.backgroundImage,
            borderRadius: props.borderRadius || defaultButtonProps.borderRadius,
            minWidth: props.minWidth || defaultButtonProps.minWidth,
            '&.Mui-disabled': {
                backgroundImage: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                color: 'rgba(255, 255, 255, 0.4) !important'
            }
        }}
        className={props.className}
        variant={props.variant || defaultButtonProps.variant}
        type={props.type ?? "button"}
        disabled={props.disabled}
        onClick={props.onClick} style={props.style}>
        {props.children}
    </Button>
}
