"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [allData, setAllData] = useState<any>(null);
  const [singleData, setSingleData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>(null);

  useEffect(() => {
    // 1. Llamada a la ruta base (obtiene todos)
    fetch("/api/test")
      .then((res) => res.json())
      .then((data) => setAllData(data));

    // 2. Llamada a la ruta dinámica por ID (ej: id 1)
    fetch("/api/test/1")
      .then((res) => res.json())
      .then((data) => setSingleData(data));

    // 3. Llamada a la ruta dinámica por Categoría (ej: id 5)
    fetch("/api/test/category/5")
      .then((res) => res.json())
      .then((data) => setCategoryData(data));
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center min-h-screen bg-zinc-50 font-sans dark:bg-black text-black dark:text-white py-12">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-start gap-8 px-8">
        
        <h1 className="text-4xl font-bold mb-4">Prueba de Consumo de APIs</h1>

        {/* Bloque 1: Ruta Base */}
        <section className="w-full bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">1. GET Todos (/api/test)</h2>
          <p className="text-sm text-gray-500 mb-4">Esta petición llama a la ruta que configuramos en la raíz de la carpeta test.</p>
          <pre className="text-sm bg-zinc-950 text-green-400 p-4 rounded-lg overflow-auto max-h-60 border border-zinc-800">
            {allData ? JSON.stringify(allData, null, 2) : "Cargando..."}
          </pre>
        </section>

        {/* Bloque 2: Ruta Dinámica por ID */}
        <section className="w-full bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">2. GET por ID (/api/test/1)</h2>
          <p className="text-sm text-gray-500 mb-4">Aquí el endpoint captura dinámicamente el "1" y lo busca en la base de datos.</p>
          <pre className="text-sm bg-zinc-950 text-blue-400 p-4 rounded-lg overflow-auto max-h-60 border border-zinc-800">
            {singleData ? JSON.stringify(singleData, null, 2) : "Cargando..."}
          </pre>
        </section>

        {/* Bloque 3: Ruta Dinámica por Categoría */}
        <section className="w-full bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-2">3. GET por Categoría (/api/test/category/5)</h2>
          <p className="text-sm text-gray-500 mb-4">Esta ruta captura el "5" bajo la carpeta category.</p>
          <pre className="text-sm bg-zinc-950 text-purple-400 p-4 rounded-lg overflow-auto max-h-60 border border-zinc-800">
            {categoryData ? JSON.stringify(categoryData, null, 2) : "Cargando..."}
          </pre>
        </section>

      </main>
    </div>
  );
}
