"use client";

import { useSyncExternalStore } from "react";
import { addToCart, parseCart, removeFromCart, setQty, type CartLine } from "@/lib/cart";

// The bag lives in this browser until checkout records purchases on the server (#11).
const STORAGE_KEY = "gustavi-rada:ostukorv";

let cache: CartLine[] | undefined;
const listeners = new Set<() => void>();

function read(): CartLine[] {
  if (cache === undefined) {
    try {
      cache = parseCart(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      cache = [];
    }
  }
  return cache;
}

function write(next: CartLine[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be blocked; the bag then lasts until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  cache = undefined;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/** The bag's lines, or `undefined` while it is still being read from the browser. */
export function useCart() {
  const lines = useSyncExternalStore<CartLine[] | undefined>(subscribe, read, () => undefined);

  return {
    lines,
    add: (slug: string) => write(addToCart(read(), slug)),
    setQty: (slug: string, qty: number) => write(setQty(read(), slug, qty)),
    remove: (slug: string) => write(removeFromCart(read(), slug)),
    clear: () => write([]),
  };
}
