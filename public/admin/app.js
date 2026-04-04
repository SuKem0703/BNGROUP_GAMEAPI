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
    summaryThreads: document.getElementById('summary-threads'),
    summaryGiftcodes: document.getElementById('summary-giftcodes'),
    emptyState: document.getElementById('empty-state'),
    detailView: document.getElementById('detail-view'),
    detailCaption: document.getElementById('detail-caption'),
    detailName: document.getElementById('detail-name'),
    detailStatusBadge: document.getElementById('detail-status-badge'),
    detailRoleBadge: document.getElementById('detail-role-badge'),
    detailAccountId: document.getElementById('detail-account-id'),
    detailEmail: document.getElementById('detail-email'),
    detailCreated: document.getElementById('detail-created'),
    detailLastSave: document.getElementById('detail-last-save'),
    statusForm: document.getElementById('status-form'),
    statusSelect: document.getElementById('status-select'),
    roleForm: document.getElementById('role-form'),
    roleSelect: document.getElementById('role-select'),
    currencyForm: document.getElementById('currency-form'),
    coinInput: document.getElementById('coin-input'),
    gemInput: document.getElementById('gem-input'),
    statsGrid: document.getElementById('stats-grid'),
    activityGrid: document.getElementById('activity-grid'),
    saveParsed: document.getElementById('save-parsed'),
    saveRaw: document.getElementById('save-raw'),
    forumRefreshButton: document.getElementById('forum-refresh-button'),
    forumSearchInput: document.getElementById('forum-search-input'),
    forumCaption: document.getElementById('forum-caption'),
    forumThreadList: document.getElementById('forum-thread-list'),
    forumEmptyState: document.getElementById('forum-empty-state'),
    forumDetailView: document.getElementById('forum-detail-view'),
    forumThreadTitle: document.getElementById('forum-thread-title'),
    forumOpenLink: document.getElementById('forum-open-link'),
    forumDeleteThreadButton: document.getElementById('forum-delete-thread-button'),
    forumThreadAuthor: document.getElementById('forum-thread-author'),
    forumThreadCreated: document.getElementById('forum-thread-created'),
    forumThreadViews: document.getElementById('forum-thread-views'),
    forumThreadReplies: document.getElementById('forum-thread-replies'),
    forumThreadContent: document.getElementById('forum-thread-content'),
    forumPostCaption: document.getElementById('forum-post-caption'),
    forumPostList: document.getElementById('forum-post-list'),
    giftcodeRefreshButton: document.getElementById('giftcode-refresh-button'),
    giftcodeSearchInput: document.getElementById('giftcode-search-input'),
    giftcodeCaption: document.getElementById('giftcode-caption'),
    giftcodeForm: document.getElementById('giftcode-form'),
    giftcodeCodeInput: document.getElementById('giftcode-code-input'),
    giftcodeTitleInput: document.getElementById('giftcode-title-input'),
    giftcodeDescriptionInput: document.getElementById('giftcode-description-input'),
    giftcodeUnlimitedQuantity: document.getElementById('giftcode-unlimited-quantity'),
    giftcodeUnlimitedDuration: document.getElementById('giftcode-unlimited-duration'),
    giftcodePublishForum: document.getElementById('giftcode-publish-forum'),
    giftcodeMaxRedemptions: document.getElementById('giftcode-max-redemptions'),
    giftcodeExpiresAt: document.getElementById('giftcode-expires-at'),
    rewardsContainer: document.getElementById('rewards-container'),
    addRewardButton: document.getElementById('add-reward-button'),
    giftcodeMessage: document.getElementById('giftcode-message'),
    giftcodeList: document.getElementById('giftcode-list')
};

const statusMap = {
    0: { label: 'None', className: '' },
    1: { label: 'Warn', className: 'warn' },
    2: { label: 'Ban', className: 'ban' },
    3: { label: 'Unbanned', className: '' }
};

const roleClassMap = {
    Admin: 'admin',
    Contributor: 'contributor',
    Player: ''
};

