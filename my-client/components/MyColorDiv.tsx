import Box from "@mui/material/Box";
import {ComponentProps} from "react";

export interface MyColorProps extends ComponentProps<"div">{
    value?: string
}

const defaultInputProps = {
    color: "#eaeaea !important",
    fontFamily: "Arial, sans-serif",
    backgroundClip: "padding-box",
    border: "3px solid transparent",
    backgroundImage: "linear-gradient(to right top, #38253D, #1C1E2E)",
    borderRadius: "25px",
    position: "relative",
    minWidth: "30vw",
    textAlign: "justify",
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    margin: "0 10px",
    userSelect: "none",
    '&::before': {
        content: '""',
        margin: "-3px",
        backgroundImage: "linear-gradient(to right top, #E05178, #B541E2)",
        borderRadius: "inherit",
        inset: 0,
        zIndex: "-1",
        position: "absolute",
        minWidth: "30vw",
    }
}
export default function MyColorDiv(props: MyColorProps) {
    return (
        <Box sx={defaultInputProps} style={props.style}>{props.value}{props.children}</Box>
    )
}
