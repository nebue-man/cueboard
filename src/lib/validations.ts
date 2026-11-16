// src/lib/validations.ts
import { z } from "zod";

export const CreateBookingSchema = z.object({
  clubId:         z.string().cuid(),
  slotDurationId: z.string().cuid(),
  tableIds:       z.array(z.string().cuid()).min(1),
  guestName:      z.string().min(2).max(100),
  guestPhone:     z.string().min(7).max(20),
  playerCount:    z.number().int().min(1).max(20),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:      z.string().regex(/^\d{2}:\d{2}$/),
});

export const UpdateTableSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  pricePerSlot: z.number().positive().optional(),
  isActive:     z.boolean().optional(),
});

export const CreateTableSchema = z.object({
  name:         z.string().min(1).max(100),
  type:         z.enum(["POOL", "SNOOKER", "BILLIARDS", "CAROM"]),
  pricePerSlot: z.number().positive(),
});

export const UpdateProductSchema = z.object({
  name:        z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price:       z.number().positive().optional(),
  isActive:    z.boolean().optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type UpdateTableInput   = z.infer<typeof UpdateTableSchema>;
export type CreateTableInput   = z.infer<typeof CreateTableSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