const state = {
    adminSecret: localStorage.getItem('adminSecret') || '',
    users: [],
    selectedAccountId: null,
    forumThreads: [],
    selectedThreadId: null,
    giftCodes: [],
    refreshIntervalId: null
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

function roleClass(role) {
    return roleClassMap[role] || '';
}

function setAuthMessage(message, isError = false) {
    elements.authMessage.textContent = message;
    elements.authMessage.style.color = isError ? '#b42318' : '';
}

function setGiftCodeMessage(message, isError = false) {
    elements.giftcodeMessage.textContent = message;
    elements.giftcodeMessage.style.color = isError ? '#b42318' : '';
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

function updateUserSummary(summary = {}) {
    elements.summaryTotal.textContent = summary.totalUsers ?? 0;
    elements.summaryActive.textContent = summary.activeUsers ?? 0;
    elements.summaryWarn.textContent = summary.warnedUsers ?? 0;
    elements.summaryBan.textContent = summary.bannedUsers ?? 0;
}

function updateForumSummary(summary = {}) {
    elements.summaryThreads.textContent = summary.totalThreads ?? 0;
}

function updateGiftCodeSummary(summary = {}) {
    elements.summaryGiftcodes.textContent = summary.activeGiftCodes ?? 0;
}

function renderMetricGrid(target, items) {
    target.innerHTML = items.map((item) => `
        <div class="metric">
            <span>${item.label}</span>
            <strong>${item.value ?? '-'}</strong>
        </div>
    `).join('');
}

function renderUserList() {
    if (!state.users.length) {
        elements.userList.innerHTML = '<div class="empty-state compact-empty-state">Khong tim thay tai khoan phu hop.</div>';
        return;
    }

    elements.userList.innerHTML = state.users.map((user) => {
        const status = statusLabel(user.status);
        const activeClass = user.accountId === state.selectedAccountId ? 'active' : '';
        const roleClassName = roleClass(user.role);

        return `
            <article class="user-card ${activeClass}" data-account-id="${user.accountId}">
                <div class="user-card-top">
                    <div>
                        <strong>${user.username}</strong>
                        <p>${user.email}</p>
                    </div>
                    <div class="detail-badges">
                        <span class="role-badge ${roleClassName}">${user.role}</span>
                        <span class="status-badge ${status.className}">${status.label}</span>
                    </div>
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

function showUserDetail(detail) {
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
    elements.detailRoleBadge.textContent = account.role || 'Player';
    elements.detailRoleBadge.className = `role-badge ${roleClass(account.role)}`;
    elements.detailAccountId.textContent = account.accountId;
    elements.detailEmail.textContent = account.email || '-';
    elements.detailCreated.textContent = formatDate(account.createdAt);
    elements.detailLastSave.textContent = formatDate(detail.saveData?.lastUpdated);

    elements.statusSelect.value = String(account.status);
    elements.roleSelect.value = String(account.role || 'Player');
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
        { label: 'Forum', value: `${detail.activity.threadCount} threads / ${detail.activity.postCount} posts` },
        { label: 'Giftcode redeems', value: detail.activity.giftCodeRedemptionCount }
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
        updateUserSummary(data.summary || {});

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
        updateUserSummary({});
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
        showUserDetail(detail);
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

async function updateRole(event) {
    event.preventDefault();
    if (!state.selectedAccountId) return;

    try {
        await apiFetch(`/api/Admin/users/${encodeURIComponent(state.selectedAccountId)}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role: elements.roleSelect.value })
        });
        setAuthMessage('Da cap nhat role.');
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

function renderForumThreads() {
    if (!state.forumThreads.length) {
        elements.forumThreadList.innerHTML = '<div class="empty-state compact-empty-state">Khong tim thay thread phu hop.</div>';
        return;
    }

    elements.forumThreadList.innerHTML = state.forumThreads.map((thread) => {
        const activeClass = thread.id === state.selectedThreadId ? 'active' : '';
        return `
            <article class="thread-card ${activeClass}" data-thread-id="${thread.id}">
                <div class="thread-card-header">
                    <strong>${thread.title}</strong>
                    <span class="giftcode-badge">${thread.postCount} replies</span>
                </div>
                <p>${thread.preview || 'Khong co preview.'}</p>
                <div class="thread-card-meta">
                    <small>${thread.authorName} • #${thread.authorId}</small>
                    <small>${formatDate(thread.createdAt)} • ${thread.viewCount} views</small>
                </div>
            </article>
        `;
    }).join('');

    elements.forumThreadList.querySelectorAll('.thread-card').forEach((card) => {
        card.addEventListener('click', () => {
            state.selectedThreadId = Number(card.dataset.threadId);
            renderForumThreads();
            loadForumThreadDetail(state.selectedThreadId);
        });
    });
}

function showForumThreadDetail(detail) {
    elements.forumEmptyState.classList.add('hidden');
    elements.forumDetailView.classList.remove('hidden');
    elements.forumThreadTitle.textContent = detail.title;
    elements.forumThreadAuthor.textContent = `${detail.authorName} (#${detail.authorId})`;
    elements.forumThreadCreated.textContent = formatDate(detail.createdAt);
    elements.forumThreadViews.textContent = detail.viewCount;
    elements.forumThreadReplies.textContent = detail.posts.length;
    elements.forumThreadContent.textContent = detail.content || 'No content';
    elements.forumPostCaption.textContent = `${detail.posts.length} replies`;
    elements.forumOpenLink.href = `/forum/${detail.id}`;
    elements.forumDeleteThreadButton.dataset.threadId = detail.id;

    if (!detail.posts.length) {
        elements.forumPostList.innerHTML = '<div class="empty-state compact-empty-state">Thread nay chua co reply.</div>';
        return;
    }

    elements.forumPostList.innerHTML = detail.posts.map((post) => `
        <article class="post-card">
            <div class="post-card-meta">
                <strong>${post.authorName} (#${post.authorId})</strong>
                <span>${formatDate(post.createdAt)}</span>
            </div>
            <pre class="code-block compact-code">${post.content || 'No content'}</pre>
            <div class="post-actions">
                <button class="danger-button delete-post-button" type="button" data-post-id="${post.id}">
                    Xoa reply
                </button>
            </div>
        </article>
    `).join('');

    elements.forumPostList.querySelectorAll('.delete-post-button').forEach((button) => {
        button.addEventListener('click', async () => {
            const postId = Number(button.dataset.postId);
            if (!window.confirm(`Xoa reply #${postId}?`)) {
                return;
            }

            try {
                await apiFetch(`/api/Admin/forum/posts/${postId}`, { method: 'DELETE' });
                setAuthMessage('Da xoa reply.');
                await Promise.all([loadForumDashboard(), loadDashboard()]);
            } catch (error) {
                setAuthMessage(error.message, true);
            }
        });
    });
}

async function loadForumDashboard() {
    if (!state.adminSecret) return;

    const query = elements.forumSearchInput.value.trim();
    elements.forumCaption.textContent = 'Dang tai danh sach forum...';

    try {
        const data = await apiFetch(`/api/Admin/forum?search=${encodeURIComponent(query)}`);
        state.forumThreads = data.threads || [];
        updateForumSummary(data.summary || {});

        if (!state.selectedThreadId && state.forumThreads.length) {
            state.selectedThreadId = state.forumThreads[0].id;
        }

        if (state.selectedThreadId && !state.forumThreads.some((thread) => thread.id === state.selectedThreadId)) {
            state.selectedThreadId = state.forumThreads[0]?.id || null;
        }

        renderForumThreads();
        elements.forumCaption.textContent = `${state.forumThreads.length} thread duoc hien thi.`;

        if (state.selectedThreadId) {
            await loadForumThreadDetail(state.selectedThreadId);
        } else {
            elements.forumEmptyState.classList.remove('hidden');
            elements.forumDetailView.classList.add('hidden');
        }
    } catch (error) {
        updateForumSummary({});
        state.forumThreads = [];
        renderForumThreads();
        elements.forumCaption.textContent = 'Khong tai duoc forum dashboard.';
        elements.forumEmptyState.classList.remove('hidden');
        elements.forumDetailView.classList.add('hidden');
        setAuthMessage(error.message, true);
    }
}

async function loadForumThreadDetail(threadId) {
    if (!threadId) return;

    try {
        const detail = await apiFetch(`/api/Admin/forum/threads/${threadId}`);
        showForumThreadDetail(detail);
    } catch (error) {
        elements.forumEmptyState.classList.remove('hidden');
        elements.forumDetailView.classList.add('hidden');
        elements.forumCaption.textContent = error.message;
    }
}

async function deleteSelectedThread() {
    const threadId = Number(elements.forumDeleteThreadButton.dataset.threadId);
    if (!threadId) return;

    if (!window.confirm(`Xoa thread #${threadId}? Tat ca reply trong thread cung se bi xoa.`)) {
        return;
    }

    try {
        await apiFetch(`/api/Admin/forum/threads/${threadId}`, { method: 'DELETE' });
        state.selectedThreadId = null;
        setAuthMessage('Da xoa thread.');
        await Promise.all([loadForumDashboard(), loadDashboard()]);
    } catch (error) {
        setAuthMessage(error.message, true);
    }
}

function toggleGiftCodeFieldStates() {
    elements.giftcodeMaxRedemptions.disabled = elements.giftcodeUnlimitedQuantity.checked;
    elements.giftcodeExpiresAt.disabled = elements.giftcodeUnlimitedDuration.checked;
}

function createRewardRow(reward = {}) {
    const row = document.createElement('div');
    row.className = 'reward-row';
    row.innerHTML = `
        <div class="reward-row-fields">
            <label>
                <span>Item ID</span>
                <input class="reward-item-id" type="number" min="101" step="1" value="${reward.itemId || ''}" />
            </label>
            <label>
                <span>Quantity</span>
                <input class="reward-quantity" type="number" min="1" step="1" value="${reward.quantity || 1}" />
            </label>
            <label>
                <span>Rarity</span>
                <input class="reward-rarity" type="number" min="1" step="1" value="${reward.rarity || 1}" />
            </label>
            <label>
                <span>Quality</span>
                <input class="reward-quality" type="number" min="0.1" step="0.1" value="${reward.qualityFactor || 1}" />
            </label>
        </div>
        <button class="danger-button remove-reward-button" type="button">Xoa</button>
    `;

    row.querySelector('.remove-reward-button').addEventListener('click', () => {
        row.remove();
    });

    elements.rewardsContainer.appendChild(row);
}

function collectRewards() {
    return Array.from(elements.rewardsContainer.querySelectorAll('.reward-row'))
        .map((row) => ({
            itemId: Number(row.querySelector('.reward-item-id').value),
            quantity: Number(row.querySelector('.reward-quantity').value),
            rarity: Number(row.querySelector('.reward-rarity').value),
            qualityFactor: Number(row.querySelector('.reward-quality').value)
        }))
        .filter((reward) => Number.isFinite(reward.itemId) && reward.itemId > 0);
}

function renderGiftCodeList() {
    if (!state.giftCodes.length) {
        elements.giftcodeList.innerHTML = '<div class="empty-state compact-empty-state">Chua co giftcode nao.</div>';
        return;
    }

    elements.giftcodeList.innerHTML = state.giftCodes.map((giftCode) => `
        <article class="giftcode-card">
            <div class="giftcode-card-header">
                <div>
                    <strong>${giftCode.title}</strong>
                    <div class="giftcode-meta">
                        <small>Code: ${giftCode.code}</small>
                        <small>${giftCode.isUnlimitedQuantity ? 'Unlimited quantity' : `Remaining ${giftCode.remainingCount}`}</small>
                        <small>${giftCode.isUnlimitedDuration ? 'No expiry' : `Expire ${formatDate(giftCode.expiresAt)}`}</small>
                    </div>
                </div>
                <span class="giftcode-badge ${giftCode.isActive ? '' : 'inactive'}">
                    ${giftCode.isActive ? 'Active' : 'Inactive'}
                </span>
            </div>
            ${giftCode.description ? `<p>${giftCode.description}</p>` : ''}
            <div class="giftcode-rewards">
                ${(giftCode.rewards || []).map((reward) => `
                    <span class="reward-chip">#${reward.itemId} ${reward.category} x${reward.quantity}</span>
                `).join('')}
            </div>
            <div class="giftcode-meta">
                <small>Redeemed ${giftCode.redeemedCount}${giftCode.maxRedemptions ? ` / ${giftCode.maxRedemptions}` : ''}</small>
                <small>Created ${formatDate(giftCode.createdAt)}</small>
                ${giftCode.forumThreadId ? `<small><a class="ghost-link" href="/forum/${giftCode.forumThreadId}" target="_blank" rel="noreferrer">Forum thread #${giftCode.forumThreadId}</a></small>` : ''}
            </div>
            ${(giftCode.latestRedemptions || []).length ? `
                <div class="giftcode-meta">
                    ${(giftCode.latestRedemptions || []).map((entry) => `<small>${entry.accountId} @ ${formatDate(entry.redeemedAt)}</small>`).join('')}
                </div>
            ` : ''}
            <div class="post-actions">
                <button class="ghost-button toggle-giftcode-button" type="button" data-giftcode-id="${giftCode.id}" data-next-state="${!giftCode.isActive}">
                    ${giftCode.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button class="danger-button delete-giftcode-button" type="button" data-giftcode-id="${giftCode.id}">
                    Xoa giftcode
                </button>
            </div>
        </article>
    `).join('');

    elements.giftcodeList.querySelectorAll('.toggle-giftcode-button').forEach((button) => {
        button.addEventListener('click', async () => {
            try {
                await apiFetch(`/api/Admin/giftcodes/${button.dataset.giftcodeId}/state`, {
                    method: 'PATCH',
                    body: JSON.stringify({ isActive: button.dataset.nextState === 'true' })
                });
                setGiftCodeMessage('Da cap nhat trang thai giftcode.');
                await loadGiftCodes();
            } catch (error) {
                setGiftCodeMessage(error.message, true);
            }
        });
    });

    elements.giftcodeList.querySelectorAll('.delete-giftcode-button').forEach((button) => {
        button.addEventListener('click', async () => {
            if (!window.confirm(`Xoa giftcode #${button.dataset.giftcodeId}?`)) {
                return;
            }

            try {
                await apiFetch(`/api/Admin/giftcodes/${button.dataset.giftcodeId}`, {
                    method: 'DELETE'
                });
                setGiftCodeMessage('Da xoa giftcode.');
                await loadGiftCodes();
            } catch (error) {
                setGiftCodeMessage(error.message, true);
            }
        });
    });
}

