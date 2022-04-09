import {MyFooter} from "../components/MyFooter";
import MySearchAppBar from "../components/MySearchAppBar";
import style from "../styles/AdminLayout.module.css"

export function Admin({children}: any) {
    return (
        <div className={style.adminLayout}>
            <MySearchAppBar/>
            <main className={style.main}>{children}</main>
            <MyFooter/>
        </div>
    )
}
