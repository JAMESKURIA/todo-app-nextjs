import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { tasks } from "~/server/db/schema";

export const todoInput = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
});

export const taskRouter = createTRPCRouter({
  create: publicProcedure.input(todoInput).mutation(async ({ ctx, input }) => {
    await ctx.db.insert(tasks).values({
      name: input.name,
      status: input.status,
    });
  }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }),

  update: publicProcedure.input(todoInput).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(tasks)
      .set({ ...input })
      .where(eq(tasks.id, input.id!));
  }),

  delete: publicProcedure.input(z.number()).mutation(async ({ ctx, input }) => {
    await ctx.db.delete(tasks).where(eq(tasks.id, input));
  }),
});
