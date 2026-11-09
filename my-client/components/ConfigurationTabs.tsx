import Link from "next/link";
import {useRouter} from "next/router";
import styles from "../styles/Configuration.module.css";

const TABS = [
    {label: 'Classes', href: '/admin/configuration/classes', available: true},
    {label: 'Students', href: '/admin/configuration/students', available: true},
    {label: 'Assistants', href: '/admin/configuration/assistants', available: true},
]

export default function ConfigurationTabs() {
    const router = useRouter()

    return (
        <div className={styles.tabs} role="tablist">
            {TABS.map(tab => {
                const active = router.pathname === tab.href
                if (!tab.available) {
                    return <span key={tab.label} role="tab" aria-disabled="true"
                                 className={`${styles.tab} ${styles.tabDisabled}`}>{tab.label}</span>
                }
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
