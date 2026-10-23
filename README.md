# Trips

A shared pool of places to go, for two people who travel together. See
`docs/CONTEXT.md` for what it is and why.

## Run it locally

Needs Docker running.

```bash
npm install
supabase start      # local database, auth and mail at http://127.0.0.1:54324
cp .env.example .env.local   # then paste the publishable key supabase start printed
npm run dev
```

Sign-up is closed. Add a user in Studio (http://127.0.0.1:54323, Authentication >
Add user). Their first sign-in creates a space for them. To put a second person
in the same space, add a row to `space_invites` with their lowercase email
before creating their account. Sign-in codes land in Mailpit.

## Passwords

Sign-in takes a password or an emailed code. Set or change a password yourself;
the script prompts with hidden input and never stores it:

```bash
nvm use
npx tsx scripts/set-password.mts you@example.com --project-ref dzdgfbmwwzwfbycerimn
```

Leave out `--project-ref` (and add `--env-file=.env.local` after `tsx`) to set
it on the local database instead.
