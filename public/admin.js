document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Admin Panel Iniciado");
    loadAdminData();
    
    const refreshBtn = document.querySelector('button'); 
    if(refreshBtn) refreshBtn.addEventListener('click', loadAdminData);
});

async function loadAdminData() {
    try {
        const token = localStorage.getItem('token'); // O 'authToken' si cambiaste el nombre
        
        if (!token) {
            console.error("❌ No hay token found");
            // window.location.href = 'index.html'; // Descomentar en producción
            return;
        }

        const response = await fetch('/api/admin/god-mode', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.error("❌ Error servidor:", response.status);
            return;
        }

        const data = await response.json();
        console.log("✅ DATOS RECIBIDOS DEL BACKEND:", data); // Mira esto en consola
        renderAdminDashboard(data);

    } catch (error) {
        console.error('❌ Error crítico admin:', error);
    }
}

function renderAdminDashboard(data) {
    // 1. PINTAR CONTADORES
    // Usamos '0' como fallback si viene null
    document.getElementById('totalUsers').textContent = data.stats?.totalUsers || 0;
    document.getElementById('totalAccounts').textContent = data.stats?.totalAccounts || 0;
    
    // Calcular dinero (Ej: 100$ por cuenta)
    const revenue = (data.stats?.totalAccounts || 0) * 100; 
    document.getElementById('totalRevenue').textContent = `$${revenue.toLocaleString()}`;

    // 2. PINTAR TABLA
    const tbody = document.getElementById('userTableBody');
    
    if (!tbody) {
        console.error("❌ ERROR HTML: No encuentro <tbody id='userTableBody'> en tu HTML.");
        return;
    }

    tbody.innerHTML = ''; // Limpiar tabla

    // Verificamos si hay usuarios
    if (!data.users || data.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No hay usuarios registrados aún.</td></tr>';
        return;
    }

    // Bucle para pintar filas
    data.users.forEach(user => {
        // Protección contra cuentas nulas
        const cuentas = user.accounts || [];
        const saldoTotal = cuentas.reduce((acc, c) => acc + Number(c.balance), 0);

        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-800 hover:bg-gray-800/50 transition-colors';
        
        tr.innerHTML = `
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        ${user.email.charAt(0).toUpperCase()}
                    </div>
                    <span class="text-gray-300 font-medium text-sm">ID: ${user.id.toString().substring(0, 6)}...</span>
                </div>
            </td>
            <td class="p-4 text-gray-400 text-sm">${user.email}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded text-xs font-semibold ${cuentas.length > 0 ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}">
                    ${cuentas.length} Cuentas
                </span>
            </td>
            <td class="p-4 font-mono text-green-400 text-sm font-bold">
                $${saldoTotal.toLocaleString()}
            </td>
            <td class="p-4">
                <button class="text-xs bg-red-900/30 text-red-400 border border-red-900 px-3 py-1 rounded hover:bg-red-900/60 transition">
                    Banear
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}