async function loadGiftCodes() {
    if (!state.adminSecret) return;

    const query = elements.giftcodeSearchInput.value.trim();
    elements.giftcodeCaption.textContent = 'Dang tai danh sach giftcode...';

    try {
        const data = await apiFetch(`/api/Admin/giftcodes?search=${encodeURIComponent(query)}`);
        state.giftCodes = data.giftCodes || [];
        updateGiftCodeSummary(data.summary || {});
        renderGiftCodeList();
        elements.giftcodeCaption.textContent = `${state.giftCodes.length} giftcode duoc hien thi. Tu dong lam moi moi 5 giay.`;
    } catch (error) {
        updateGiftCodeSummary({});
        state.giftCodes = [];
        renderGiftCodeList();
        elements.giftcodeCaption.textContent = 'Khong tai duoc giftcode.';
        setGiftCodeMessage(error.message, true);
    }
}

async function createGiftCode(event) {
    event.preventDefault();

    const rewards = collectRewards();
    if (!rewards.length) {
        setGiftCodeMessage('Can it nhat mot reward.', true);
        return;
    }

    try {
        const payload = {
            code: elements.giftcodeCodeInput.value.trim(),
            title: elements.giftcodeTitleInput.value.trim(),
            description: elements.giftcodeDescriptionInput.value.trim(),
            isUnlimitedQuantity: elements.giftcodeUnlimitedQuantity.checked,
            maxRedemptions: elements.giftcodeUnlimitedQuantity.checked
                ? null
                : Number(elements.giftcodeMaxRedemptions.value),
            isUnlimitedDuration: elements.giftcodeUnlimitedDuration.checked,
            expiresAt: elements.giftcodeUnlimitedDuration.checked
                ? null
                : elements.giftcodeExpiresAt.value,
            publishToForum: elements.giftcodePublishForum.checked,
            rewards
        };

        const data = await apiFetch('/api/Admin/giftcodes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        setGiftCodeMessage(data.message || 'Da tao giftcode.');
        elements.giftcodeForm.reset();
        elements.rewardsContainer.innerHTML = '';
        createRewardRow();
        elements.giftcodeUnlimitedQuantity.checked = true;
        elements.giftcodeUnlimitedDuration.checked = true;
        elements.giftcodePublishForum.checked = true;
        toggleGiftCodeFieldStates();
        await Promise.all([loadGiftCodes(), loadForumDashboard()]);
    } catch (error) {
        setGiftCodeMessage(error.message, true);
    }
}

function startAutoRefresh() {
    if (state.refreshIntervalId) {
        clearInterval(state.refreshIntervalId);
    }

    if (!state.adminSecret) {
        return;
    }

    state.refreshIntervalId = window.setInterval(() => {
        loadGiftCodes();
    }, 5000);
}

async function loadAllSections() {
    await Promise.all([
        loadDashboard(),
        loadForumDashboard(),
        loadGiftCodes()
    ]);
    startAutoRefresh();
}

elements.authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    state.adminSecret = elements.adminSecret.value.trim();
    localStorage.setItem('adminSecret', state.adminSecret);
    setAuthMessage('Dang ket noi...');
    await loadAllSections();
});

