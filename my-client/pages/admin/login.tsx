import React, {FormEvent, useState} from "react";
import {useRouter} from "next/router";
import Head from "next/head";
import Image from "next/image";
import styles from "../../styles/Login.module.css";
import MyToast from "../../components/MyToast";
import {useAuth} from "../../modules/auth/AuthContext";

export default function Login() {
    const router = useRouter()
    const {refresh} = useAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | undefined>()
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setError(undefined)
        setSubmitting(true)
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({username, password})
            })
            if (response.status !== 200) {
                const data = await response.json()
                setError(data.message || 'Invalid credentials')
                return
            }
            await refresh()
            await router.push('/admin/examination')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={styles.Page}>
            <Head>
                <title>Sign in - Word Verification</title>
            </Head>
            <div className={styles.Card}>
                <div className={styles.BrandSide}>
                    <div className={styles.BrandGlow}/>
                    <div className={styles.BrandLogoRow}>
                        <Image src="/logo_wv.svg" alt="Word Verification" width={34} height={34}/>
                        <span className={styles.BrandLogoName}>Word Verification</span>
                    </div>
                    <div className={styles.BrandHeadline}>
                        <h2>Manage exams, homework and rosters in one place.</h2>
                        <p>Sign in with your teacher account to create exams, assign homework and track student progress.</p>
                    </div>
                    <div className={styles.BrandFooter}>&reg; SsS &ndash; Ph&#432;&#417;ng Li&ecirc;n &reg;</div>
                </div>

                <div className={styles.FormSide}>
                    <form onSubmit={handleSubmit} className={styles.FormContent}>
                        <div>
                            <h1 className={styles.FormTitle}>Sign in</h1>
                        </div>

                        <div className={styles.Field}>
                            <label htmlFor="username">Username</label>
                            <input
                                id="username"
                                className={styles.Input}
                                placeholder="Username"
                                value={username}
                                autoFocus
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className={styles.Field}>
                            <label htmlFor="password">Password</label>
                            <div className={styles.PasswordField}>
                                <input
                                    id="password"
                                    className={styles.Input}
                                    placeholder="Password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className={styles.PasswordToggle}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <svg width="16" height="16" viewBox="0 0 16 16">
                                        <path d="M1.5 8s2.3-4.5 6.5-4.5S14.5 8 14.5 8s-2.3 4.5-6.5 4.5S1.5 8 1.5 8z"
                                              fill="none" stroke="currentColor" strokeWidth="1.3"/>
                                        <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor"
                                                strokeWidth="1.3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className={styles.Row}>
                            <label className={styles.RememberMe}>
                                <input type="checkbox"/>
                                Remember me
                            </label>
                            <a className={styles.ForgotPassword} onClick={(e) => e.preventDefault()} href="#">
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className={styles.SubmitButton}
                            disabled={submitting || !username || !password}
                        >
                            Sign in
                        </button>

                        <span className={styles.HelperText}>
                            Need access? Ask an existing admin to invite you &ndash; self-registration is disabled.
                        </span>
                    </form>
                </div>
            </div>
            {error && <MyToast message={error} severity="error"/>}
        </div>
    )
}
