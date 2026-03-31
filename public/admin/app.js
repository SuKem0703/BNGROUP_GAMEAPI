const elements = {
    authForm: document.getElementById('auth-form'),
    adminSecret: document.getElementById('admin-secret'),
    authMessage: document.getElementById('auth-message'),
    refreshButton: document.getElementById('refresh-button'),
    searchInput: document.getElementById('search-input'),
    userList: document.getElementById('user-list'),
    listCaption: document.getElementById('list-caption'),
    summaryTotal: document.getElementById('summary-total'),
    summaryActive: document.getElementById('summary-active'),
    summaryWarn: document.getElementById('summary-warn'),
    summaryBan: document.getElementById('summary-ban'),
    emptyState: document.getElementById('empty-state'),
    detailView: document.getElementById('detail-view'),
    detailCaption: document.getElementById('detail-caption'),
    detailName: document.getElementById('detail-name'),
    detailStatusBadge: document.getElementById('detail-status-badge'),
    detailAccountId: document.getElementById('detail-account-id'),
    detailEmail: document.getElementById('detail-email'),
    detailCreated: document.getElementById('detail-created'),
    detailLastSave: document.getElementById('detail-last-save'),
    statusForm: document.getElementById('status-form'),
    statusSelect: document.getElementById('status-select'),
    currencyForm: document.getElementById('currency-form'),
    coinInput: document.getElementById('coin-input'),
    gemInput: document.getElementById('gem-input'),
    statsGrid: document.getElementById('stats-grid'),
    activityGrid: document.getElementById('activity-grid'),
    saveParsed: document.getElementById('save-parsed'),
    saveRaw: document.getElementById('save-raw')
};

const statusMap = {
    0: { label: 'None', className: '' },
    1: { label: 'Warn', className: 'warn' },
    2: { label: 'Ban', className: 'ban' },
    3: { label: 'Unbanned', className: '' }
};

const state = {
    adminSecret: localStorage.getItem('adminSecret') || '',
    users: [],
    selectedAccountId: null
};

elements.adminSecret.value = state.adminSecret;

function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function statusLabel(status) {
    return statusMap[status] || { label: `Unknown (${status})`, className: '' };
}

function setAuthMessage(message, isError = false) {
    elements.authMessage.textContent = message;
    elements.authMessage.style.color = isError ? '#b42318' : '';
}

async function apiFetch(path, options = {}) {
    const response = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': state.adminSecret,
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try {
            const payload = await response.json();
            message = payload.error || payload.message || message;
        } catch {
        }
        throw new Error(message);
    }

    return response.json();
}

function renderSummary(summary) {
    elements.summaryTotal.textContent = summary.totalUsers ?? 0;
    elements.summaryActive.textContent = summary.activeUsers ?? 0;
    elements.summaryWarn.textContent = summary.warnedUsers ?? 0;
    elements.summaryBan.textContent = summary.bannedUsers ?? 0;
}

function renderUserList() {
    if (!state.users.length) {
        elements.userList.innerHTML = '<div class="empty-state">Khong tim thay tai khoan phu hop.</div>';
        return;
    }

    elements.userList.innerHTML = state.users.map((user) => {
        const status = statusLabel(user.status);
        const activeClass = user.accountId === state.selectedAccountId ? 'active' : '';

        return `
            <article class="user-card ${activeClass}" data-account-id="${user.accountId}">
                <div class="user-card-top">
                    <div>
                        <strong>${user.username}</strong>
                        <p>${user.email}</p>
                    </div>
                    <span class="status-badge ${status.className}">${status.label}</span>
                </div>
                <div class="user-card-meta">
                    <small>#${user.accountId}</small>
                    <small>Lv ${user.level} • Coin ${user.coin} • Gem ${user.gem}</small>
                </div>
            </article>
        `;
    }).join('');

    elements.userList.querySelectorAll('.user-card').forEach((card) => {
        card.addEventListener('click', () => {
            state.selectedAccountId = card.dataset.accountId;
            renderUserList();
            loadUserDetail(state.selectedAccountId);
        });
    });
}

function renderMetricGrid(target, items) {
    target.innerHTML = items.map((item) => `
        <div class="metric">
            <span>${item.label}</span>
            <strong>${item.value ?? '-'}</strong>
        </div>
    `).join('');
}

