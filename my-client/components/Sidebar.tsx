import * as React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import ViewListIcon from '@mui/icons-material/ViewList';
import SchoolIcon from '@mui/icons-material/School';
import BugReportIcon from '@mui/icons-material/BugReport';
import QuizIcon from '@mui/icons-material/Quiz';
import LogoutIcon from '@mui/icons-material/Logout';
import styles from '../styles/Sidebar.module.css';
import {useAuth} from '../modules/auth/AuthContext';

function initialsOf(username?: string): string {
    if (!username) return '?';
    return username.trim().slice(0, 2).toUpperCase();
}

export default function Sidebar({mobile = false, onNavigate}: {mobile?: boolean; onNavigate?: () => void}) {
    const {user, refresh} = useAuth();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleUserChipClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleMenuClose();
        onNavigate?.();
        await fetch('/api/auth/logout', {method: 'POST'});
        await refresh();
        await router.push('/admin/login');
    };

    const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(`${href}/`);

    return (
        <nav className={`${styles.sidebar} ${mobile ? styles.mobileSidebar : ''}`} aria-label={mobile ? "Navigation drawer" : "Sidebar"} onClick={event => {if ((event.target as HTMLElement).closest('a')) onNavigate?.()}}>
            <div className={styles.top}>
                <Link href="/admin/examination" className={styles.logo}>
                    <div className={styles.logoMark}/>
                    <span className={styles.logoText}>Word Verification</span>
                </Link>

                <div className={styles.nav}>
                    <Link href="/admin/quiz" className={`${styles.navItem} ${isActive('/admin/quiz') ? styles.navItemActive : ''}`}>
                        <AddCircleOutlineIcon/>
                        <span>Create</span>
                    </Link>
                    <Link href="/admin/examination" className={`${styles.navItem} ${isActive('/admin/examination') ? styles.navItemActive : ''}`}>
                        <ViewListIcon/>
                        <span>Examinations</span>
                    </Link>
                    {user?.role === 'admin' &&
                        <Link href="/admin/configuration/classes" className={`${styles.navItem} ${isActive('/admin/configuration') ? styles.navItemActive : ''}`}>
                            <SchoolIcon/>
                            <span>Configuration</span>
                        </Link>
                    }
                </div>

                <div className={styles.utilities}>
                    <span className={styles.utilitiesLabel}>Utilities</span>
                    <Link href="/admin/utils/arrange-wrong-answers" className={`${styles.utilityItem} ${isActive('/admin/utils/arrange-wrong-answers') ? styles.utilityItemActive : ''}`}>
                        <BugReportIcon/>
                        <span>Arrange wrong answers</span>
                    </Link>
                    <Link href="/admin/utils/oral-checking" className={`${styles.utilityItem} ${isActive('/admin/utils/oral-checking') ? styles.utilityItemActive : ''}`}>
                        <QuizIcon/>
                        <span>Oral checking</span>
                    </Link>
                </div>
            </div>

            <div className={styles.bottom}>
                <button className={styles.userChip} onClick={handleUserChipClick}>
                    <div className={styles.avatar}>{initialsOf(user?.username)}</div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.username}</span>
                        <span className={styles.userRole}>{user?.role}</span>
                    </div>
                </button>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                            <LogoutIcon fontSize="small"/>
                        </ListItemIcon>
                        Logout
                    </MenuItem>
                </Menu>
                <span className={styles.tagline}>® SHVU — Phương Liên ®</span>
            </div>
        </nav>
    );
}
