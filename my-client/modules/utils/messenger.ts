/** Convert supported Facebook profile links to Messenger without following redirects. */
export function messengerHref(profile: string | undefined): string | null {
    if (!profile?.trim()) return null
    try {
        const value = profile.trim()
        const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null
        const host = url.hostname.toLowerCase().replace(/^www\./, '')
        const parts = url.pathname.split('/').filter(Boolean)
        if (host === 'messenger.com' && parts.length === 2 && parts[0] === 't' && /^[a-z\d.]+$/i.test(parts[1])) {
            return `https://www.messenger.com/t/${parts[1]}`
        }
        if (!['facebook.com', 'm.facebook.com', 'mbasic.facebook.com', 'fb.com', 'm.me'].includes(host)) return null
        if (host !== 'm.me' && parts.length === 1 && parts[0] === 'profile.php') {
            const id = url.searchParams.get('id')
            return id && /^\d+$/.test(id) ? `https://m.me/${id}` : null
        }
        const username = parts[0]
        const reserved = ['share', 'sharer', 'sharer.php', 'groups', 'pages', 'people', 'reel', 'reels', 'watch', 'events', 'stories', 'marketplace', 'login', 'login.php', 'settings', 'profile.php', 'messages', 'photo.php', 'photos', 'help']
        if (parts.length !== 1 || !/^[a-z\d.]+$/i.test(username) || reserved.includes(username.toLowerCase())) return null
        return `https://m.me/${username}`
    } catch {
        return null
    }
}
