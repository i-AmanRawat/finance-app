import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
using integers of the smallest unit of the currency 
-> we are going to use miliunits to support 3 decimals
-> $10.50 => 10500
-> cross-language compatible
*/

export function convertAmountToMiliUnits(amount: number) {
  return Math.round(amount * 1000);
}

export function convertAmountFromMiliUnits(amount: number) {
  return amount / 1000;
}
