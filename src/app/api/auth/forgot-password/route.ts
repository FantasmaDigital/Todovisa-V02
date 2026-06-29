"use server";

import { NextResponse } from 'next/server';
import supabase from '@/app/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = body.Email;

        if (!email || !/\S+@\S+$/i.test(email)) {
             return NextResponse.json({ error: 'Por favor, introduce un correo electrónico válido.' }, { status: 400 });
        }

        // Use Supabase's built-in password reset mechanism (Magic Link)
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) {
            console.error('Supabase Password Reset Error:', error);
            return NextResponse.json({ error: 'Error al procesar la solicitud de restablecimiento.' }, { status: 500 });
        }

        // Success: Send confirmation/success message back to the client
        return NextResponse.json({ success: true, message: 'Instrucciones de restablecimiento enviadas exitosamente.' }, { status: 200 });

    } catch (error) {
        console.error('Fatal Error in Forgot Password API:', error);
        return NextResponse.json({ error: 'Error interno del servidor al procesar la solicitud.' }, { status: 500 });
    }
}