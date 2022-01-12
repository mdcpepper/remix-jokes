import type { LoaderFunction, MetaFunction } from "remix";
import { Link, useCatch, useLoaderData } from "remix";
import { Joke } from "@prisma/client";
import { getRandomJoke } from "~/domain/jokes/joke";

type LoaderData = { randomJoke: Joke };

export const meta: MetaFunction = ({ data }: { data: LoaderData }) => {
  return {
    title: "Remix Jokes | Random Joke"
  };
};

export const loader: LoaderFunction = async () => {
  const randomJoke = await getRandomJoke({ select: { id: true, name: true, content: true } });

  if (!randomJoke) {
    throw new Response("No random joke found", {
      status: 404
    });
  }

  const data: LoaderData = { randomJoke };

  return data;
};

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="error-container">
        There are no jokes to display.
      </div>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}

export default function JokesIndexRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{data.randomJoke.content}</p>
      <Link to={data.randomJoke.id}>
        "{data.randomJoke.name}" Permalink
      </Link>
    </div>
  );
}