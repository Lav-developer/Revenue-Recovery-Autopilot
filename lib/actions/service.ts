/* eslint-disable @typescript-eslint/no-explicit-any */
import type { PrismaClient } from "@prisma/client";
import { PrismaActionRepository } from "@/lib/db/repositories/actions";

import type { ExecuteActionInput } from "./types";
import { executeRecoveryAction } from "./executor";

export async function executeRecoveryActionWithPrisma(db: PrismaClient | any, input: Omit<ExecuteActionInput, "repository">) {
  return db.$transaction((tx: any) => executeRecoveryAction({ ...input, repository: new PrismaActionRepository(tx), paymentProvider: input.paymentProvider }));
}
