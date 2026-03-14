const API_URL = '';
let currentAccountId = null;
let accountsData = []; 
let filteredAccounts = []; 
let currentAccountStatus = 'ACTIVE';
let mergeSelection = []; 

// --- SISTEMA UI MÓVIL ---
function toggleSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const backdrop = document.getElementById('mobileBackdrop');
    if(sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
    }
}
function closeSidebarMobile() {
    document.getElementById('mainSidebar').classList.add('-translate-x-full');
    document.getElementById('mobileBackdrop').classList.add('hidden');
}

// 🔥 1. SISTEMA DE TOASTS
function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const colors = type === 'success' ? 'bg-dark-card border-l-4 border-success' : 'bg-dark-card border-l-4 border-danger';
    const icon = type === 'success' ? '<i class="ph-fill ph-check-circle text-success text-xl"></i>' : '<i class="ph-fill ph-warning-circle text-danger text-xl"></i>';
    
    toast.className = `flex items-center gap-3 p-4 rounded shadow-2xl pointer-events-auto border border-dark-border slide-in-right ${colors} text-white min-w-[300px] z-[210]`;
    toast.innerHTML = `${icon} <div class="text-sm font-medium">${msg}</div>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// 🔥 2. SISTEMA MODAL UNIVERSAL
const appModal = document.getElementById('appModal');
let modalCallback = null;

function showConfirm(title, message, onConfirm, type = 'info') {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerText = message;
    
    const iconContainer = document.getElementById('modalIcon');
    if(type === 'buy') { iconContainer.innerHTML = '<i class="ph-fill ph-shopping-cart"></i>'; iconContainer.className = "w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4 text-3xl"; }
    else if(type === 'danger') { iconContainer.innerHTML = '<i class="ph-fill ph-warning"></i>'; iconContainer.className = "w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4 text-3xl"; }
    else if(type === 'success') { iconContainer.innerHTML = '<i class="ph-fill ph-trophy"></i>'; iconContainer.className = "w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4 text-3xl"; }
    else { iconContainer.innerHTML = '<i class="ph-fill ph-info"></i>'; iconContainer.className = "w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4 text-3xl"; }

    modalCallback = onConfirm;
    appModal.classList.remove('hidden');
}

function closeAppModal() {
    appModal.classList.add('hidden');
    modalCallback = null;
}

document.getElementById('modalConfirmBtn').addEventListener('click', () => {
    if(modalCallback) modalCallback();
    closeAppModal();
});

// ------------------------------------------
// MODALES Y UI
// ------------------------------------------
function showGameOver() {
    document.getElementById('gameOverModal').classList.remove('hidden');
}
function closeGameOver() {
    document.getElementById('gameOverModal').classList.add('hidden');
}

// ------------------------------------------
// NAVEGACIÓN ENTRE SECCIONES
// ------------------------------------------
function showSection(sectionId) {
    document.getElementById('terminalView').classList.add('hidden');
    document.getElementById('shopView').classList.add('hidden');
    document.getElementById('managementView').classList.add('hidden');
    
    const inactiveClass = "w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-dark-hover rounded-lg font-medium transition text-sm border border-transparent";
    document.getElementById('navTerminal').className = inactiveClass;
    document.getElementById('navShop').className = inactiveClass;
    document.getElementById('navManagement').className = inactiveClass;

    document.getElementById(sectionId + 'View').classList.remove('hidden');
    
    const activeClass = "w-full flex items-center gap-3 px-4 py-3 bg-brand/10 text-brand rounded-lg font-medium transition text-sm border border-brand/20";
    
    if(sectionId === 'terminal') {
        document.getElementById('navTerminal').className = activeClass;
        document.getElementById('pageTitle').innerHTML = '<i class="ph-fill ph-monitor text-brand"></i> Terminal de Trading';
    } else if(sectionId === 'shop') {
        document.getElementById('navShop').className = activeClass;
        document.getElementById('pageTitle').innerHTML = '<i class="ph-fill ph-shopping-cart text-brand"></i> Tienda de Cuentas';
    } else if(sectionId === 'management') {
        document.getElementById('navManagement').className = activeClass;
        document.getElementById('pageTitle').innerHTML = '<i class="ph-fill ph-squares-four text-brand"></i> Gestión de Cuentas';
        applyFilters(); 
    }

    closeSidebarMobile();
}

// ------------------------------------------
// INICIALIZACIÓN Y DATOS
// ------------------------------------------
async function initDashboard() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token) window.location.href = 'index.html';

    try {
        const res = await fetch(`${API_URL}/dashboard/${userId}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (!res.ok) throw new Error("Error en servidor");
        const data = await res.json();
        
        const playerName = (data.player && data.player.name) ? data.player.name : 'Trader';
        const inicial = playerName.charAt(0).toUpperCase();

        document.getElementById('userNameDisplay').innerText = playerName;
        document.getElementById('userIdDisplay').innerText = userId.slice(0, 8);
        
        const headerImg = document.getElementById('headerProfileImg');
        headerImg.parentElement.innerHTML = `
            <div id="headerProfileImg" class="w-10 h-10 rounded-full border-2 border-brand bg-brand/10 flex items-center justify-center text-brand font-bold text-lg shadow-lg">
                ${inicial}
            </div>
        `;

        accountsData = data.accounts.filter(a => a.status !== 'MERGED');
        filteredAccounts = [...accountsData]; 
        renderAccountsSelector();
        
        if (accountsData.length > 0) {
            selectAccount(currentAccountId || accountsData[0].id);
        } else {
            document.getElementById('accountStats').innerHTML = `<div class="col-span-4 text-center py-12 bg-dark-card rounded-xl border border-dashed border-gray-700"><p class="text-gray-400 mb-4">No tienes cuentas. ¡Empieza ya!</p><button onclick="showSection('shop')" class="bg-brand text-white px-8 py-3 rounded-xl font-bold">Ir a la Tienda</button></div>`;
        }
    } catch (error) { 
        console.error(error);
        showToast("Error de conexión", "error");
    }
}

