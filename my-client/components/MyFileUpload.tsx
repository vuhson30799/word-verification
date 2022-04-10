import {Button} from "@mui/material";
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import styles from "../styles/MyFileUpload.module.css"
import {ChangeEvent} from "react";

export interface MyFileUploadProps {
    file: File | undefined,
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export default function MyFileUpload(props: MyFileUploadProps) {
    return (
        <>
            <label htmlFor="file">
                <input accept="*"
                       id="file"
                       type="file"
                       onChange={props.handleFileChange}
                       hidden={true}
                />
                {!props.file ?
                    <Button variant="outlined" component="div" className={styles.ButtonUpload}>
                        <div><CloudUploadOutlinedIcon className={styles.CloudUpload}/></div>
                        <div>Click to upload file</div>
                    </Button>
                    : undefined
                }
                {!!props.file ?
                    <div>{props.file.name}</div>
                    : undefined
                }

            </label>
        </>
    )
}
