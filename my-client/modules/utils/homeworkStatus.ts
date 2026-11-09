import {HomeworkData} from "../../pages/admin/examination/[examinationId]/homework";

export type HomeworkStatus = 'active' | 'upcoming' | 'ended'

export function getHomeworkStatus(homework: HomeworkData, now: number = Date.now()): HomeworkStatus {
    if (Date.parse(homework.beginningDate) > now) return 'upcoming'
    if (Date.parse(homework.deadlineDate) < now) return 'ended'
    return 'active'
}
