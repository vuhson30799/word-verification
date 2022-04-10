import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {DatePicker} from "@mui/x-date-pickers";
import {TextField} from "@mui/material";

export interface MyDateTimePickerProps {
    date: string
    handleChange: (date: Date| null) => void
}

export default function MyDateTimePicker(props: MyDateTimePickerProps) {
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
                disableFuture={true}
                label="Created Date"
                inputFormat="yyyy-MM-dd"
                value={props.date}
                onChange={props.handleChange}
                renderInput={(params) => <TextField id="createdDate" {...params} />}
            />
        </LocalizationProvider>
    )
}
