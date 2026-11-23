import Sidebar from "../components/Sidebar";
import style from "../styles/AdminLayout.module.css"
import Link from "next/link";
import {Drawer} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ViewListIcon from "@mui/icons-material/ViewList";
import SchoolIcon from "@mui/icons-material/School";
import Head from "next/head";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {useAuth} from "../modules/auth/AuthContext";
import {MySpinner} from "../components/MySpinner";

export function Admin({children, className, adminOnly = false}: any) {
    const {user, loading} = useAuth()
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false)
    const path = router.pathname
    const examId = router.query.examinationId
    const isResults = path.endsWith('/completed-students')
    const isHomework = path.endsWith('/homework')
    const isExam = path === '/admin/examination/[examinationId]'
    const title = isResults ? 'Results' : isHomework ? 'Homework' : isExam ? 'Examination'
        : path === '/admin/quiz' ? 'Create exam' : path.includes('/configuration') ? 'Configuration'
        : path.endsWith('/oral-checking') ? 'Oral checking' : path.endsWith('/arrange-wrong-answers') ? 'Arrange wrong answers' : 'Word Verification'
    const backHref = isResults ? `/admin/examination/${examId}/homework`
        : isHomework ? `/admin/examination/${examId}` : isExam || path === '/admin/quiz' ? '/admin/examination' : undefined
    const denied = adminOnly && user?.role === 'assistant'
    const navigation = [
        {href: '/admin/quiz', label: 'Create', icon: AddCircleOutlineIcon, active: path === '/admin/quiz'},
        {href: '/admin/examination', label: 'Exams', icon: ViewListIcon, active: path.startsWith('/admin/examination')},
        {href: '/admin/configuration/classes', label: 'Config', icon: SchoolIcon, active: path.startsWith('/admin/configuration')}
    ]

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/admin/login')
        } else if (denied) {
            router.replace('/admin/configuration/classes')
        }
    }, [loading, user, denied, router])

    if (loading || !user || denied) return <MySpinner/>

    return (
        <div className={`${style.adminLayout} ${className ?? ''}`}>
            <Head>
                <title>Admin</title>
                <meta name="description" content="Admin layout" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </Head>
            <Sidebar/>
            <header className={style.mobileHeader}>
                {backHref
                    ? <Link href={backHref} className={style.headerButton} aria-label="Back"><ArrowBackIcon fontSize="small"/></Link>
                    : <button type="button" className={style.headerButton} aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><MenuIcon fontSize="small"/></button>}
                <span className={style.mobileTitle}>{title}</span>
                <button type="button" className={style.accountButton} aria-label="Open account and navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
                    {user.username.trim().slice(0, 2).toUpperCase()}
                </button>
            </header>
            <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} slotProps={{paper: {className: style.drawer}}}>
                <button type="button" className={style.closeDrawer} aria-label="Close navigation" onClick={() => setMenuOpen(false)}><CloseIcon/></button>
                <Sidebar mobile onNavigate={() => setMenuOpen(false)}/>
            </Drawer>
            <main className={style.main}>{children}</main>
            <nav className={style.mobileTabs} aria-label="Main navigation">
                {navigation.map(({href, label, icon: Icon, active}) => <Link key={href} href={href} className={active ? style.activeTab : undefined} aria-current={active ? 'page' : undefined}>
                    <Icon fontSize="small"/><span>{label}</span>
                </Link>)}
            </nav>
        </div>
    )
}
