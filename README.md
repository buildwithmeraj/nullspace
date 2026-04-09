# NullSpace

NullSpace is a social platform for developers to share posts, code snippets, and ideas.  
This repository contains the Next.js frontend.

- Live URL: [https://nullspace-ten.vercel.app/](https://nullspace-ten.vercel.app/)
- Backend Repo: [https://github.com/buildwithmeraj/nullspace-server](https://github.com/buildwithmeraj/nullspace-server)

## Project Details

- Built with Next.js 16, React 19, TypeScript, Tailwind CSS, and DaisyUI.
- Connects to the NullSpace backend API for auth, posts, comments, reactions, and profiles.
- Uses markdown rendering with syntax highlighting for developer-friendly content.

## Features

- User authentication (email/password + Google login).
- Developer feed with infinite scroll.
- Create posts with markdown and image support.
- Post interactions: reactions and comments.
- Profile management (view/edit profile and user posts).
- Suggested users and notification-ready frontend flows.

## Setup Instructions

1. Clone this repo and install dependencies:

```bash
npm install
```

2. Create `.env.local` and add:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_AUTH_PATH=/users/google
```

3. Start the backend from:  
   [https://github.com/buildwithmeraj/nullspace-server](https://github.com/buildwithmeraj/nullspace-server)

4. Run the frontend:

```bash
npm run dev
```

5. Open `http://localhost:3000`.
