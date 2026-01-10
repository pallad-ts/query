import { z } from "zod";

export function createLimitSchema(maxLimit: number, defaultLimit: number) {
	return z.number().int().positive().max(maxLimit).default(defaultLimit);
}
