# 📘 PolicyWonk: UCD Policy Expert always on call!

Welcome to **PolicyWonk**, your app for navigating the complex maze of UCOP (University of California Office of the President) and UC Davis policies! 🌟 Whether you're a student, faculty, staff, or administrator, understanding and complying with university policies is now easier than ever.

## How Can PolicyWonk Assist You?

- **Immediate Answers**: Got a policy question? Just ask, and PolicyWonk provides you with clear, concise answers, pronto! ✏️
- **Always Informed**: PolicyWonk's database is continuously updated, ensuring you get the most current policy information. 📅
- **Simple to Use**: Designed with user-friendliness in mind, PolicyWonk makes navigating policies as straightforward as chatting with a friend. 🤝

## How to Get Started?

[PolicyWonk Website](https://policywonk.ucdavis.edu)

## Sources:

See [UC Davis Policy Documents Repository](https://github.com/ucdavis/policy) for the full list of policies and procedures available ("ucdavis" github team member access required).

Sources include `UCOP Policies`, `UC Davis Administrative Policy Manuals`, and `UCOP Collective Bargaining Agreements`.

## Setting up a Dev Environment

### Prerequisites

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

- Install [VS Code Dev Containers extension](https://code.visualstudio.com/docs/devcontainers/containers)

### Setup Steps

1. Set up the frontend environment file by copying the `.env.local` file from LastPass to `web/.env.local`
2. Set up backend environment file by copying `backend/.env.example` to `/backend/.env`. If using the shared TEST pgsql instance then uncomment the line with the TEST connection string and add the password from one pass.
3. From VS Code, open a terminal in the dev container. You may have to close and re-open the workspace to register the dev environment.
4. From the dev container terminal, generate the prisma client:

```
npx prisma generate
```

5. Start the application

```
npm run dev
```

6. Access the application at `localhost:3001`