function showDetail(detail) {
    const account = detail.account;
    const stats = detail.stats || {};
    const currency = detail.currency || {};
    const status = statusLabel(account.status);

    elements.emptyState.classList.add('hidden');
    elements.detailView.classList.remove('hidden');
    elements.detailCaption.textContent = `Dang xem ${account.username} (${account.accountId})`;

    elements.detailName.textContent = account.username;
    elements.detailStatusBadge.textContent = status.label;
    elements.detailStatusBadge.className = `status-badge ${status.className}`;
    elements.detailAccountId.textContent = account.accountId;
    elements.detailEmail.textContent = account.email || '-';
    elements.detailCreated.textContent = formatDate(account.createdAt);
    elements.detailLastSave.textContent = formatDate(detail.saveData?.lastUpdated);

    elements.statusSelect.value = String(account.status);
    elements.coinInput.value = String(currency.coin ?? 0);
    elements.gemInput.value = String(currency.gem ?? 0);

    renderMetricGrid(elements.statsGrid, [
        { label: 'Level', value: stats.level ?? 1 },
        { label: 'EXP', value: stats.exp ?? 0 },
        { label: 'Potential', value: stats.potentialPoints ?? 0 },
        { label: 'STR / DEX / INT / CON', value: `${stats.str ?? 0} / ${stats.dex ?? 0} / ${stats.int ?? 0} / ${stats.con ?? 0}` }
    ]);

    renderMetricGrid(elements.activityGrid, [
        { label: 'Inventory', value: detail.activity.inventoryCount },
        { label: 'Storage', value: detail.activity.storageCount },
        { label: 'Farm plots', value: detail.activity.farmCount },
        { label: 'Forum', value: `${detail.activity.threadCount} threads / ${detail.activity.postCount} posts` }
    ]);

    elements.saveParsed.textContent = detail.saveData?.parsed
        ? JSON.stringify(detail.saveData.parsed, null, 2)
        : 'No parsed save data';
    elements.saveRaw.textContent = detail.saveData?.raw || 'No raw save data';
}

async function loadDashboard() {
    if (!state.adminSecret) {
        setAuthMessage('Nhap ADMIN_SECRET de bat dau.');
        return;
    }

    const query = elements.searchInput.value.trim();
    elements.listCaption.textContent = 'Dang tai du lieu...';

    try {
        const data = await apiFetch(`/api/Admin/dashboard?search=${encodeURIComponent(query)}`);
        state.users = data.users || [];
        renderSummary(data.summary || {});

        if (!state.selectedAccountId && state.users.length) {
            state.selectedAccountId = state.users[0].accountId;
        }

        if (state.selectedAccountId && !state.users.some((user) => user.accountId === state.selectedAccountId)) {
            state.selectedAccountId = state.users[0]?.accountId || null;
        }

        renderUserList();
        elements.listCaption.textContent = `${state.users.length} tai khoan duoc hien thi.`;

        if (state.selectedAccountId) {
            await loadUserDetail(state.selectedAccountId);
        }
    } catch (error) {
        renderSummary({});
        state.users = [];
        renderUserList();
        elements.emptyState.classList.remove('hidden');
        elements.detailView.classList.add('hidden');
        elements.listCaption.textContent = 'Khong tai duoc danh sach user.';
        setAuthMessage(error.message, true);
    }
}

async function loadUserDetail(accountId) {
    if (!accountId) return;

    try {
        const detail = await apiFetch(`/api/Admin/users/${encodeURIComponent(accountId)}`);
        showDetail(detail);
    } catch (error) {
        elements.emptyState.classList.remove('hidden');
        elements.detailView.classList.add('hidden');
        elements.detailCaption.textContent = error.message;
    }
}

async function updateStatus(event) {
    event.preventDefault();
    if (!state.selectedAccountId) return;

    try {
        await apiFetch(`/api/Admin/users/${encodeURIComponent(state.selectedAccountId)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: Number(elements.statusSelect.value) })
        });
        setAuthMessage('Da cap nhat status.');
        await loadDashboard();
    } catch (error) {
        setAuthMessage(error.message, true);
    }
}

async function updateCurrency(event) {
    event.preventDefault();
    if (!state.selectedAccountId) return;

    try {
        await apiFetch(`/api/Admin/users/${encodeURIComponent(state.selectedAccountId)}/currency`, {
            method: 'PATCH',
            body: JSON.stringify({
                coin: Number(elements.coinInput.value),
                gem: Number(elements.gemInput.value)
            })
        });
        setAuthMessage('Da cap nhat coin va gem.');
        await loadDashboard();
    } catch (error) {
        setAuthMessage(error.message, true);
    }
}

elements.authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    state.adminSecret = elements.adminSecret.value.trim();
    localStorage.setItem('adminSecret', state.adminSecret);
    setAuthMessage('Dang ket noi...');
    await loadDashboard();
});

elements.refreshButton.addEventListener('click', loadDashboard);
elements.statusForm.addEventListener('submit', updateStatus);
elements.currencyForm.addEventListener('submit', updateCurrency);

let searchTimer = null;
elements.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadDashboard, 250);
});

if (state.adminSecret) {
    setAuthMessage('Dang dung secret da luu.');
    loadDashboard();
}
