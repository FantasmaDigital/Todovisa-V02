import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function POST(request: Request) {
    let email = '', first_name = '', last_name = '', phone = '', country = '';
    try {
        const body = await request.json();
        email = body.email || body.Email || '';
        first_name = body.first_name || body.Nombre || '';
        last_name = body.last_name || body.Apellido || '';
        phone = body.phone || body.Telefono || '';
        country = body.country || body.Pais || '';
        const password = body.password || body.Password || '';
        
        // Extract VIPRO and advisor metadata, accepting both snake_case and camelCase
        const vipro_score = body.vipro_score !== undefined ? body.vipro_score : (body.viproScore || null);
        const vipro_completed = body.vipro_completed !== undefined ? body.vipro_completed : (body.viproCompleted || false);
        const vipro_destination = body.vipro_destination || body.viproDestination || null;
        const has_paid_advisor = body.has_paid_advisor !== undefined ? body.has_paid_advisor : (body.hasPaidAdvisor || false);
        const assigned_agent_id = body.assigned_agent_id || body.assignedAgentId || null;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name,
                    last_name,
                    phone,
                    country,
                    vipro_score,
                    vipro_completed,
                    vipro_destination,
                    has_paid_advisor,
                    assigned_agent_id
                }
            }
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (err: unknown) {
        console.error("Sign-up server catch error:", err);
        const errMessage = err instanceof Error ? err.message : String(err);
        const isOffline = errMessage.includes('fetch failed') || errMessage.includes('ENOTFOUND') || errMessage.includes('fetch');
        if (isOffline) {
            console.log("⚠️ Conexión de red no disponible en Supabase. Creando cuenta en MODO DEMO local.");
            const body = await request.clone().json().catch(() => ({}));
            const vipro_score = body.vipro_score !== undefined ? body.vipro_score : (body.viproScore || null);
            const vipro_completed = body.vipro_completed !== undefined ? body.vipro_completed : (body.viproCompleted || false);
            const vipro_destination = body.vipro_destination || body.viproDestination || null;
            const has_paid_advisor = body.has_paid_advisor !== undefined ? body.has_paid_advisor : (body.hasPaidAdvisor || false);
            const assigned_agent_id = body.assigned_agent_id || body.assignedAgentId || null;

            return NextResponse.json({
                data: {
                    user: {
                        id: "demo-user-123",
                        email: email,
                        user_metadata: {
                            first_name: first_name + " (Modo Demo)",
                            last_name: last_name,
                            phone: phone,
                            country: country,
                            vipro_score,
                            vipro_completed,
                            vipro_destination,
                            has_paid_advisor,
                            assigned_agent_id
                        }
                    }
                },
                is_demo: true
            }, { status: 200 });
        }
        return NextResponse.json({ error: errMessage || 'Error interno del servidor' }, { status: 500 });
    }
}