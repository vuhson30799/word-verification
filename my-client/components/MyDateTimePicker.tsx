import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {DateTimePicker} from "@mui/x-date-pickers";

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
                format="yyyy-MM-dd hh:mm:ss"
                value={props.date ? new Date(props.date) : null}
                onChange={props.handleChange}
                slotProps={{textField: {id: "createdDate"}}}
            />
        </LocalizationProvider>
    )
}
