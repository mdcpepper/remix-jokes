import type { Joke } from "@prisma/client";
import type { ActionFunction, LoaderFunction, MetaFunction } from "remix";
import { redirect, useCatch, useLoaderData, useParams } from "remix";
import { getCurrentUserId, getRequiredCurrentUserId } from "~/support/session.server";
import { JokeDisplay } from "~/components/joke";
import { deleteJokeById, getJokeById } from "~/domain/jokes/joke";
import invariant from "ts-invariant";

type LoaderData = {
  joke: Joke,
  isOwner: boolean
};

export const meta: MetaFunction = ({ data }: { data: LoaderData | undefined; }) => {
  if (!data) {
    return { title: "No joke", description: "No joke found" };
  }

  return {
    title: `Remix Jokes | "${data.joke.name}" joke`,
    description: `Enjoy the "${data.joke.name}" joke and much more`,
  };
};

export const loader: LoaderFunction = async ({
  request,
  params
}) => {
  invariant(params.jokeId);

  const [userId, joke] = await Promise.all([
    getCurrentUserId(request),
    getJokeById(params.jokeId, { select: { id: true, name: true, content: true, jokesterId: true } }),
  ]);

  if (!joke) {
    throw new Response("What a joke! Not found.", { status: 404 });
  }

  const data: LoaderData = {
    joke,
    isOwner: userId === joke.jokesterId,
  };

  return data;
};

export const action: ActionFunction = async ({
  request,
  params
}) => {
  const form = await request.formData();

  if (form.get("_method") === "delete") {
    invariant(params.jokeId);

    const [userId, joke] = await Promise.all([
      getRequiredCurrentUserId(request),
      getJokeById(params.jokeId, { select: { id: true, jokesterId: true } }),
    ]);

    if (!joke) {
      throw new Response("Can't delete what does not exist", { status: 404 });
    }

    if (joke.jokesterId !== userId) {
      throw new Response("Pssh, nice try. That's not your joke", { status: 401 });
    }

    await deleteJokeById(params.jokeId);

    return redirect("/jokes");
  }
};

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  switch (caught.status) {
  case 404: {
    return (
      <div className="error-container">
          Huh? What the heck is {params.jokeId}?
      </div>
    );
  }
  case 401: {
    return (
      <div className="error-container">
          Sorry, but {params.jokeId} is not your joke.
      </div>
    );
  }
  default: {
    throw new Error(`Unhandled error: ${caught.status}`);
  }
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  const { jokeId } = useParams();

  return (
    <div className="error-container">{`There was an error loading joke by the id ${jokeId}. Sorry.`}</div>
  );
}

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <JokeDisplay joke={data.joke} isOwner={data.isOwner} canDelete={true}/>
  );
}