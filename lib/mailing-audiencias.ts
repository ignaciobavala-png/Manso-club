import type { SupabaseClient } from "@supabase/supabase-js";

export type Audiencia = "newsletter" | "activos" | "vencidos" | "todos" | "especifico";

export const AUDIENCIAS: { id: Audiencia; label: string }[] = [
  { id: "newsletter", label: "Newsletter + registrados (todos los mails)" },
  { id: "activos", label: "Membresías activas" },
  { id: "vencidos", label: "Membresías vencidas" },
  { id: "todos", label: "Solo registrados en la página" },
  { id: "especifico", label: "Elegir mails específicos" },
];

async function emailsExcluidos(supabase: SupabaseClient): Promise<Set<string>> {
  const { data } = await supabase.from("mailing_exclusiones").select("email");
  return new Set((data ?? []).map((r) => r.email.toLowerCase()));
}

function sinExcluidos(emails: string[], excluidos: Set<string>): string[] {
  return emails.filter((e) => !excluidos.has(e.toLowerCase()));
}

export async function resolverAudiencia(
  supabase: SupabaseClient,
  audiencia: Audiencia,
  destinatariosEspecificos?: string[] | null
): Promise<string[]> {
  const excluidos = await emailsExcluidos(supabase);

  if (audiencia === "especifico") {
    const emails = (destinatariosEspecificos ?? []).map((e) => e.toLowerCase().trim());
    return sinExcluidos(Array.from(new Set(emails)), excluidos);
  }

  if (audiencia === "newsletter") {
    const [{ data: suscriptores }, { data: registrados }] = await Promise.all([
      supabase.from("newsletter_suscriptores").select("email"),
      supabase.from("user_profiles").select("email"),
    ]);
    const emails = [...(suscriptores ?? []), ...(registrados ?? [])].map((r) => r.email.toLowerCase());
    return sinExcluidos(Array.from(new Set(emails)), excluidos);
  }

  if (audiencia === "activos") {
    const { data } = await supabase
      .from("user_profiles")
      .select("email, membresia_activa, membresia_hasta")
      .eq("membresia_activa", true);
    const ahora = new Date();
    const emails = (data ?? [])
      .filter((u) => !u.membresia_hasta || new Date(u.membresia_hasta) > ahora)
      .map((u) => u.email);
    return sinExcluidos(emails, excluidos);
  }

  if (audiencia === "vencidos") {
    const { data } = await supabase
      .from("user_profiles")
      .select("email, membresia_activa, membresia_hasta")
      .eq("membresia_activa", true)
      .not("membresia_hasta", "is", null);
    const ahora = new Date();
    const emails = (data ?? [])
      .filter((u) => new Date(u.membresia_hasta as string) < ahora)
      .map((u) => u.email);
    return sinExcluidos(emails, excluidos);
  }

  const { data } = await supabase.from("user_profiles").select("email");
  return sinExcluidos((data ?? []).map((u) => u.email), excluidos);
}
