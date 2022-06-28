import type {NextPage} from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
    return (
        <div className={styles.container}>
            <Head>
                <title>Word Verification</title>
                <meta name="description" content="Created by SHVU"/>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <link rel="icon" href="/favicon.ico"/>
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>
                    Welcome to <a href="https://www.facebook.com/phuongliendn0304">Miss Lien&lsquo;s English class!</a>
                </h1>
                <Image src="/lich_hoc.jpeg" alt="Lich hoc" width={500} height={500}/>
            </main>
        </div>
    )
}

export default Home
