import '../styles/globals.css'
import {AppProps} from "next/app";
import {AuthProvider} from "../modules/auth/AuthContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
