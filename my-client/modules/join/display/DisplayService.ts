export type DisplayState = {
    components: DisplayStateEnum[]
}

export enum DisplayStateEnum {
    STUDENT_NAME,
    STARTING_COMPONENT,
    QUESTION,
    TO_NEXT_QUESTION,
    KEY_BUTTON,
    ANSWERS,
    FINISH_PAGE,
    CHEATING_PAGE
}

export function isDisplayed(state: DisplayState, component: DisplayStateEnum) {
    return state.components.includes(component)
}
