import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import styles from "../styles/MyFileUpload.module.css"
import {ChangeEvent, DragEvent, useState} from "react";

export interface MyFileUploadProps {
    file: File | undefined,
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
    accept?: string
    hint?: string
    invalid?: boolean
}

export default function MyFileUpload(props: MyFileUploadProps) {
    const [dragging, setDragging] = useState(false)

    function handleDrop(e: DragEvent<HTMLLabelElement>) {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files.length === 0) return
        props.handleFileChange({target: {files: e.dataTransfer.files}} as ChangeEvent<HTMLInputElement>)
    }

    return (
        <label htmlFor="file"
               className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''} ${props.invalid ? styles.dropzoneInvalid : ''}`}
               onDragOver={(e) => {
                   e.preventDefault()
                   setDragging(true)
               }}
               onDragLeave={() => setDragging(false)}
               onDrop={handleDrop}>
            <input accept={props.accept ?? "*"}
                   id="file"
                   type="file"
                   onChange={props.handleFileChange}
                   hidden={true}
            />
            <div className={styles.iconBox}>
                <UploadFileOutlinedIcon fontSize="small"/>
            </div>
            <div className={styles.primaryText}>
                {props.file ? props.file.name : <>
                    <span className={styles.desktopPrompt}>Drag your file here, or click to upload</span>
                    <span className={styles.mobilePrompt}>Tap to upload file</span>
                </>}
            </div>
            <div className={styles.secondaryText}>
                {props.file ? 'Click to choose a different file' : props.hint}
            </div>
        </label>
    )
}
