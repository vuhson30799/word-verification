import React, {createContext, useContext, useEffect, useState} from "react";
import {Role} from "./SessionService";

export interface AuthUser {
    role: Role
    username: string
}

interface AuthContextValue {
    user: AuthUser | null
    loading: boolean
    refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({user: null, loading: true, refresh: async () => {}})

export function AuthProvider({children}: {children: React.ReactNode}) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    const refresh = async () => {
        try {
            const response = await fetch('/api/auth/me')
            if (response.status === 200) {
                setUser(await response.json())
            } else {
                setUser(null)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refresh()
    }, [])

    return (
        <AuthContext.Provider value={{user, loading, refresh}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
