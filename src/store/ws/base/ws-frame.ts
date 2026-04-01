import type { ParsedWsEvent } from "@/store/ws/base/ws-types";

export async function decodeWsFrame(data: unknown): Promise<string | null> {
  if (typeof data === "string") {
    const text = data.trim();
    return text.length > 0 ? text : null;
  }

  if (data instanceof Blob) {
    if (data.size === 0) return null;
    const text = (await data.text()).trim();
    return text.length > 0 ? text : null;
  }

  if (data instanceof ArrayBuffer) {
    if (data.byteLength === 0) return null;
    const text = new TextDecoder().decode(data).trim();
    return text.length > 0 ? text : null;
  }

  return null;
}

export function parseWsEvent(
  frame: string,
  raw: unknown,
): ParsedWsEvent | null {
  try {
    return JSON.parse(frame) as ParsedWsEvent;
  } catch {
    console.warn("[WS] Unparseable message:", raw);
    return null;
  }
}