// ------------------------------------------
// LÓGICA DE FILTRADO Y ORDENACIÓN 🔍
// ------------------------------------------
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const sortOrder = document.getElementById('sortOrder').value;

    filteredAccounts = accountsData.filter(acc => {
        if(statusFilter === 'ALL') return true;
        return acc.status === statusFilter;
    });

    filteredAccounts.sort((a, b) => {
        if(sortOrder === 'BALANCE_HIGH') return b.balance - a.balance;
        if(sortOrder === 'BALANCE_LOW') return a.balance - b.balance;
        if(sortOrder === 'NEWEST') return b.id - a.id; 
        if(sortOrder === 'OLDEST') return a.id - b.id;
        return 0;
    });

    renderManagementPanel();
}

function resetFilters() {
    document.getElementById('filterStatus').value = 'ALL';
    document.getElementById('sortOrder').value = 'NEWEST';
    applyFilters();
}

// --- GESTIÓN DE CUENTAS (RENDERIZADO) ---
function renderManagementPanel() {
    const grid = document.getElementById('managementGrid');
    
    if(filteredAccounts.length === 0) {
        grid.innerHTML = '<div class="col-span-3 text-center text-gray-500 py-10 italic">No se encontraron cuentas con estos filtros.</div>';
        return;
    }

    grid.innerHTML = filteredAccounts.map(acc => {
        let borderColor = 'border-gray-700';
        let statusBadge = '<span class="px-2 py-1 bg-gray-700 rounded text-[10px] text-white">ACTIVA</span>';
        
        if(acc.status === 'LIVE') { 
            borderColor = 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
            statusBadge = '<span class="px-2 py-1 bg-blue-600 rounded text-[10px] text-white font-bold animate-pulse">LIVE REAL</span>';
        } else if (acc.status === 'BREACHED') {
            borderColor = 'border-red-500';
            statusBadge = '<span class="px-2 py-1 bg-red-600 rounded text-[10px] text-white font-bold">QUEMADA 💀</span>';
        } else if (acc.status === 'PASSED') {
            borderColor = 'border-green-500';
            statusBadge = '<span class="px-2 py-1 bg-green-600 rounded text-[10px] text-white font-bold">APROBADA 🏆</span>';
        } else if (acc.status === 'FUNDED') {
            statusBadge = '<span class="px-2 py-1 bg-gray-600 rounded text-[10px] text-white font-bold">ARCHIVADA</span>';
        }

        const canMerge = (acc.status === 'LIVE' || acc.status === 'ACTIVE');
        const isChecked = mergeSelection.includes(acc.id) ? 'checked' : '';
        const checkHtml = canMerge ? `<input type="checkbox" onchange="toggleMergeSelection('${acc.id}')" ${isChecked} class="w-5 h-5 rounded border-gray-600 bg-dark-bg text-brand focus:ring-brand cursor-pointer z-50">` : '';

        const historyId = `hist-${acc.id}`;
        
        return `
        <div class="glass-panel p-6 rounded-xl border ${borderColor} flex flex-col gap-4 relative overflow-hidden group hover:bg-dark-card/80 transition">
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">${acc.plan}</div>
                    <div class="text-2xl font-bold text-white">$${acc.balance.toLocaleString()}</div>
                    <div class="text-xs text-gray-400 font-mono mt-1">Login: ${acc.login}</div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    ${statusBadge}
                    ${checkHtml} 
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs bg-dark-bg p-3 rounded-lg border border-dark-border">
                <div class="text-gray-500">Equidad:</div><div class="text-right text-white font-mono">$${acc.equity.toLocaleString()}</div>
                <div class="text-gray-500">Profit:</div><div class="text-right ${acc.balance >= acc.initialBalance ? 'text-green-400' : 'text-red-400'} font-mono">$${(acc.balance - (acc.initialBalance || 0)).toFixed(2)}</div>
            </div>

            <div class="flex gap-2 mt-auto">
                <button onclick="toggleHistory('${historyId}')" class="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs font-bold text-white transition">VER HISTORIAL</button>
                ${acc.status === 'BREACHED' ? `<button onclick="deleteAccount('${acc.id}')" class="px-3 py-2 rounded-lg bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white transition" title="Eliminar cuenta"><i class="ph-bold ph-trash"></i></button>` : ''}
            </div>

            <div id="${historyId}" class="hidden mt-4 pt-4 border-t border-gray-700 max-h-40 overflow-y-auto">
                <table class="w-full text-left text-[10px] text-gray-400">
                    <thead><tr><th>Símbolo</th><th>Tipo</th><th>P/L</th></tr></thead>
                    <tbody>
                        ${(acc.openTrades || []).length > 0 
                            ? (acc.openTrades || []).map(t => `<tr><td>${t.symbol}</td><td>${t.type}</td><td class="${t.profit >= 0 ? 'text-green-400' : 'text-red-400'}">$${t.profit || 'OPEN'}</td></tr>`).join('')
                            : '<tr><td colspan="3" class="text-center italic py-2">Sin operaciones abiertas</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }).join('');
}

function toggleHistory(id) {
    const el = document.getElementById(id);
    if(el) el.classList.toggle('hidden');
}

function toggleMergeSelection(accId) {
    if(mergeSelection.includes(accId)) {
        mergeSelection = mergeSelection.filter(id => id !== accId);
    } else {
        mergeSelection.push(accId);
    }

    const btnPanel = document.getElementById('mergeActionPanel');
    const btnText = document.getElementById('mergeBtnText');
    
    if(mergeSelection.length >= 2) { 
        btnPanel.classList.remove('hidden');
        btnText.innerHTML = `<i class="ph-bold ph-intersect"></i> FUSIONAR (${mergeSelection.length}) CUENTAS`;
    } else {
        btnPanel.classList.add('hidden');
    }
}

async function executeMerge() {
    showConfirm(
        "Fusión de Cuentas",
        `¿Seguro que quieres fusionar estas ${mergeSelection.length} cuentas? Los saldos se sumarán.`,
        async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/merge-accounts`, {
                    method: 'POST',
                    headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`},
                    body: JSON.stringify({ accountIds: mergeSelection }) 
                });
                
                if(res.ok) {
                    showToast("¡FUSIÓN COMPLETADA! 🧬");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    const err = await res.json();
                    showToast("Error: " + err.error, "error");
                }
            } catch(e) { showToast("Error de conexión", "error"); }
        },
        'info'
    );
}

async function deleteAccount(accId) {
    showConfirm(
        "Eliminar Cuenta",
        "⚠️ Esta acción borrará la cuenta quemada para siempre. ¿Estás seguro?",
        async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_URL}/delete-account`, {
                    method: 'POST',
                    headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`},
                    body: JSON.stringify({ accountId: accId })
                });
                if(res.ok) {
                    showToast("Cuenta eliminada correctamente.");
                    window.location.reload();
                } else {
                    showToast("Error al eliminar.", "error");
                }
            } catch(e) { showToast("Error de conexión", "error"); }
        },
        'danger'
    );
}

// --- TERMINAL LOGIC ---
function renderAccountsSelector() {
        const selector = document.getElementById('accountSelector');
        selector.innerHTML = accountsData.map(acc => {
            let statusIcon = '🔵';
            let statusText = 'ACTIVA';
            
            if(acc.status === 'BREACHED') { statusIcon = '💀'; statusText = 'QUEMADA'; }
            else if(acc.status === 'PASSED') { statusIcon = '🏆'; statusText = 'APROBADA'; }
            else if(acc.status === 'LIVE') { statusIcon = '⚡'; statusText = 'LIVE REAL'; }
            else if(acc.status === 'FUNDED') { statusIcon = '🏁'; statusText = 'ARCHIVADA'; }

            return `<option value="${acc.id}">${statusIcon} [${statusText}] - Login: ${acc.login} | $${acc.balance.toFixed(0)}</option>`;
        }).join('');
        
        if(currentAccountId && accountsData.some(a=>a.id===currentAccountId)) selector.value=currentAccountId;
        selector.onchange = (e) => selectAccount(e.target.value);
}

async function selectAccount(accId) {
    currentAccountId = accId;
    const acc = accountsData.find(a => a.id === accId);
    currentAccountStatus = acc.status;
    
    await fetch(`${API_URL}/check-risk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: accId }) });
    const evalRes = await fetch(`${API_URL}/evaluate-account`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: accId }) });
    const ev = await evalRes.json();
    
    const controls = document.getElementById('tradingControls');
    if (acc.status === 'BREACHED' || ev.verdict === 'SUSPENDIDO') {
        showGameOver();
        controls.classList.add('opacity-50', 'pointer-events-none'); 
    } else {
        closeGameOver();
        controls.classList.remove('opacity-50', 'pointer-events-none'); 
    }

    let initial = acc.initialBalance;
    if (!initial) { 
        if (acc.plan.includes('200k')) initial = 200000;
        else if (acc.plan.includes('100k')) initial = 100000;
        else if (acc.plan.includes('50k')) initial = 50000;
        else if (acc.plan.includes('10k')) initial = 10000;
        else initial = 100000;
    }
    
    if(acc.status === 'LIVE' && acc.balance > initial * 1.5) initial = acc.balance;

    const isLive = acc.status === 'LIVE';
    const profit = acc.balance - initial;

    if(isLive) {
        document.getElementById('accountStats').innerHTML = `
            <div class="glass-panel p-5 rounded-xl border-l-2 border-brand live-glow relative overflow-hidden group">
                <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition"><i class="ph-fill ph-wallet text-4xl text-brand"></i></div>
                <div class="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Balance Total</div>
                <div class="text-3xl font-bold text-white tracking-tight">$${acc.balance.toLocaleString()}</div>
            </div>
            
            <div class="glass-panel p-5 rounded-xl border-l-2 border-gold live-glow relative overflow-hidden group">
                <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition"><i class="ph-fill ph-coins text-4xl text-gold"></i></div>
                <div class="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Beneficio Retirable</div>
                <div class="text-3xl font-bold ${profit >= 0 ? 'text-gold' : 'text-gray-400'} tracking-tight">
                    ${profit > 0 ? '+' : ''}$${profit.toLocaleString()}
                </div>
            </div>

            <div class="glass-panel p-5 rounded-xl border-l-2 border-purple-500 relative overflow-hidden group">
                <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition"><i class="ph-fill ph-chart-line-up text-4xl text-purple-500"></i></div>
                <div class="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Equidad</div>
                <div class="text-2xl font-bold text-white">$${acc.equity.toLocaleString()}</div>
            </div>

            <div class="glass-panel p-5 rounded-xl border-l-2 border-blue-500 relative overflow-hidden group bg-blue-500/10">
                <div class="absolute right-0 top-0 p-4 opacity-20 group-hover:opacity-30 transition"><i class="ph-fill ph-crown text-4xl text-blue-400"></i></div>
                <div class="text-blue-300 text-[10px] font-bold uppercase mb-1 tracking-widest">Estado</div>
                <div class="text-xl font-bold text-white flex items-center gap-2">
                    TRADER PRO <i class="ph-fill ph-seal-check text-blue-400"></i>
                </div>
            </div>
        `;
    } else {
        document.getElementById('accountStats').innerHTML = `
            <div class="glass-panel p-5 rounded-xl border-l-2 border-brand relative overflow-hidden group">
                <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition"><i class="ph-fill ph-wallet text-4xl text-brand"></i></div>
                <div class="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Balance</div>
                <div class="text-2xl font-bold text-white">$${acc.balance.toFixed(2)}</div>
            </div>
            <div class="glass-panel p-5 rounded-xl border-l-2 border-purple-500 relative overflow-hidden group">
                <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition"><i class="ph-fill ph-chart-line-up text-4xl text-purple-500"></i></div>
                <div class="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Equidad</div>
                <div class="text-2xl font-bold text-white">$${acc.balance.toFixed(2)}</div>
            </div>
            <div class="glass-panel p-5 rounded-xl border-l-2 border-orange-500 relative overflow-hidden group">
                    <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition"><i class="ph-fill ph-medal text-4xl text-orange-500"></i></div>
                <div class="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Plan & Apalancamiento</div>
                <div class="text-xl font-bold text-white truncate">${acc.plan} <span class="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded ml-1">1:100</span></div>
            </div>
            <div class="glass-panel p-5 rounded-xl border-l-2 ${acc.status === 'ACTIVE' ? 'border-success' : (acc.status === 'PASSED' ? 'border-brand' : 'border-danger')} relative overflow-hidden group">
                <div class="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition"><i class="ph-fill ph-activity text-4xl"></i></div>
                <div class="text-gray-500 text-[10px] font-bold uppercase mb-1 tracking-widest">Estado</div>
                <div class="text-xl font-bold text-white">${acc.status}</div>
            </div>
        `;
    }

    const maxLoss = initial * 0.10;
    const dailyMax = initial * 0.05;

    if (isLive) {
        document.getElementById('profitProgressText').innerText = "SIN LÍMITE 🚀";
        document.getElementById('profitProgressBar').style.width = "100%";
        document.getElementById('profitProgressBar').className = "progress-bar bg-blue-500 h-2 rounded-full animate-pulse shadow-[0_0_10px_blue]"; 
        document.getElementById('targetMoneyContainer').innerHTML = "<span class='text-blue-400 font-bold text-xs'>100% Tuyo</span>";
    } else {
        const profitTarget = initial * 0.08;
        const profitPercentReal = (ev.profit / initial) * 100;
        const profitBar = Math.max(0, Math.min(100, (ev.profit / profitTarget) * 100));
        
        document.getElementById('profitProgressText').innerText = `${profitPercentReal.toFixed(2)}% / 8%`;
        document.getElementById('profitProgressBar').className = "progress-bar bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full";
        document.getElementById('profitProgressBar').style.width = `${profitBar}%`;
        document.getElementById('targetMoneyContainer').innerHTML = `<span>Falta:</span> <span class="text-white font-mono">$<span id="targetMoney">${(profitTarget - ev.profit).toFixed(2)}</span></span>`;
    }

    const currentTotalLoss = initial - acc.equity;
    let totalLossPercent = 0;
    let totalBar = 0;
    if (currentTotalLoss > 0) {
        totalLossPercent = (currentTotalLoss / initial) * 100;
        totalBar = (currentTotalLoss / maxLoss) * 100;
    }
    document.getElementById('ddProgressBar').style.width = `${Math.min(100, totalBar)}%`;
    document.getElementById('ddProgressText').innerText = `-${totalLossPercent.toFixed(2)}% / 10%`;
    document.getElementById('maxLossMoney').innerText = (maxLoss - currentTotalLoss).toFixed(2);

    const dailyStart = acc.dailyStartBalance || initial;
    const currentDailyLoss = dailyStart - acc.equity;
    let dailyLossPercent = 0;
    let dailyBar = 0;
    if (currentDailyLoss > 0) {
        dailyLossPercent = (currentDailyLoss / initial) * 100;
        dailyBar = (currentDailyLoss / dailyMax) * 100;
    }
    document.getElementById('dailyProgressBar').style.width = `${Math.min(100, dailyBar)}%`;
    document.getElementById('dailyProgressText').innerText = `-${dailyLossPercent.toFixed(2)}% / 5%`;
    document.getElementById('dailyLossMoney').innerText = (dailyMax - currentDailyLoss).toFixed(2);

    if (isLive) {
            document.getElementById('daysProgressText').innerText = "ILIMITADO";
            document.getElementById('daysProgressBar').style.width = "100%";
            document.getElementById('daysLabel').innerText = "Modo Profesional";
    } else {
        document.getElementById('daysProgressBar').style.width = `${(ev.validDays / 5) * 100}%`;
        document.getElementById('daysProgressText').innerText = `${ev.validDays} / 5`;
        document.getElementById('daysLabel').innerText = "Consistencia Requerida";
    }

    const badge = document.getElementById('verdictBadge');
    const existingBtn = document.getElementById('claimButton');
    if(existingBtn) existingBtn.remove();
    
    if (acc.status === 'PASSED' || ev.verdict === 'APROBADO') {
        badge.innerText = "¡APROBADO!"; 
        badge.className = "px-3 py-0.5 rounded-full text-[10px] font-bold bg-success text-white animate-pulse border border-green-500 shadow-[0_0_10px_green]";
        
        if(acc.status !== 'FUNDED') {
            document.getElementById('accountStats').insertAdjacentHTML('afterend', `
                <div id="claimButton" class="mt-4 bg-gradient-to-r from-yellow-600 to-yellow-400 p-1 rounded-xl shadow-lg shadow-yellow-500/20 animate-bounce cursor-pointer" onclick="claimFunded('${acc.id}')">
                    <div class="bg-dark-bg/90 hover:bg-dark-bg/50 text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-3 uppercase tracking-widest border border-yellow-500">
                        <i class="ph-fill ph-trophy text-2xl text-yellow-400"></i>
                        Reclamar Cuenta Fondeada ($${initial.toLocaleString()})
                    </div>
                </div>
            `);
        }
    } else if (acc.status === 'BREACHED' || ev.verdict === 'SUSPENDIDO') {
        badge.innerText = "SUSPENDIDO (QUEMADA)"; 
        badge.className = "px-3 py-0.5 rounded-full text-[10px] font-bold bg-danger text-white border border-red-500 shadow-[0_0_10px_red]";
        document.getElementById('ddProgressBar').className = "progress-bar bg-danger h-2 rounded-full";
        document.getElementById('dailyProgressBar').className = "progress-bar bg-danger h-2 rounded-full";
    } else if (acc.status === 'LIVE') {
        badge.innerText = "CUENTA REAL (LIVE)"; 
        badge.className = "px-3 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white border border-blue-400 shadow-[0_0_10px_blue]";
    } else {
        badge.innerText = "EN PROGRESO"; 
        badge.className = "px-3 py-0.5 rounded-full text-[10px] font-bold bg-gray-700 text-gray-300 border border-gray-600";
    }

    updateTrades(acc);
}

