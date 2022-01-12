import type { ActionFunction, LoaderFunction } from "remix";
import { redirect } from "remix";
import { logout } from "~/support/session.server";

export const action: ActionFunction = async ({
  request
}) => {
  return logout(request);
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};