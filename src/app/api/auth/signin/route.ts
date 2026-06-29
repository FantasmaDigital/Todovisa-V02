import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function POST(request: Request) {
    let email = '';
    try {
        const body = await request.json();
        email = body.email || body.Email || '';
        const password = body.password || body.Password || '';

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (err: unknown) {
        console.error("Sign-in server catch error:", err);
        const errMessage = err instanceof Error ? err.message : String(err);
        const isOffline = errMessage.includes('fetch failed') || errMessage.includes('ENOTFOUND') || errMessage.includes('fetch');
        if (isOffline) {
            console.log("⚠️ Conexión de red no disponible en Supabase. Iniciando sesión en MODO DEMO local.");
            return NextResponse.json({
                data: {
                    user: {
                        id: "demo-user-123",
                        email: email,
                        user_metadata: {
                            first_name: "Juan (Modo Demo)",
                            last_name: "Pérez",
                            phone: "+503 7000 0000",
                            country: "El Salvador"
                        }
                    }
                },
                is_demo: true
            }, { status: 200 });
        }
        return NextResponse.json({ error: errMessage || 'Error interno del servidor' }, { status: 500 });
    }
}
