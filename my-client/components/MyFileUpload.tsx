import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import styles from "../styles/MyFileUpload.module.css"
import {ChangeEvent, DragEvent, useId, useState} from "react";

export interface MyFileUploadProps {
    file: File | undefined,
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
    accept?: string
    hint?: string
    invalid?: boolean
    disabled?: boolean
}

export default function MyFileUpload(props: MyFileUploadProps) {
    const inputId = useId()
    const [dragging, setDragging] = useState(false)

    function handleDrop(e: DragEvent<HTMLLabelElement>) {
        e.preventDefault()
        setDragging(false)
        if (props.disabled || e.dataTransfer.files.length === 0) return
        props.handleFileChange({target: {files: e.dataTransfer.files}} as ChangeEvent<HTMLInputElement>)
    }

    return (
        <label htmlFor={inputId}
               className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ''} ${props.invalid ? styles.dropzoneInvalid : ''} ${props.disabled ? styles.dropzoneDisabled : ''}`}
               onDragOver={(e) => {
                   e.preventDefault()
                   if (!props.disabled) setDragging(true)
               }}
               onDragLeave={() => setDragging(false)}
               onDrop={handleDrop}>
            <input accept={props.accept ?? "*"}
                   id={inputId}
                   type="file"
                   onChange={(event) => {
                       props.handleFileChange(event)
                       event.currentTarget.value = ''
                   }}
                   disabled={props.disabled}
                   aria-invalid={props.invalid}
                   className={styles.fileInput}
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
