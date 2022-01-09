import type { LinksFunction, LoaderFunction } from "remix";
import { Link, Outlet, useLoaderData } from "remix";
import type { Joke } from "@prisma/client";
import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

import stylesUrl from "~/styles/jokes.css";
import { User } from "@prisma/client";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet",
      href: stylesUrl,
    }
  ];
};

type LoaderData = {
  user: User | null;
  jokeListItems: Array<{
    id: string;
    name: string
  }>;
};

export const loader: LoaderFunction = async ({
  request
}) => {
  const [jokeListItems, user] = await Promise.all([
    db.joke.findMany({
      take: 5,
      select: {id: true, name: true},
      orderBy: {createdAt: "desc"},
    }),
    getUser(request, { select: { username: true }})
  ]);

  const data: LoaderData = {jokeListItems, user};

  return data;
};

// https://github.com/remix-run/remix/issues/599#issuecomment-978364515
export function CatchBoundary() {}

export default function Jokes() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link
              to="/"
              title="Remix Jokes"
              aria-label="Remix Jokes"
            >
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          {data.user ? (
            <div className="user-info">
              <span>{`Hi ${data.user.username}`}</span>
              <form action="/logout" method="post">
                <button type="submit" className="button">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <Link to=".">Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {data.jokeListItems.map(joke => (
                <li key={joke.id}>
                  <Link to={joke.id} prefetch="intent">{joke.name}</Link>
                </li>
              ))}
            </ul>
            <Link to="new" className="button">
              Add your own
            </Link>
          </div>
          <div className="jokes-outlet">
            <Outlet/>
          </div>
        </div>
      </main>
    </div>
  );
}