// --- CORRECCIÓN DE LA TABLA DE TRADES (Línea 527 aprox de tu imagen) ---
async function updateTrades(acc) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/account-analysis/${acc.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const analysis = await res.json();
    
    const allTrades = [...(acc.openTrades || []), ...analysis.history];

    let html = allTrades.map(t => {
        const isClosed = t.status === 'CLOSED';
        const profitClass = t.profit >= 0 ? 'text-success' : 'text-danger';
        const typeClass = t.type === 'BUY' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
        
        // CORRECCIÓN: Usamos el capital inicial de la cuenta para el % real
        const capitalReferencia = acc.initialBalance || 100000;
        const percentValue = ((t.profit / capitalReferencia) * 100).toFixed(2);
        const percentClass = percentValue >= 0 ? 'text-success' : 'text-danger';
        
        const dateObj = new Date(t.closeTime || t.openTime);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        return `
        <tr class="border-b border-dark-border text-xs hover:bg-dark-hover transition">
            <td class="p-4 text-gray-500">${dateStr}</td>
            <td class="p-4 font-mono text-gray-500">#${t.ticket || t.id.slice(0,6)}</td>
            <td class="p-4 font-bold text-white">${t.symbol}</td>
            <td class="p-4"><span class="px-2 py-1 rounded border ${typeClass} font-bold text-[10px]">${t.type}</span></td>
            <td class="p-4 text-gray-300">${t.lots}</td>
            <td class="p-4 text-gray-400">${t.openPrice}</td>
            <td class="p-4 text-gray-400">${t.closePrice || '...'}</td>
            <td class="p-4 text-center font-bold ${percentClass}">${percentValue > 0 ? '+' : ''}${percentValue}%</td>
            <td class="p-4 font-bold ${profitClass} text-sm">$${t.profit.toFixed(2)}</td>
            <td class="p-4 text-right">
                ${!isClosed 
                    ? `<button onclick="closeTrade('${t.id}')" class="bg-brand text-white px-3 py-1.5 rounded text-[10px] font-bold hover:bg-brand-dark transition shadow-lg shadow-brand/20">CERRAR</button>` 
                    : '<span class="text-gray-600 font-bold text-[10px] uppercase">FINALIZADO</span>'}
            </td>
        </tr>`;
    }).join('');
    
    document.getElementById('tradesTableBody').innerHTML = html || '<tr><td colspan="10" class="p-8 text-center text-gray-500 italic">No hay operaciones registradas.</td></tr>';
}

