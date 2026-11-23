import Link from "next/link";
import {useRouter} from "next/router";
import {useAuth} from "../modules/auth/AuthContext";
import styles from "../styles/Configuration.module.css";

const TABS = [
    {label: 'Classes', href: '/admin/configuration/classes'},
    {label: 'Students', href: '/admin/configuration/students'},
    {label: 'Assistants', href: '/admin/configuration/assistants'},
]

export default function ConfigurationTabs() {
    const router = useRouter()
    const {user} = useAuth()
    const tabs = user?.role === 'admin' ? TABS : TABS.slice(0, 2)

    return (
        <div className={styles.tabs} role="tablist">
            {tabs.map(tab => {
                const active = router.pathname === tab.href
                return (
                    <Link key={tab.label} href={tab.href} role="tab" aria-selected={active}
                          className={`${styles.tab} ${active ? styles.tabActive : ''}`}>
                        {tab.label}
                    </Link>
                )
            })}
        </div>
    )
}
