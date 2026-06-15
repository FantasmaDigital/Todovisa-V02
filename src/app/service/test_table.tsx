import { SupabaseClient } from "@supabase/supabase-js";

export class TestTableService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async get_test_table() {
        const { data, error } = await this.supabase.schema("public").from("test_table").select("*");
        if (error) throw error;
        return data;
    }

    async get_test_by_id(id: string) {
        const { data, error } = await this.supabase.schema("public").from("test_table").select("*").eq("id", id).single();
        if (error) throw error;
        return data;
    }

    async get_test_by_category(categoryId: string) {
        const { data, error } = await this.supabase.schema("public").from("test_table").select("*").eq("category_id", categoryId);
        if (error) throw error;
        return data;
    }
}