// admin.js
const API_URL = '';

async function loadAdminData() {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = 'index.html';

    try {
        const res = await fetch(`${API_URL}/api/admin/god-mode`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 403) {
            alert("🚨 ALERTA DE SEGURIDAD 🚨\nNo eres administrador. Se ha registrado este intento.");
            window.location.href = 'dashboard.html';
            return;
        }

        const data = await res.json();
        renderAdminDashboard(data);

    } catch (error) {
        console.error("Error admin:", error);
    }
}

function renderAdminDashboard(data) {
    // 1. Stats
    document.getElementById('totalUsers').innerText = data.stats.totalUsers;
    document.getElementById('totalAccounts').innerText = data.stats.totalAccounts;
    
    // Calculo rápido de ingresos (Fake por ahora: $100 por cuenta aprox)
    document.getElementById('revenue').innerText = (data.stats.totalAccounts * 100).toLocaleString();

    // 2. Tabla
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = data.users.map(user => {
        const totalBalance = user.accounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        return `
            <tr class="hover:bg-gray-900 transition">
                <td class="p-4 font-bold text-white">
                    ${user.name} <br>
                    <span class="text-[10px] text-gray-500 font-mono">${user.id}</span>
                </td>
                <td class="p-4 text-gray-400">${user.email}</td>
                <td class="p-4 text-center">
                    <span class="bg-gray-800 px-2 py-1 rounded text-xs font-bold">${user.accounts.length}</span>
                </td>
                <td class="p-4 text-center font-mono text-green-400">
                    $${totalBalance.toLocaleString()}
                </td>
                <td class="p-4 text-right">
                    <button class="text-blue-400 hover:text-white text-xs underline">Ver Detalles</button>
                </td>
            </tr>
        `;
    }).join('');
}

loadAdminData();