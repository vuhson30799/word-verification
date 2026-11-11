import '../styles/globals.css'
import {AppProps} from "next/app";
import {AuthProvider} from "../modules/auth/AuthContext";

export default function MyApp({ Component, pageProps, router }: AppProps) {
  if (router.pathname === '/join') return <Component {...pageProps} />

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