// --- CORRECCIÓN DE LA GESTIÓN DE CUENTAS (Eliminada la función duplicada) ---
function renderManagementPanel() {
    const grid = document.getElementById('managementGrid');
    
    if(filteredAccounts.length === 0) {
        grid.innerHTML = '<div class="col-span-3 text-center text-gray-500 py-10 italic">No se encontraron cuentas.</div>';
        return;
    }

    grid.innerHTML = filteredAccounts.map(acc => {
        let borderColor = 'border-gray-700';
        let statusBadge = '<span class="px-2 py-1 bg-gray-700 rounded text-[10px] text-white">ACTIVA</span>';
        
        if(acc.status === 'LIVE') { 
            borderColor = 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
            statusBadge = '<span class="px-2 py-1 bg-blue-600 rounded text-[10px] text-white font-bold animate-pulse">LIVE REAL</span>';
        } else if (acc.status === 'BREACHED') {
            borderColor = 'border-red-500';
            statusBadge = '<span class="px-2 py-1 bg-red-600 rounded text-[10px] text-white font-bold">QUEMADA 💀</span>';
        }

        // Checkbox de fusión (Solo para LIVE según tu servidor)
        const isChecked = mergeSelection.includes(acc.id) ? 'checked' : '';
        const checkHtml = acc.status === 'LIVE' ? `<input type="checkbox" onchange="toggleMergeSelection('${acc.id}')" ${isChecked} class="w-5 h-5 rounded border-gray-600 bg-dark-bg text-brand focus:ring-brand cursor-pointer z-50">` : '';

        return `
        <div class="glass-panel p-6 rounded-xl border ${borderColor} flex flex-col gap-4 relative group hover:bg-dark-card/80 transition">
            <div class="flex justify-between items-start">
                <div>
                    <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">${acc.plan}</div>
                    <div class="text-2xl font-bold text-white">$${acc.balance.toLocaleString()}</div>
                    <div class="text-xs text-gray-400 font-mono mt-1">Login: ${acc.login}</div>
                </div>
                <div class="flex flex-col items-end gap-2">
                    ${statusBadge}
                    ${checkHtml}
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs bg-dark-bg p-3 rounded-lg border border-dark-border">
                <div class="text-gray-500">Equidad:</div><div class="text-right text-white font-mono">$${acc.equity.toLocaleString()}</div>
                <div class="text-gray-500">Profit:</div><div class="text-right ${acc.balance >= acc.initialBalance ? 'text-green-400' : 'text-red-400'} font-mono">$${(acc.balance - (acc.initialBalance || 0)).toFixed(2)}</div>
            </div>
            <div class="flex gap-2 mt-auto">
                <button onclick="toggleHistory('hist-${acc.id}')" class="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs font-bold text-white transition">VER HISTORIAL</button>
            </div>
            <div id="hist-${acc.id}" class="hidden mt-4 pt-4 border-t border-gray-700 max-h-40 overflow-y-auto">
                 <p class="text-[10px] text-gray-500 italic">Cargando...</p>
            </div>
        </div>`;
    }).join('');
}

