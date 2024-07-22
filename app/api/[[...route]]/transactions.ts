import z from "zod";
import { Hono } from "hono";
import { formatDistance, parse, subDays } from "date-fns";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { eq, and, inArray, gte, lte, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";

//The RPC feature allows sharing of the API specifications between the server and the client.
import { db } from "@/db/drizzle";
import {
  transactions,
  insertTransactionSchema,
  categories,
  accounts,
} from "@/db/schema";

const app = new Hono()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        from: z.string().optional(),
        to: z.string().optional(),
        accountId: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const user = getAuth(c);
      const { from, to, accountId } = c.req.valid("query");

      if (!user?.userId) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const defaultTo = new Date(); //today
      const defaultFrom = subDays(defaultTo, 30); //from 30 days before

      const startDate = from
        ? parse(from, "yyyy-MM-dd", new Date())
        : defaultFrom;
      const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

      const data = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          category: categories.name,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          account: accounts.name,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id)) // return rows from both tables
        .leftJoin(categories, eq(transactions.categoryId, categories.id)) //return rows from transation and matching categories if not return null for that specific
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined, // if accId exist it will implement the filter otherwise it won't it will nullify the filter //return where provided accId is matching with transaction's accId
            eq(accounts.userId, user.userId), //to access acccounts it was essential to use join , transaction->account->user so verifying we are only returning transations of accounts of loggedin user only
            gte(transactions.date, startDate), //return transaction greater then equal startDate
            lte(transactions.date, endDate)
          )
        );

      return c.json({ data });
    }
  )
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
          id: transactions.id,
          date: transactions.date,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .where(and(eq(transactions.id, id), eq(accounts.userId, user.userId)));

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
      insertTransactionSchema.omit({
        //except id accept all the remaining fields from user
        id: true,
      })
    ),
    async (c) => {
      const user = getAuth(c);
      const values = c.req.valid("json");

      if (!user?.userId) {
        return c.json({ error: "unauthorized" }, 401);
      }

      const [data] = await db
        .insert(transactions)
        .values({
          id: createId(),
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

      //using :WITH DELETE clause from drizzle
      const transactionsToDelete = db.$with("transactions_to_delete").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(
              eq(accounts.id, user.userId),
              inArray(transactions.id, values.ids) //check 1st in 2nd array
            )
          )
      );

      const data = await db
        .with(transactionsToDelete)
        .delete(transactions)
        .where(eq(transactions.id, sql`select id from ${transactionsToDelete}`))
        .returning({
          id: transactions.id,
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
      insertTransactionSchema.omit({
        id: true,
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

      const transactionToUpdate = db.$with("transaction_to_update").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(transactions.id, id), eq(accounts.userId, user.userId)))
      );

      const [data] = await db
        .with(transactionToUpdate)
        .update(transactions)
        .set(values)
        .where(
          inArray(transactions.id, sql`select id from ${transactionToUpdate}`) //why are we using inArray and not eq transaction update is going to return a single row
        )
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

      const transactionToDelete = db.$with("transaction_to_delete").as(
        db
          .select({ id: transactions.id })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(and(eq(accounts.id, user.userId), eq(transactions.id, id)))
      );

      const [data] = await db
        .with(transactionToDelete)
        .delete(transactions)
        .where(
          inArray(transactions.id, sql`select id from ${transactionToDelete}`) //i think above sub query will return single transaction so i am not able to understand why are we using inArray rather than eq
        )
        .returning({
          id: transactions.id,
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
