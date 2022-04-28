import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {DateTimePicker} from "@mui/x-date-pickers";
import {TextField} from "@mui/material";

export interface MyDateTimePickerProps {
    label: string
    date: string
    handleChange: (date: Date| null) => void
}

export default function MyDateTimePicker(props: MyDateTimePickerProps) {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
                label={props.label}
                inputFormat="yyyy-MM-dd hh:mm:ss"
                value={props.date}
                onChange={props.handleChange}
                renderInput={(params) => <TextField id="createdDate" {...params} />}
            />
        </LocalizationProvider>
    )
}
