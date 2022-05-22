import {Button, Grid, Modal} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MyDateTimePicker from "./MyDateTimePicker";
import {useState} from "react";
import {convertDate} from "../modules/utils/dateUtils";
import useSWR from "swr";
import {assignHomeworkFetcher} from "../modules/configuration/Configuration";
import {useRouter} from "next/router";
import {MySpinner} from "./MySpinner";
import MyToast from "./MyToast";

export interface AssignHomeworkModalProps {
    title: string
    examinationId: string
}

export interface AssignHomeworkData {
    beginningDate: string
    deadlineDate: string
}

export default function AssignHomeworkModal(props: AssignHomeworkModalProps) {
    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    const now = new Date()
    const [assignHomeworkData, setAssignHomeworkData] = useState<AssignHomeworkData>({
        beginningDate: convertDate(now),
        deadlineDate: convertDate(now)
    })
    const [open, setOpen] = useState<boolean>(false)
    const [submit, setSubmit] = useState<boolean>(false)
    const { data, error } = useSWR<string>(submit ? [`http://localhost:8080/exams/${props.examinationId}`, 'post', assignHomeworkData] : null, assignHomeworkFetcher)
    const router = useRouter()
    if (submit && data) {
        router.push(`/admin/examination/${props.examinationId}?homework_url=${encodeURIComponent(data)}`)
            .then(() => console.log('redirect to view examination with homework link'))
        setSubmit(false)
    }
    function closeModal() {
        setOpen(false)
        setSubmit(true)
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
        <>
            <Button variant="contained" onClick={() => setOpen(true)}>Assigned Homework</Button>
            <Modal
                open={open}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"

            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        {props.title}
                    </Typography>
                    <form>
                        <Grid container>
                            <Grid item xl={12} xs={12} md={12}>
                                <MyDateTimePicker label="Beginning date" date={assignHomeworkData.beginningDate} handleChange={handleBeginningDateChange}/>
                            </Grid>
                            <Grid item xl={12} xs={12} md={12}>
                                <MyDateTimePicker label="Deadline date" date={assignHomeworkData.deadlineDate} handleChange={handleDeadlineDateChange}/>
                            </Grid>
                        </Grid>
                    </form>
                    <Button variant="contained"
                            onClick={closeModal}>
                        Assign
                    </Button>
                </Box>
            </Modal>
            {submit && !data && !error ? <MySpinner/> : undefined}
            {submit && !!error ? <MyToast message={error.message} severity="error"/> : undefined}
        </>
    )
}
