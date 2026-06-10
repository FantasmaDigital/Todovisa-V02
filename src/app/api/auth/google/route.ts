import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { redirectTo } = body;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo || undefined
            }
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ url: data.url }, { status: 200 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
    }
}
