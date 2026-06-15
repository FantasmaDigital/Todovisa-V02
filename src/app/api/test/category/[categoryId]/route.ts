import { NextRequest, NextResponse } from "next/server";
import { TestTableService } from "@/app/service/test_table";
import supabase from "@/app/lib/supabase";
import { HttpResponse } from "@/app/utils/http.response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
    try {
        const { categoryId } = await params;
        const testTableService = new TestTableService(supabase);
        
        const data = await testTableService.get_test_by_category(categoryId);
        
        const response = await HttpResponse.success(200, `Registros de la categoría ${categoryId} obtenidos`, data);
        return NextResponse.json(response, { status: response.statusCode });
    } catch (error: any) {
        let errorId = "desconocida";
        try {
            const resolved = await params;
            errorId = resolved.categoryId;
        } catch (_) {}
        const errResp = await HttpResponse.error(404, `Error al obtener la categoría ${errorId}`, error);
        return NextResponse.json(errResp, { status: errResp.statusCode });
    }
}
