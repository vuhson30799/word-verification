import {serverGet, apiError} from '../../../../../../modules/firebase/server';
import {validKey} from '../../../../../../modules/progress/types';
import type {Attempt, ProgressSnapshot} from '../../../../../../modules/progress/types';
import type {NextApiRequest, NextApiResponse} from 'next';
import {equalTo, get, orderByChild, query, ref} from 'firebase/database';
import {database} from '../../../../../../modules/firebase/FirebaseService';
import {requireRole} from '../../../../../../modules/auth/requireAuth';
import {toAnswers, toClasses, toStudents} from '../../../../../../modules/utils/dataUtils';
import {buildHomeworkResults} from '../../../../../../modules/utils/homeworkResults';
import {currentAcademicYear} from '../../../../../../modules/configuration/classes';

import {maximumIncorrectAnswers} from "../../../../../../modules/utils/examinationPassing";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Cache-Control', 'no-store')
    if (!requireRole(req, res, ['admin', 'assistant'])) return
    if (req.method !== 'GET') return res.status(405).json({message: 'Request is not supported'})
    const {examId, homeworkId} = req.query
    if (!validKey(examId) || !validKey(homeworkId)) return res.status(400).json({message: 'Invalid homework.'})
    try {
        const [examSnapshot, homeworkSnapshot, studentsSnapshot, classesSnapshot, answers, completed, snapshots] = await Promise.all([
            get(ref(database, `/examinations/${examId}`)),
            get(ref(database, `/homeworks/${homeworkId}`)),
            get(ref(database, '/students')),
            get(ref(database, '/classes')),
            getHomeworkAnswers(examId, homeworkId),
            serverGet<Record<string, Attempt> | null>(`completedAttempts/${homeworkId}`),
            serverGet<Record<string, ProgressSnapshot> | null>(`progress/${examId}/${homeworkId}/snapshots`)
        ])
        const exam = examSnapshot.val()
        const homework = homeworkSnapshot.val()
        if (!exam || !homework || homework.examId !== examId) return res.status(404).json({message: 'Homework not found.'})
        const students = toStudents(studentsSnapshot.val())
        const legacyRoster = !Array.isArray(homework.studentIds)
        const gradeClasses = toClasses(classesSnapshot.val(), studentsSnapshot.val()).filter(c =>
            Number(c.grade) === Number(exam.grade) && c.academicYear === currentAcademicYear())
        const roster = legacyRoster
            ? students.filter(s => s.classIds.some(id => gradeClasses.some(c => c.id === id)))
            : [...new Set<string>(homework.studentIds)].map(id => students.find(s => s.id === id) ?? {
                id, name: 'Deleted student', phone: '', parentPhone: '', facebook: '', classIds: []
            })
        res.status(200).json({
            title: exam.title,
            maximumIncorrectAnswers: maximumIncorrectAnswers(exam),
            grade: exam.grade,
            beginningDate: homework.beginningDate,
            deadlineDate: homework.deadlineDate,
            questionCount: (exam.questions ?? []).filter((q: {keys?: string[]}) => q?.keys?.length).length,
            assignedCount: roster.length,
            legacyRoster,
            ...buildHomeworkResults(roster, [...answers, ...Object.values(completed ?? {}),
                ...Object.values(snapshots ?? {}).map(snapshot => ({...snapshot, provisional: true}))])
        })
    } catch (error) {
        const failure = apiError(error)
        res.status(failure.status).json({message: failure.message})
    }
}

async function getHomeworkAnswers(examId: string, homeworkId: string) {
    const answersRef = ref(database, '/answers')
    const snapshot = await get(query(answersRef, orderByChild('examId'), equalTo(examId)))
    return toAnswers(snapshot.val()).filter(answer => answer.examId === examId && answer.homeworkId === homeworkId)
}
