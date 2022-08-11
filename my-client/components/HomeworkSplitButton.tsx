import * as React from 'react';
import {useRef, useState} from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import {HomeworkData} from "../pages/admin/examination/[examinationId]/homework";
import {useRouter} from "next/router";
import useSWRImmutable from "swr/immutable";
import {fetcher} from "../modules/configuration/Configuration";

const options = ['Copy Homework URL', 'Display completed students', 'Remove'];

export default function HomeworkSplitButton(props: {homeworkData: HomeworkData}) {
    const router = useRouter()
    const {examinationId} = router.query
    const [open, setOpen] = useState(false)
    const anchorRef = useRef<HTMLDivElement>(null)
    const [selectedIndex, setSelectedIndex] = useState(1)
    const [submitDeletion, setSubmitDeletion] = useState(false)

    const handleClick = (index: number) => {
        switch (index) {
            case 0:
                return navigator.clipboard.writeText(props.homeworkData.url)
            case 1:
                return router.push(`/admin/examination/${examinationId}/homework/${props.homeworkData.id}/completed-students`)
            case 2:
                return setSubmitDeletion(true)

        }
    }
    const {data} = useSWRImmutable<{message: string}>(submitDeletion ?  [`/api/exams/${examinationId}/homeworks/${props.homeworkData.id}`, 'delete'] : null, fetcher)

    if (data) {
        setSubmitDeletion(false)
    }

    const handleMenuItemClick = (
        event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number,
    ) => {
        setSelectedIndex(index);
        setOpen(false);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (
            anchorRef.current &&
            anchorRef.current.contains(event.target as HTMLElement)
        ) {
            return;
        }

        setOpen(false);
    };

    return (
        <>
            <ButtonGroup variant="contained" ref={anchorRef} aria-label="split button">
                <Button onClick={() => handleClick(selectedIndex)} color={selectedIndex == 2 ? "error" : "info"}>{options[selectedIndex]}</Button>
                <Button
                    size="small"
                    aria-controls={open ? 'split-button-menu' : undefined}
                    aria-expanded={open ? 'true' : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                    color={selectedIndex == 2 ? "error" : "info"}
                >
                    <ArrowDropDownIcon/>
                </Button>
            </ButtonGroup>
            <Popper
                sx={{zIndex: 9999}}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({TransitionProps, placement}) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom'
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu" autoFocusItem>
                                    {options.map((option, index) => (
                                        <MenuItem
                                            key={option}
                                            selected={index === selectedIndex}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
}
