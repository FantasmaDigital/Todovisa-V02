interface IHttpResponse {
    statusCode: number;
    message: string;
    data: any | null;
    error?: { code: string, details: any | null, hint: any | null, message: string } | null;
}

export class HttpResponse {
    static async success(statusCode: number, message: string, data: any): Promise<IHttpResponse> {
        return {
            statusCode,
            message,
            data,
            error: null
        }
    }

    static async error(statusCode: number, message: string, error: { code: string, details: any | null, hint: any | null, message: string } | null): Promise<IHttpResponse> {
        return {
            statusCode,
            message,
            data: null,
            error
        }
    }

    static async serverError() : Promise<IHttpResponse> {
        return {
            statusCode: 500,
            message: "Internal server error",
            data: null,
            error: {
                code: "INTERNAL_SERVER_ERROR",
                details: null,
                hint: null,
                message: "Internal server error"
            }
        }
    }
}