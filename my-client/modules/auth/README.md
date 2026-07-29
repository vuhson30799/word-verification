# Auth module

Required environment variables (add to `.env.local` / deployment env):

- `SESSION_SECRET` — random secret used to sign session JWTs.
- `ADMIN_USERNAME` — the admin login username.
- `ADMIN_PASSWORD_HASH` — bcrypt hash of the admin password. The plaintext password is never stored.

Generate `ADMIN_PASSWORD_HASH` for a chosen plaintext password with:

```
node -e "require('bcryptjs').hash(process.argv[1], 10).then(console.log)" 'your-password-here'
```

Next.js expands `$VAR`/`${VAR}` in `.env*` files, and a bcrypt hash is full of `$`-prefixed
segments — escape every `$` as `\$` when pasting the hash into `.env.local`, otherwise Next.js
will silently mangle it (see https://nextjs.org/docs/app/guides/environment-variables#variable-expansion).

Assistant accounts are created via the admin UI (Configuration → Assistants) and store their
password hash in `/assistants/{id}` in RTDB — never a plaintext password.
