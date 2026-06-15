import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}
