import {MyFooter} from "../components/MyFooter";
import MySearchAppBar from "../components/MySearchAppBar";

export function Admin({ children }: any) {
    return (
        <>
            <MySearchAppBar/>
            <main>{children}</main>
            <MyFooter/>
        </>
    )
}
