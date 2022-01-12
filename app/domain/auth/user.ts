import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { db } from "~/support/db.server";

export type CreateUserDetails = {
  username: string;
  password: string;
};

export async function getUserById(id: string, query: object = {}): Promise<User|null> {
  return db.user.findUnique({ ...query, where: { id } });
}

export async function getUserByUsername(username: string, query: object = {}): Promise<User|null> {
  return db.user.findUnique({ ...query, where: { username }});
}

export async function createUser({ username, password }: CreateUserDetails): Promise<User|null> {
  const passwordHash = await bcrypt.hash(password, 10);

  return db.user.create({ data: { username, passwordHash }});
}

export async function isCorrectPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}