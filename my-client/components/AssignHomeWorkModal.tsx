import {Button, Grid, Modal} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MyDateTimePicker from "./MyDateTimePicker";
import {useState} from "react";
import {convertDate} from "../modules/utils/dateUtils";
import {assignHomeworkFetcher} from "../modules/configuration/Configuration";
import {MySpinner} from "./MySpinner";
import MyToast from "./MyToast";
import styles from "../styles/AssignHomeworkModal.module.css"
import AssignmentIcon from '@mui/icons-material/Assignment';
import useSWRImmutable from "swr/immutable";

export interface AssignHomeworkModalProps {
    title: string
    examinationId: string
    onChange: any
}

export interface AssignHomeworkData {
    beginningDate: string
    deadlineDate: string
}

export default function AssignHomeworkModal(props: AssignHomeworkModalProps) {
    const now = new Date()
    const [assignHomeworkData, setAssignHomeworkData] = useState<AssignHomeworkData>({
        beginningDate: convertDate(now),
        deadlineDate: convertDate(now)
    })
    const [open, setOpen] = useState<boolean>(false)
    const [submit, setSubmit] = useState<boolean>(false)
    const { data, error } = useSWRImmutable<string>(submit ? [`/api/exams/${props.examinationId}`, 'post', assignHomeworkData] : null, assignHomeworkFetcher)
    if (submit && data) {
        props.onChange(data)
        setSubmit(false)
        setOpen(false)
    }
    function handleBeginningDateChange(date: Date | null) {
        setAssignHomeworkData({
            ...assignHomeworkData,
            beginningDate: date ? convertDate(date) : ''
        })
    }

    function handleDeadlineDateChange(date: Date | null) {
        setAssignHomeworkData({
            ...assignHomeworkData,
            deadlineDate: date ? convertDate(date) : ''
        })
    }

    return (
        <div className={styles.AssignHomework}>
            <Button variant="contained" endIcon={<AssignmentIcon/>}
                    onClick={() => setOpen(true)}>
                {props.title}
            </Button>
            <Modal
                open={open}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                onClose={() => setOpen(false)}
            >
                <Box className={styles.AssignHomeworkModal}>
                    <Grid container rowSpacing={3}>
                        <Grid item xl={2} xs={2} md={2}/>
                        <Grid item xl={10} xs={10} md={10}>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                {props.title}
                            </Typography>
                        </Grid>
                        <Grid item xl={1} xs={1} md={1}/>
                        <Grid item xl={10} xs={10} md={10}>
                            <form>
                                <Grid container rowSpacing={3}>
                                    <Grid item xl={12} xs={12} md={12}>
                                        <MyDateTimePicker label="Beginning date" date={assignHomeworkData.beginningDate} handleChange={handleBeginningDateChange}/>
                                    </Grid>
                                    <Grid item xl={12} xs={12} md={12}>
                                        <MyDateTimePicker label="Deadline date" date={assignHomeworkData.deadlineDate} handleChange={handleDeadlineDateChange}/>
                                    </Grid>
                                </Grid>
                            </form>
                        </Grid>
                        <Grid item xl={1} xs={1} md={1}/>
                        <Grid item xl={2} xs={2} md={2}/>
                        <Grid item xl={10} xs={10} md={10}>
                            <Button variant="contained"
                                    onClick={() => setSubmit(true)}>
                                Assign
                            </Button>
                        </Grid>
                        <Grid item xl={12} xs={12} md={12}/>
                    </Grid>
                </Box>
            </Modal>
            {submit && !data && !error ? <MySpinner/> : undefined}
            {submit && !!error ? <MyToast message={error.message} severity="error"/> : undefined}
        </div>
    )
}
