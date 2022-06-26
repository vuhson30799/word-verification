import {MyFooter} from "../components/MyFooter";
import MySearchAppBar from "../components/MySearchAppBar";
import style from "../styles/AdminLayout.module.css"
import Head from "next/head";

export function Admin({children}: any) {
    return (
        <div className={style.adminLayout}>
            <Head>
                <title>Admin</title>
                <meta name="description" content="Admin layout" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </Head>
            <MySearchAppBar/>
            <main className={style.main}>{children}</main>
            <MyFooter/>
        </div>
    )
}
