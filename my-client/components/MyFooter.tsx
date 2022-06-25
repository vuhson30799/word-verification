import styles from "../styles/MyFooter.module.css";
import Typography from "@mui/material/Typography";
import * as React from "react";

export function MyFooter() {
    return (
        <div className={styles.myFooter}>
            <Typography variant="h6" noWrap component="div" fontFamily={"Arial, sans-serif"}>
                ® SHVU - Phương Liên ®
            </Typography>
        </div>
    )
}
