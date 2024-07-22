import z, { string } from "zod";
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { eq, and, inArray } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";

//The RPC feature allows sharing of the API specifications between the server and the client.
import { db } from "@/db/drizzle";
import { accounts, insertAccountSchema } from "@/db/schema";

const app = new Hono()
  .get("/", clerkMiddleware(), async (c) => {
    const user = getAuth(c);

    if (!user?.userId) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const data = await db
      .select({
        id: accounts.id,
        name: accounts.name,
      })
      .from(accounts)
      .where(eq(accounts.userId, user.userId)); //verifying both are equal or not

    return c.json({ data });
  })
  .get(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (c) => {
      const user = getAuth(c);
      const { id } = c.req.valid("param");

      if (!user?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .select({
          id: accounts.id,
          name: accounts.name,
        })
        .from(accounts)
        .where(and(eq(accounts.userId, user.userId), eq(accounts.id, id)));

      if (!data) {
        return c.json({ error: "Not found" }, 400);
      }

      return c.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator(
      "json",
      insertAccountSchema.pick({
        //name is something we want user to pass that's y pick opposite omit()
        name: true,
      })
    ),
    async (c) => {
      const user = getAuth(c);
      const values = c.req.valid("json");

      if (!user?.userId) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const [data] = await db
        .insert(accounts)
        .values({
          id: createId(),
          userId: user.userId,
          ...values,
        })
        .returning();

      return c.json({ data });
    }
  )
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        ids: z.array(z.string()),
      })
    ),
    async (c) => {
      const user = getAuth(c);
      const values = c.req.valid("json");

      if (!user?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.userId, user.userId),
            inArray(accounts.id, values.ids)
          )
        )
        .returning({
          id: accounts.id,
        });

      return c.json({
        data,
      });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    zValidator(
      "json",
      insertAccountSchema.pick({
        name: true,
      })
    ),
    async (c) => {
      const user = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }
      if (!user?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .update(accounts)
        .set(values)
        .where(and(eq(accounts.userId, user.userId), eq(accounts.id, id)))
        .returning();

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({
        data,
      });
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (c) => {
      const user = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }
      if (!user?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .delete(accounts)
        .where(and(eq(accounts.userId, user.userId), eq(accounts.id, id)))
        .returning({
          id: accounts.id,
        });

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({
        data,
      });
    }
  );

export default app;
