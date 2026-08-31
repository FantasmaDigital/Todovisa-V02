import supabase from "@/app/lib/supabase";

export class FormRepository {
  // ── PREFORMULARIO ────────────────────────────────────────────────────────
  static async getPreformularioProgress(userId: string) {
    const { data, error } = await supabase
      .from("preformularios")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    // Normalizar estructura retornada
    const rawData = data.form_data || {};
    const answers = data.answers || rawData.answers || {};
    const destinationCountry = data.destination_country || rawData.destination_country || "US";
    const intakeVisaClass = data.intake_visa_class || rawData.intake_visa_class || "turismo";

    return {
      ...data,
      answers,
      destination_country: destinationCountry,
      intake_visa_class: intakeVisaClass,
      current_step: data.current_step ?? 0,
      is_completed: data.is_completed ?? false,
    };
  }

  static async savePreformularioProgress(userId: string, formData: Record<string, any>, currentStep: number, isCompleted: boolean = false) {
    const answers = formData.answers || {};
    const destinationCountry = formData.destination_country || "US";
    const intakeVisaClass = formData.intake_visa_class || "turismo";

    const payload: Record<string, any> = {
      user_id: userId,
      form_data: formData,
      answers: answers,
      destination_country: destinationCountry,
      intake_visa_class: intakeVisaClass,
      current_step: currentStep,
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("preformularios")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return await supabase
        .from("preformularios")
        .update(payload)
        .eq("user_id", userId);
    } else {
      payload.created_at = new Date().toISOString();
      return await supabase
        .from("preformularios")
        .insert(payload);
    }
  }

  static async getAllPreformularios() {
    const { data, error } = await supabase
      .from("preformularios")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) return [];
    return data || [];
  }

  static async getAllViproEvaluations() {
    const { data, error } = await supabase
      .from("vipro_evaluations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return [];
    return data || [];
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

    const { data } = await supabase
      .from("vipro_evaluations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data || null;
  }

  static async saveViproEvaluation(evalData: Record<string, any>) {
    const payload = { ...evalData };
    delete payload.updated_at; // Remove updated_at column since it is not present in vipro_evaluations table schema

    if (payload.id) {
      const { data, error } = await supabase
        .from("vipro_evaluations")
        .update(payload)
        .eq("id", payload.id)
        .select();

      if (error) throw new Error(error.message);
      return data;
    } else if (payload.user_id) {
      const { data: existing } = await supabase
        .from("vipro_evaluations")
        .select("id")
        .eq("user_id", payload.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("vipro_evaluations")
          .update(payload)
          .eq("id", existing.id)
          .select();

        if (error) throw new Error(error.message);
        return data;
      }
    }

    if (!payload.created_at) {
      payload.created_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("vipro_evaluations")
      .insert(payload)
      .select();

    if (error) throw new Error(error.message);
    return data;
  }
}
