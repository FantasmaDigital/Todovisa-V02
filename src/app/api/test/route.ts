import { NextRequest, NextResponse } from "next/server";
import { TestTableService } from "@/app/service/test_table";
import supabase from "@/app/lib/supabase";
import { HttpResponse } from "@/app/utils/http.response";

export async function GET(req: NextRequest) {
    try {
        const testTableService = new TestTableService(supabase);
        const data = await testTableService.get_test_table();
        
        // Formateamos la respuesta exitosa en la capa de red (Route)
        const response = await HttpResponse.success(200, "Registros obtenidos con éxito", data);
        return NextResponse.json(response, { status: response.statusCode });
    } catch (error: any) {
        // Formateamos el error en la capa de red
        const errResp = await HttpResponse.error(400, "Error al obtener los registros", error);
        return NextResponse.json(errResp, { status: errResp.statusCode });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const testTableService = new TestTableService(supabase);
        
        // Simulación: const data = await testTableService.post_test_table(body);
        
        const response = await HttpResponse.success(201, "Datos creados exitosamente", body);
        return NextResponse.json(response, { status: response.statusCode });
    } catch (error: any) {
        const errResp = await HttpResponse.error(400, "Error al procesar la petición POST", error);
        return NextResponse.json(errResp, { status: errResp.statusCode });
    }
}
