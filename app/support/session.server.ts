import { createCookieSessionStorage, redirect } from "remix";
import { isCorrectPassword, getUserById, getUserByUsername } from "~/domain/auth/user";

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'Jokes_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  }
});

type UserLoginDetails = {
  username: string;
  password: string;
};

export async function login({username, password}: UserLoginDetails) {
  const user = await getUserByUsername(username);

  if (!user || !await isCorrectPassword(password, user.passwordHash)) {
    return null
  }

  return user;
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session)
    }
  });
}

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function getCurrentUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get('userId');

  if (!userId || typeof userId !== 'string') {
    return null;
  }

  return userId;
}

export async function getRequiredCurrentUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
  const session = await getUserSession(request);
  const userId = session.get('userId');

  if (!userId || typeof userId !== 'string') {
    const searchParams = new URLSearchParams([
      ['redirectTo', redirectTo]
    ]);

    throw redirect(`/login?${searchParams}`);
  }

  return userId;
}

export async function getCurrentUser(request: Request, query: object = {}) {
  const userId = await getCurrentUserId(request);
  if (typeof userId !== 'string') {
    return null;
  }

  try {
    return await getUserById(userId, query);
  } catch {
    throw await logout(request);
  }
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get('Cookie'));

  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}