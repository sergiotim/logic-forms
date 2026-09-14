import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'STUDENT' | 'TEACHER';
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'STUDENT' | 'TEACHER';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'STUDENT' | 'TEACHER';
  }
}
