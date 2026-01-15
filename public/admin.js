document.addEventListener('DOMContentLoaded', () => {
    loadAdminData();
    
    // Botón de refrescar
    const refreshBtn = document.querySelector('button'); 
    if(refreshBtn) refreshBtn.addEventListener('click', loadAdminData);
});

async function loadAdminData() {
    try {
        const token = localStorage.getItem('token');

        if (!token) {
            console.error("❌ No hay token, redirigiendo...");
            window.location.href = 'index.html';
            return;
        }

        // 🔥 AQUÍ ESTABA EL PROBLEMA: AÑADIMOS EL HEADER AUTHORIZATION
        const response = await fetch('/api/admin/god-mode', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <--- ESTO ES LA LLAVE
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                alert("⛔ Sesión expirada o sin permisos. Inicia sesión de nuevo.");
                localStorage.removeItem('token');
                window.location.href = 'index.html';
                return;
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ Datos recibidos:", data); // Para depurar

        renderAdminDashboard(data);

    } catch (error) {
        console.error('Error admin:', error);
        // Opcional: Mostrar error en pantalla si quieres
    }
}

function renderAdminDashboard(data) {
    // 1. Actualizar Tarjetas Superiores
    // Usamos el operador ?. para evitar fallos si algo viene vacío
    document.getElementById('totalUsers').textContent = data.stats?.totalUsers || 0;
    document.getElementById('totalAccounts').textContent = data.stats?.totalAccounts || 0;
    
    // Cálculo ficticio de ingresos (Ej: $100 por cuenta)
    const revenue = (data.stats?.totalAccounts || 0) * 100; 
    document.getElementById('totalRevenue').textContent = `$${revenue}`;

    // 2. Rellenar Tabla
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    data.users.forEach(user => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-800 hover:bg-gray-800/50 transition-colors';
        
        // Calcular saldo total de todas las cuentas del usuario
        const totalBalance = user.accounts.reduce((acc, account) => acc + parseFloat(account.balance), 0);

        tr.innerHTML = `
            <td class="p-4 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                    ${user.email.charAt(0).toUpperCase()}
                </div>
                <span class="font-medium text-gray-200">Usuario ${user.id.toString().slice(0,4)}...</span>
            </td>
            <td class="p-4 text-gray-400">${user.email}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded text-xs font-semibold ${user.accounts.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}">
                    ${user.accounts.length} Cuentas
                </span>
            </td>
            <td class="p-4 font-mono text-gray-300">$${totalBalance.toLocaleString()}</td>
            <td class="p-4">
                <button class="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition">
                    Banear
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}