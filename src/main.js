// App Vite - espelha preview.html para ambiente dev com proxy
document.getElementById('app').innerHTML = `
    <p class="text-center text-lg text-gray-600">Esta é a versão Vite do demo. Use <strong>npm run dev</strong> para proxy automático à API.</p>
    <p class="text-center">Abra <a href="preview.html" class="text-blue-600 underline">preview.html</a> para teste completo sem servidor frontend.</p>
`;

// Mesmo JS da preview pode ser importado, mas mantido simples
console.log('Vite app rodando com proxy para backend!');