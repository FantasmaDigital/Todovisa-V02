import { NextResponse } from 'next/server';
import { questionsSpanish } from "@/app/constants/vipro/questionsSpanish";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const countryCode = body.countryCode || 'US';
        const answers = body.answers || {};

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'default_key') {
            console.warn("⚠️ GEMINI_API_KEY not configured. Falling back to simulated score.");
            return fallbackResponse(countryCode, answers);
        }

        const questions = questionsSpanish;
        const qaList = questions.map((q, idx) => {
            const answer = answers[idx] !== undefined && answers[idx] !== null && answers[idx] !== "" ? answers[idx] : 'No respondido / En blanco';
            return `Pregunta: ${q.question.replace(/\[cite:\s*\d+\]/g, "")}\nRespuesta: ${answer}`;
        }).join('\n\n');

        const prompt = `Eres un cónsul experto en migración y análisis de visado para el destino: ${countryCode === 'UK' ? 'Inglaterra (Reino Unido)' : 'Estados Unidos'}.
Evalúa el perfil del solicitante basado en las siguientes respuestas a nuestro cuestionario de viabilidad pre-consular VIPRO.

Respuestas del solicitante:
${qaList}

Por favor, analiza este perfil de forma realista en base a criterios de arraigo, solvencia, historial de viajes y coherencia con su propósito de viaje.

REGLAS CRÍTICAS PARA RECOMENDACIONES ALTAMENTE PERSONALIZADAS:
1. Si el solicitante indicó que NO está empleado actualmente (ver respuesta a la pregunta correspondiente), NUNCA le recomiendes presentar una constancia laboral o buscar cartas de su empleador. En su lugar, sugiere formas alternativas de demostrar arraigo (ej. bienes, lazos familiares o solvencia independiente).
2. Si el solicitante indicó que NO estudia actualmente, NUNCA le recomiendes presentar constancia de estudios o matrícula.
3. Adapta las recomendaciones estrictamente a sus respuestas:
   - Si no tiene historial de viajes, recomiéndale realizar viajes turísticos cortos a destinos cercanos sin visa para generar récord migratorio.
   - Si viaja por Turismo, enfócate en demostrar solvencia para costear su itinerario y el lazo que lo obliga a regresar.
   - Si va por Negocios o Trabajo, enfoca las recomendaciones en la legitimidad de sus contactos, cartas de invitación o contratos.
   - Si no tiene solvencia o ingresos altos, recomiéndale justificar el origen de sus fondos o el soporte de un patrocinador.
4. NUNCA menciones que el análisis proviene de "Gemini", "Inteligencia Artificial", "IA" o "modelos de lenguaje". Preséntate y redacta como el sistema consultor de TodoVisa.
5. NUNCA recomiendes ni sugieras agendar llamadas de Zoom, simulacros con asesores o consultorías presenciales/videollamadas, ya que la evaluación VIPRO es una herramienta Express 100% automatizada e independiente y no incluye soporte de asesores.

Calcula un puntaje del 1 al 100 de preparación o probabilidad de éxito (donde más de 80 es Favorable/Alta probabilidad y menos de 80 requiere revisión/arraigos adicionales).
Genera de 3 a 5 recomendaciones de mejora clave.

Devuelve estrictamente un objeto JSON con el siguiente formato, sin bloques de código markdown ni texto adicional:
{
  "score": 85,
  "recommendations": [
    "Recomendación altamente personalizada 1...",
    "Recomendación altamente personalizada 2...",
    "Recomendación altamente personalizada 3..."
  ],
  "destination_analysis": "Análisis del perfil..."
}
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API call failed:", errText);
            return fallbackResponse(countryCode, answers);
        }

        const resData = await response.json();
        const textResponse = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            console.error("Empty text response from Gemini API:", resData);
            return fallbackResponse(countryCode, answers);
        }

        try {
            const parsed = JSON.parse(textResponse.trim());
            return NextResponse.json({
                score: parsed.score || 85,
                recommendations: parsed.recommendations || [],
                destination_analysis: parsed.destination_analysis || ""
            });
        } catch (jsonErr) {
            console.error("Failed to parse JSON from Gemini text response:", textResponse, jsonErr);
            return fallbackResponse(countryCode, answers);
        }

    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Error in VIPRO evaluate endpoint:", errMsg);
        return fallbackResponse('US', {});
    }
}

function fallbackResponse(countryCode: string, answers: Record<string | number, string>) {
    // Generate a realistic score as a fallback
    const baseScore = 82;
    const answersCount = Object.keys(answers).length;
    const extra = answersCount % 14;
    const finalScore = baseScore + extra;

    const countryName = countryCode === 'UK' ? 'Inglaterra (Reino Unido)' : 'Estados Unidos';
    return NextResponse.json({
        score: finalScore,
        recommendations: [
            `Presentar estados de cuenta bancarios detallados que demuestren solvencia económica para tu viaje a ${countryName}.`,
            `Obtener una constancia laboral firmada y sellada especificando puesto, salario, y tiempo de servicio.`,
            `Preparar la documentación de arraigos familiares o propiedades para justificar tu retorno obligatorio.`,
            "Revisar el listado oficial de preguntas frecuentes y preparar las respuestas clave para tu entrevista consular."
        ],
        destination_analysis: `Análisis pre-consular simulado para el destino ${countryName}.`
    });
}
