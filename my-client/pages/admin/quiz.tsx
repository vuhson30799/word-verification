import {Button, FormControl, Grid, InputLabel, OutlinedInput, Select, SelectChangeEvent} from "@mui/material";
import {ChangeEvent, useState} from "react";
import {ExaminationData} from "./examination";
import MyDateTimePicker from "../../components/MyDateTimePicker";
import MenuItem from "@mui/material/MenuItem";
import {Admin} from "../../layout/Admin";
import Divider from "@mui/material/Divider";
import styles from "../../styles/Quiz.module.css"
import MyFileUpload from "../../components/MyFileUpload";
import useSWR from "swr";
import {fetcherWithForm} from "../../modules/configuration/Configuration";
import {useRouter} from "next/router";
import {MySpinner} from "../../components/MySpinner";
import MyToast from "../../components/MyToast";
import {convertDate} from "../../modules/utils/dateUtils";

export default function Quiz() {
    const [examination, setExamination] = useState<ExaminationData>({
        id: "",
        questions: [],
        title: "",
        createdDate: (new Date()).toISOString(),
        creator: "Phuong Lien",
        grade: 10
    })
    const [file, setFile] = useState<File | undefined>(undefined)
    const [submit, setSubmit] = useState<boolean>(false)
    const {data, error} = useSWR(submit ? ['http://localhost:8080/exams', 'post', examination, file] : null, fetcherWithForm)
    const router = useRouter()
    if (submit && data) {
        router.push('/admin/examination')
            .then(() => console.log('redirect to view examinations'))
        setSubmit(false)
    }


    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return
        setFile(e.target.files[0])
    }

    function handleChange(fieldName: string, value: string) {
        switch (fieldName) {
            case "title":
                setExamination({
                    ...examination,
                    title: value
                })
                break
            case "creator":
                setExamination({
                    ...examination,
                    creator: value
                })
                break
            case "grade":
                setExamination({
                    ...examination,
                    grade: Number(examination.grade)
                })
                break
            default:
                throw new Error(`Unknown field: ${fieldName}`)
        }
    }

    function handleDateChange(date: Date | null) {
        setExamination({
            ...examination,
            createdDate: date ? convertDate(date) : ''
        })
    }

    function handleSubmitForm() {
        setSubmit(true)
    }

    return (
        <Admin>
            <form>
                <Grid container className={styles.QuizForm}>
                    <Grid item xs={12} md={12} xl={12}>
                        <FormControl className={styles.QuizFormControl}>
                            <InputLabel htmlFor="title">Title</InputLabel>
                            <OutlinedInput
                                id="title"
                                value={examination.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                label="title"
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={6} xl={6}>
                        <FormControl className={styles.QuizFormControl}>
                            <MyDateTimePicker date={examination.createdDate}
                                              handleChange={handleDateChange}
                                              label={"Created date"}/>
                        </FormControl>

                    </Grid>
                    <Grid item xs={6} md={6} xl={6}>
                        <FormControl className={styles.QuizFormControl}>
                            <InputLabel id="grade">Grade</InputLabel>
                            <Select
                                labelId="grade"
                                id="grade"
                                value={`${examination.grade}`}
                                label="Grade"
                                onChange={(e: SelectChangeEvent) => handleChange("grade", e.target.value)}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                <MenuItem value={10}>Grade 10</MenuItem>
                                <MenuItem value={11}>Grade 11</MenuItem>
                                <MenuItem value={12}>Grade 12</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={12} xl={12}>
                        <Divider className={styles.QuizFormControl}/>
                    </Grid>
                    <Grid item xs={12} md={12} xl={12}>
                        <div className={styles.QuizFormControl}>
                            <strong>
                                To add questions, please upload the file following this &nbsp;
                                <a className={styles.QuizTemplateLink} href="/template.xlsx">template</a>
                                &nbsp; then please upload the file here.
                            </strong>
                        </div>
                    </Grid>
                    <Grid item xs={12} md={12} xl={12}>
                        <FormControl className={styles.QuizFormControl}>
                            <MyFileUpload file={file} handleFileChange={handleFileChange}/>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={12} xl={12}>
                        <div className={styles.QuizFormControl}>
                            <Button variant="contained"
                                    onClick={handleSubmitForm}
                                    className={styles.QuizSubmitButton}>
                                Submit
                            </Button>
                        </div>
                    </Grid>
                </Grid>
            </form>
            {submit && !data && !error ? <MySpinner/> : undefined}
            {submit && !!error ? <MyToast message={error.message} severity="error"/> : undefined}
        </Admin>
    )
}
