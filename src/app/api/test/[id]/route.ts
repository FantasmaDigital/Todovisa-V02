import { NextRequest, NextResponse } from "next/server";
import { TestTableService } from "@/app/service/test_table";
import supabase from "@/app/lib/supabase";
import { HttpResponse } from "@/app/utils/http.response";

// Los parámetros dinámicos se inyectan en el segundo argumento (context)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const testTableService = new TestTableService(supabase);
        
        // El service solo devuelve la data limpia
        const data = await testTableService.get_test_by_id(id);
        
        // El controlador (Route) formatea para el cliente HTTP
        const response = await HttpResponse.success(200, `Registro ${id} obtenido con éxito`, data);
        return NextResponse.json(response, { status: response.statusCode });
    } catch (error: any) {
        // En caso de que falle antes de resolver params, controlamos la referencia a id
        let errorId = "desconocido";
        try {
            const resolved = await params;
            errorId = resolved.id;
        } catch (_) {}
        const errResp = await HttpResponse.error(404, `Error al obtener el registro ${errorId}`, error);
        return NextResponse.json(errResp, { status: errResp.statusCode });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        
        // Simulación: const data = await testTableService.update_test_table(id, body);
        
        const response = await HttpResponse.success(200, `Registro ${id} actualizado correctamente`, body);
        return NextResponse.json(response, { status: response.statusCode });
    } catch (error: any) {
        const errResp = await HttpResponse.error(400, "Error al actualizar el registro", error);
        return NextResponse.json(errResp, { status: errResp.statusCode });
    }
}
