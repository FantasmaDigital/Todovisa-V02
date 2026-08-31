import supabase from "@/app/lib/supabase";

export class SettingsRepository {
  static async getAllSettings() {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*");

    if (error) {
      console.error("[SettingsRepository.getAllSettings Error]", error);
      throw new Error(error.message);
    }
    return data || [];
  }

  static async updateSettings(settings: { key: string; value: string }[]) {
    const { data, error } = await supabase
      .from("system_settings")
      .upsert(settings)
      .select();

    if (error) {
      console.error("[SettingsRepository.updateSettings Error]", error);
      throw new Error(error.message);
    }
    return data;
  }
}
