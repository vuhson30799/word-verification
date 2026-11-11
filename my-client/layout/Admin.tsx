import Sidebar from "../components/Sidebar";
import style from "../styles/AdminLayout.module.css"
import Head from "next/head";
import {useEffect} from "react";
import {useRouter} from "next/router";
import {useAuth} from "../modules/auth/AuthContext";
import {MySpinner} from "../components/MySpinner";

export function Admin({children, className}: any) {
    const {user, loading} = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/admin/login')
        }
    }, [loading, user, router])

    if (loading || !user) return <MySpinner/>

    return (
        <div className={`${style.adminLayout} ${className ?? ''}`}>
            <Head>
                <title>Admin</title>
                <meta name="description" content="Admin layout" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </Head>
            <Sidebar/>
            <main className={style.main}>{children}</main>
        </div>
    )
}
