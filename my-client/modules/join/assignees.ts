export interface JoinAssignee { id: string; name: string; className: string }
const normalized = (name: string) => name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')
const searchable = (name: string) => normalized(name).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
export function exactAssignees(name: string, roster: JoinAssignee[]) {
    return roster.filter(student => normalized(student.name) === normalized(name))
}
function distance(a: string, b: string) {
    let row = Array.from({length: b.length + 1}, (_, i) => i)
    for (let i = 1; i <= a.length; i++) {
        const next = [i]
        for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
        row = next
    }
    return row[b.length]
}
export function matchingAssignees(name: string, roster: JoinAssignee[]) {
    const input = searchable(name)
    if (!input) return []
    const tokens = input.split(' ')
    return roster.map(student => {
        const candidate = searchable(student.name)
        const score = candidate === input ? 3 : candidate.includes(input) ? 2 : Math.max(tokens.filter(token => candidate.includes(token)).length / tokens.length, distance(input, candidate) <= Math.max(1, Math.floor(input.length / 4)) ? 0.5 : 0)
        return {student, score}
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.student.name.localeCompare(b.student.name, 'vi')).slice(0, 6).map(item => item.student)
}
