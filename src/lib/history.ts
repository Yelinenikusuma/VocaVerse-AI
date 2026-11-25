import { supabase } from "./supabase";

export interface HistoryItem {
  id: string;
  source_lang: string;
  target_lang: string;
  source_text: string;
  target_text: string;
  detected_source: string | null;
  created_at: string;
}

export interface FavoriteItem {
  id: string;
  source_lang: string;
  target_lang: string;
  source_text: string;
  target_text: string;
  note: string | null;
  created_at: string;
}

export async function addHistory(entry: {
  source_lang: string;
  target_lang: string;
  source_text: string;
  target_text: string;
  detected_source?: string | null;
}): Promise<void> {
  const { error } = await supabase.from("translation_history").insert({
    source_lang: entry.source_lang,
    target_lang: entry.target_lang,
    source_text: entry.source_text.slice(0, 2000),
    target_text: entry.target_text.slice(0, 2000),
    detected_source: entry.detected_source ?? null,
  });
  if (error) console.warn("addHistory failed:", error.message);
}

export async function fetchRecentHistory(limit = 8): Promise<HistoryItem[]> {
  const { data, error } = await supabase
    .from("translation_history")
    .select("id, source_lang, target_lang, source_text, target_text, detected_source, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("fetchRecentHistory failed:", error.message);
    return [];
  }
  return (data ?? []) as HistoryItem[];
}

export async function deleteHistory(id: string): Promise<void> {
  const { error } = await supabase.from("translation_history").delete().eq("id", id);
  if (error) console.warn("deleteHistory failed:", error.message);
}

export async function addFavorite(entry: {
  source_lang: string;
  target_lang: string;
  source_text: string;
  target_text: string;
  note?: string | null;
}): Promise<FavoriteItem | null> {
  const { data, error } = await supabase
    .from("favorites")
    .insert({
      source_lang: entry.source_lang,
      target_lang: entry.target_lang,
      source_text: entry.source_text.slice(0, 2000),
      target_text: entry.target_text.slice(0, 2000),
      note: entry.note ?? null,
    })
    .select("id, source_lang, target_lang, source_text, target_text, note, created_at")
    .maybeSingle();
  if (error) {
    console.warn("addFavorite failed:", error.message);
    return null;
  }
  return data as FavoriteItem | null;
}

export async function removeFavorite(id: string): Promise<void> {
  const { error } = await supabase.from("favorites").delete().eq("id", id);
  if (error) console.warn("removeFavorite failed:", error.message);
}

export async function fetchFavorites(limit = 50): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("id, source_lang, target_lang, source_text, target_text, note, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("fetchFavorites failed:", error.message);
    return [];
  }
  return (data ?? []) as FavoriteItem[];
}

export async function fetchHistoryCount(): Promise<number> {
  const { count, error } = await supabase
    .from("translation_history")
    .select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}
