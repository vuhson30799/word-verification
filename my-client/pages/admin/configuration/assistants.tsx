import React, {useMemo, useState} from "react";
import useSWR from "swr";
import {orderBy} from "lodash";
import AddIcon from "@mui/icons-material/Add";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import {Admin} from "../../../layout/Admin";
import ConfigurationTabs from "../../../components/ConfigurationTabs";
import AssistantDialog from "../../../components/AssistantDialog";
import ConfirmDialog from "../../../components/ConfirmDialog";
import ErrorCard from "../../../components/ErrorCard";
import MyToast from "../../../components/MyToast";
import {MySpinner} from "../../../components/MySpinner";
import {fetcher, fetcherWithForm} from "../../../modules/configuration/Configuration";
import {AssistantData, AssistantInput} from "../../../modules/configuration/assistants";
import {initialsOf} from "../../../modules/configuration/students";
import page from "../../../styles/Configuration.module.css";
import styles from "../../../styles/ConfigurationAssistants.module.css";

const AVATAR_COLORS = ['#D9D3C4', '#E7C9DA', '#C7D6DC', '#E0784F', '#5B5FEF']
const ASSISTANTS_KEY = ['/api/assistants', 'get']

function avatarColor(name: string): string {
    const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0)
    return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function Assistants() {
    const {data: assistants, error, mutate} = useSWR<AssistantData[]>(ASSISTANTS_KEY, fetcher)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [passwordTarget, setPasswordTarget] = useState<AssistantData>()
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string>()
    const [deleting, setDeleting] = useState<AssistantData>()
    const [toast, setToast] = useState<{message: string, severity: 'success' | 'error', key: number}>()

    const sorted = useMemo(() => orderBy(assistants ?? [], [a => a.name.toLowerCase()]), [assistants])

    const notify = (message: string, severity: 'success' | 'error') => setToast({message, severity, key: Date.now()})

    const openDialog = (target?: AssistantData) => {
        setPasswordTarget(target)
        setSaveError(undefined)
        setDialogOpen(true)
    }

    const save = async (request: [string, string, any], successMessage: string) => {
        setSaving(true)
        setSaveError(undefined)
        try {
            await fetcherWithForm(request)
            await mutate()
            setDialogOpen(false)
            notify(successMessage, 'success')
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Cannot save this assistant.')
        } finally {
            setSaving(false)
        }
    }

    const handleCreate = (input: AssistantInput) => save(['/api/assistants', 'POST', input], 'Assistant added.')

    const handleChangePassword = (password: string) =>
        save([`/api/assistants/${passwordTarget?.id}`, 'PUT', {password}], 'Password updated.')

    const handleDelete = async () => {
        const target = deleting
        setDeleting(undefined)
        if (!target) return
        try {
            await fetcherWithForm([`/api/assistants/${target.id}`, 'DELETE', undefined])
            await mutate()
            notify(`${target.name} deleted.`, 'success')
        } catch (e) {
            notify(e instanceof Error ? e.message : 'Cannot delete this assistant.', 'error')
        }
    }

    return (
        <Admin>
            <div className={page.page}>
                <div>
                    <h1 className={page.title}>Configuration</h1>
                    <div className={styles.header}>
                        <ConfigurationTabs/>
                        <button type="button" className={styles.addButton} onClick={() => openDialog()}>
                            <AddIcon fontSize="small"/>
                            Add assistant
                        </button>
                    </div>
                </div>

                <span className={styles.description}>
                    Assistant accounts can manage exams and homework, but not configuration or other admins.
                </span>

                {error
                    ? <ErrorCard title="Cannot load assistants" message={error.message} onRetry={() => mutate()}/>
                    : !assistants
                        ? <MySpinner/>
                        : sorted.length === 0
                            ? <div className={styles.emptyState}>No assistants yet — add one to get started.</div>
                            : <div className={styles.list}>
                                <div className={styles.columns}>
                                    <span>Assistant</span><span>Role</span><span>Username</span><span>Actions</span>
                                </div>
                                {sorted.map(assistant => (
                                    <div className={styles.row} key={assistant.id}>
                                        <div className={styles.person}>
                                            <div className={styles.avatar} style={{background: avatarColor(assistant.name)}}>
                                                {initialsOf(assistant.name)}
                                            </div>
                                            <span className={styles.name}>{assistant.name}</span>
                                        </div>
                                        <span className={styles.role}>Assistant</span>
                                        <span className={styles.username}>{assistant.username}</span>
                                        <div className={styles.actions}>
                                            <button type="button" className={styles.passwordButton} onClick={() => openDialog(assistant)}>
                                                <LockOutlinedIcon sx={{fontSize: 14}}/>
                                                Change password
                                            </button>
                                            <button type="button" className={styles.deleteButton}
                                                    aria-label={`Delete ${assistant.name}`} onClick={() => setDeleting(assistant)}>
                                                <DeleteOutlinedIcon sx={{fontSize: 16}}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>}
            </div>

            <AssistantDialog open={dialogOpen} target={passwordTarget} saving={saving} error={saveError}
                             onCreate={handleCreate} onChangePassword={handleChangePassword}
                             onCancel={() => setDialogOpen(false)}/>
            <ConfirmDialog open={Boolean(deleting)} title="Delete assistant"
                           message={`Delete ${deleting?.name ?? ''}? They will no longer be able to sign in.`}
                           confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleting(undefined)}/>
            {toast && <MyToast key={toast.key} message={toast.message} severity={toast.severity}/>}
        </Admin>
    )
}

export default Assistants;