elements.refreshButton.addEventListener('click', loadDashboard);
elements.statusForm.addEventListener('submit', updateStatus);
elements.roleForm.addEventListener('submit', updateRole);
elements.currencyForm.addEventListener('submit', updateCurrency);
elements.forumRefreshButton.addEventListener('click', loadForumDashboard);
elements.forumDeleteThreadButton.addEventListener('click', deleteSelectedThread);
elements.giftcodeRefreshButton.addEventListener('click', loadGiftCodes);
elements.giftcodeForm.addEventListener('submit', createGiftCode);
elements.addRewardButton.addEventListener('click', () => createRewardRow());
elements.giftcodeUnlimitedQuantity.addEventListener('change', toggleGiftCodeFieldStates);
elements.giftcodeUnlimitedDuration.addEventListener('change', toggleGiftCodeFieldStates);

let userSearchTimer = null;
let forumSearchTimer = null;
let giftCodeSearchTimer = null;

elements.searchInput.addEventListener('input', () => {
    clearTimeout(userSearchTimer);
    userSearchTimer = setTimeout(loadDashboard, 250);
});

elements.forumSearchInput.addEventListener('input', () => {
    clearTimeout(forumSearchTimer);
    forumSearchTimer = setTimeout(loadForumDashboard, 250);
});

elements.giftcodeSearchInput.addEventListener('input', () => {
    clearTimeout(giftCodeSearchTimer);
    giftCodeSearchTimer = setTimeout(loadGiftCodes, 250);
});

createRewardRow();
toggleGiftCodeFieldStates();

if (state.adminSecret) {
    setAuthMessage('Dang dung secret da luu.');
    loadAllSections();
}
