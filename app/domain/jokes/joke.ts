import { Joke } from "@prisma/client";
import { db } from "~/support/db.server";

type CreateJoke = {
  name: string;
  content: string;
  jokesterId: string;
}

export async function getJokeById(id: string, query: object = {}): Promise<Joke | null> {
  return db.joke.findUnique({ ...query, where: { id } });
}

export async function getLatestJokes(take: number, query: object = {}) {
  return db.joke.findMany({
    take,
    orderBy: { createdAt: "desc" },
    ...query
  });
}

export async function getRandomJoke(query: object = {}): Promise<Joke | null> {
  const count = await db.joke.count();
  const randomRowNumber = Math.floor(Math.random() * count);
  const [randomJoke] = await db.joke.findMany({
    ...query,
    take: 1,
    skip: randomRowNumber
  });

  return randomJoke;
}

export async function createJoke(data: CreateJoke): Promise<Joke> {
  return db.joke.create({ data });
}

export async function deleteJokeById(id: string): Promise<Joke> {
  return db.joke.delete({ where: { id } });
}