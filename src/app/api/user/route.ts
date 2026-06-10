import supabase from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}