function tryTrade(type) {
    if(currentAccountStatus === 'BREACHED') { 
        showToast("Cuenta bloqueada por infracción.", "error"); 
        return;
    }

    const symbol = document.getElementById('symbolSelector').value;
    const lots = document.getElementById('lotSize').value;
    const token = localStorage.getItem('token');
    if(!currentAccountId) return showToast("Selecciona una cuenta.", "error");
    
    showConfirm(
        `Confirmar Orden ${type}`, 
        `¿Abrir posición ${type} de ${lots} lotes en ${symbol}?`, 
        async () => {
            try {
                const res = await fetch(`${API_URL}/place-trade`, { 
                    method: 'POST', 
                    headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`}, 
                    body: JSON.stringify({accountId:currentAccountId, symbol, type, lots}) 
                });
                
                if(!res.ok) {
                    const err = await res.json();
                    showToast("Error: " + err.error, "error");
                } else {
                    showToast(`Orden ${type} ejecutada con éxito`);
                    initDashboard();
                }
            } catch(e) { showToast("Error al operar", "error"); }
        },
        'info'
    );
}

function placeTrade(type) { tryTrade(type); }

async function closeTrade(tradeId) {
    const token = localStorage.getItem('token');
    try { 
        await fetch(`${API_URL}/close-trade`, { 
            method: 'POST', 
            headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`}, 
            body: JSON.stringify({tradeId}) 
        }); 
        showToast("Operación cerrada"); 
        initDashboard(); 
    } catch(e) { showToast("Error al cerrar", "error"); }
}

function tryPurchase(planName) {
    showConfirm(
        "Confirmar Compra",
        `¿Deseas adquirir el plan ${planName}? El pago es único.`,
        async () => {
            const userId = localStorage.getItem('userId');
            try {
                const res = await fetch(`${API_URL}/create-account`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, planName })
                });
                if(res.ok) {
                    showToast("¡Cuenta comprada con éxito! 🚀");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    showToast("Error en la compra.", "error");
                }
            } catch(e) { showToast("Error de conexión", "error"); }
        },
        'buy'
    );
}

