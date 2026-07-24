import supabase from "@/app/lib/supabase";

export class FormRepository {
  // ── PREFORMULARIO ────────────────────────────────────────────────────────
  static async getPreformularioProgress(userId: string) {
    const { data, error } = await supabase
      .from("preformularios")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async savePreformularioProgress(userId: string, formData: Record<string, any>, currentStep: number, isCompleted: boolean = false) {
    const { data: existing } = await supabase
      .from("preformularios")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return await supabase
        .from("preformularios")
        .update({
          form_data: formData,
          current_step: currentStep,
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    } else {
      return await supabase
        .from("preformularios")
        .insert({
          user_id: userId,
          form_data: formData,
          current_step: currentStep,
          is_completed: isCompleted,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }
  }

  // ── VIPRO EVALUATION ──────────────────────────────────────────────────────
  static async getViproEvaluation(userId: string, evalId?: string) {
    if (evalId) {
      const { data } = await supabase
        .from("vipro_evaluations")
        .select("*")
        .eq("id", evalId)
        .maybeSingle();
      if (data) return data;
    }

    const { data, error } = await supabase
      .from("vipro_evaluations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && !data) {
      // Fallback query without user_id filter if needed
      const { data: latest } = await supabase
        .from("vipro_evaluations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return latest;
    }

    return data;
  }

  static async saveViproEvaluation(evalData: Record<string, any>) {
    const { data, error } = await supabase
      .from("vipro_evaluations")
      .upsert(evalData);

    if (error) throw new Error(error.message);
    return data;
  }
}