async function claimFunded(accountId) {
        showConfirm("Reclamar Cuenta Real", "¿Estás listo para pasar a LIVE? Se archivará la evaluación.", async () => {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/claim-funded`, { method: 'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body: JSON.stringify({accountId}) });
            showToast("¡Felicidades! Cuenta Real entregada 🏆");
            initDashboard();
        }, 'success');
}

function adjustLots(delta) {
        const input = document.getElementById('lotSize');
        let val = parseFloat(input.value) + delta;
        if(val < 0.01) val = 0.01;
        input.value = val.toFixed(1);
}

function logout() { 
    showConfirm("Cerrar Sesión", "¿Seguro que quieres salir?", () => { 
        localStorage.clear(); 
        window.location.href='index.html'; 
    }, 'danger'); 
}

function checkAutoBuy() {
    const urlParams = new URLSearchParams(window.location.search);
    const planToBuy = urlParams.get('buyPlan');
    if (planToBuy) {
        showSection('shop');
        window.history.replaceState({}, document.title, "dashboard.html");
    }
}

// 🔥 GRÁFICO REPARADO Y OPTIMIZADO
function loadTradingView(symbol = "BINANCE:BTCUSD") {
    let finalSymbol = symbol;
    if (!symbol.includes(':')) {
        if (['BTCUSD', 'ETHUSD'].includes(symbol)) finalSymbol = 'BINANCE:' + symbol;
        else if (['XAUUSD', 'EURUSD'].includes(symbol)) finalSymbol = 'OANDA:' + symbol;
        else finalSymbol = 'NASDAQ:' + symbol; 
    }

    new TradingView.widget({
        "autosize": true,
        "symbol": finalSymbol,
        "interval": "15",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "es",
        "enable_publishing": false,
        "backgroundColor": "#0b0f19",
        "gridColor": "#1f2937",
        "hide_top_toolbar": false,
        "hide_side_toolbar": true,
        "allow_symbol_change": false,
        "save_image": false,
        "container_id": "tradingview_container",
        "disabled_features": [
            "header_symbol_search",
            "header_compare"
        ]
    });
}

// 🔥 INICIALIZACIÓN ULTRARRÁPIDA (Carga cuentas al instante)
document.getElementById('symbolSelector').addEventListener('change', (e) => loadTradingView(e.target.value));

// Ejecutamos la lógica de cuentas de inmediato
checkAutoBuy();
initDashboard();

// 🔥 EL TRUCO DE VELOCIDAD:
// Bajamos el delay al mínimo (300ms) para que el gráfico salga casi al instante
// pero sin bloquear la "ruedita" de carga del navegador.
setTimeout(() => {
    loadTradingView();
}, 300);