// ═══════════════════════════════════════════════════
// AI Support Agent — Application Logic
// ═══════════════════════════════════════════════════

// ─── TOAST ───
const Toast = {
  show(msg, type = 'info') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
};

// ─── APP (Main Controller) ───
const App = {
  currentPage: 'overview',

  init() {
    // Show loading, then login
    setTimeout(() => {
      document.getElementById('loading-screen').classList.add('fade-out');
      setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('login-screen').style.display = 'block';
      }, 500);
    }, 1500);
  },

  login() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('onboarding-screen').style.display = 'block';
    Onboarding.init();
  },

  skipToDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('aha-overlay').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
    Overview.init();
    Conversations.init();
    Performance.init();
    Knowledge.init();
    AgentConfig.init();
    ZendeskDemo.init();
  },

  enterDashboard() {
    document.getElementById('aha-overlay').classList.remove('active');
    document.getElementById('aha-overlay').style.display = 'none';
    document.getElementById('dashboard-screen').classList.add('active');
    Overview.init();
    Conversations.init();
    Performance.init();
    Knowledge.init();
    AgentConfig.init();
    ZendeskDemo.init();
  },

  navigate(page) {
    this.currentPage = page;
    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`).classList.add('active');
    // Update page
    document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    // Update title
    const titles = {
      'overview': 'Overview',
      'conversations': 'Conversations',
      'performance': 'Performance',
      'knowledge': 'Knowledge',
      'agent-config': 'Agent Config',
      'zendesk-demo': 'Zendesk Sidebar Demo'
    };
    document.getElementById('page-title').textContent = titles[page] || page;
  },

  showToast(msg, type) {
    Toast.show(msg, type);
  }
};

// ─── ONBOARDING ───
const Onboarding = {
  currentStep: 1,
  decisionsAnswered: 0,
  totalDecisions: 0,

  init() {
    // Nothing extra needed on init
  },

  selectIntegration(type) {
    if (type === 'zendesk') {
      document.getElementById('card-zendesk').classList.add('selected');
      document.getElementById('zendesk-connection').classList.remove('hidden');
    }
  },

  connectZendesk() {
    const btn = event.target;
    btn.textContent = 'Connecting...';
    btn.disabled = true;
    setTimeout(() => {
      document.getElementById('zendesk-result').classList.remove('hidden');
      btn.style.display = 'none';
      Toast.show('Connected to Zendesk successfully', 'success');
    }, 1200);
  },

  connectShopify() {
    setTimeout(() => {
      document.getElementById('shopify-result').classList.remove('hidden');
      Toast.show('Connected to Shopify successfully', 'success');
    }, 1000);
  },

  nextStep(step) {
    // Mark current as completed
    document.querySelector(`.progress-step[data-step="${this.currentStep}"]`).classList.remove('active');
    document.querySelector(`.progress-step[data-step="${this.currentStep}"]`).classList.add('completed');
    document.querySelector(`.progress-step[data-step="${this.currentStep}"] .step-circle`).textContent = '✓';

    // Activate new step
    this.currentStep = step;
    document.querySelector(`.progress-step[data-step="${step}"]`).classList.add('active');

    // Show content
    document.querySelectorAll('.step-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');

    // Special init for steps
    if (step === 3) this.initStep3();
    if (step === 4) this.initStep4();
    if (step === 5) this.initStep5();
  },

  simulateUpload() {
    const filesDiv = document.getElementById('uploaded-files');
    filesDiv.classList.remove('hidden');
    filesDiv.innerHTML = DemoData.onboarding.sopResults.files.map(f =>
      `<div class="uploaded-file"><span class="file-icon">📄</span> ${f.name} <span class="file-size">${f.size}</span></div>`
    ).join('');

    // Start parsing after a beat
    setTimeout(() => this.startParsing(), 600);
  },

  startParsing() {
    const progress = document.getElementById('parsing-progress');
    progress.classList.add('active');
    const bar = document.getElementById('parsing-bar');
    const pct = document.getElementById('parsing-pct');
    const log = document.getElementById('parsing-log');

    const logLines = [
      { time: '0.2s', text: 'Loading Debenhams_CS_Playbook_2025.pdf...' },
      { time: '0.8s', text: 'Extracting text from 42 pages...' },
      { time: '1.5s', text: 'Identifying prompt rules... found 18' },
      { time: '2.1s', text: 'Extracting guardrails... found 12' },
      { time: '2.8s', text: 'Mapping action registry... found 9 actions' },
      { time: '3.2s', text: 'Loading Refund_Policy_v3.docx...' },
      { time: '3.8s', text: 'Cross-referencing escalation triggers... found 8' },
      { time: '4.2s', text: 'Loading Escalation_Matrix.pdf...' },
      { time: '4.8s', text: 'Analysing 500 historical tickets from Zendesk...' },
      { time: '5.5s', text: 'Comparing SOP rules with actual team behaviour...' },
      { time: '6.0s', text: 'Identifying gaps between SOP and practice...' },
      { time: '6.5s', text: '⚠ Found 3 warnings, 3 decision points' },
      { time: '7.0s', text: '✓ Analysis complete — 47 rules extracted' }
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i >= logLines.length) {
        clearInterval(interval);
        setTimeout(() => this.showParsingResults(), 400);
        return;
      }
      const line = logLines[i];
      const p = Math.round(((i + 1) / logLines.length) * 100);
      bar.style.width = p + '%';
      pct.textContent = p + '%';
      log.innerHTML += `<div class="log-line" style="animation-delay:${i * 0.05}s"><span class="log-time">[${line.time}]</span> ${line.text.startsWith('✓') ? `<span class="log-ok">${line.text}</span>` : line.text}</div>`;
      log.scrollTop = log.scrollHeight;
      i++;
    }, 500);
  },

  showParsingResults() {
    document.getElementById('parsing-results').classList.add('active');

    // Render decision points
    const dp = document.getElementById('decision-points');
    const points = DemoData.onboarding.ticketAnalysis.decisionPoints;
    this.totalDecisions = points.length;
    this.decisionsAnswered = 0;

    dp.innerHTML = points.map((p, idx) => `
      <div class="decision-point" id="dp-${p.id}">
        <h4><span class="dp-badge">Decision Required</span> ${p.title}</h4>
        <p>${p.description}</p>
        <div class="dp-options">
          ${p.options.map(o => `<button class="dp-option" onclick="Onboarding.answerDecision('${p.id}', this)">${o.label}</button>`).join('')}
        </div>
      </div>
    `).join('');
  },

  answerDecision(id, btn) {
    const dp = document.getElementById(`dp-${id}`);
    if (dp.classList.contains('answered')) return;
    dp.classList.add('answered');
    dp.querySelectorAll('.dp-option').forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');
    dp.querySelector('h4 .dp-badge').textContent = '✓ Decided';
    dp.querySelector('h4 .dp-badge').style.background = '#ecfdf5';
    dp.querySelector('h4 .dp-badge').style.color = '#065f46';

    this.decisionsAnswered++;
    if (this.decisionsAnswered >= this.totalDecisions) {
      document.getElementById('step3-continue').disabled = false;
    }
    Toast.show('Decision recorded', 'success');
  },

  initStep3() {
    // Already handled by upload flow
  },

  initStep4() {
    const toggles = document.getElementById('action-toggles');
    toggles.innerHTML = DemoData.agent.allowedActions.map(a => `
      <label style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border:1px solid var(--border); border-radius:var(--radius); font-size:0.85rem; cursor:pointer;">
        <input type="checkbox" ${a.enabled ? 'checked' : ''} /> ${a.name}
      </label>
    `).join('');
  },

  selectMode(btn, mode) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  initStep5() {
    // Run audit animation
    const counter = document.getElementById('audit-counter');
    let count = 0;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 30) + 10;
      if (count >= 500) {
        count = 500;
        clearInterval(interval);
        setTimeout(() => this.showAuditResults(), 600);
      }
      counter.textContent = `${count} / 500`;
    }, 200);
  },

  showAuditResults() {
    document.getElementById('audit-animation').classList.remove('active');
    document.getElementById('audit-results').classList.add('active');

    // Render category bars
    const bars = document.getElementById('category-bars');
    const cats = DemoData.onboarding.readinessAudit.categoryScores;
    bars.innerHTML = cats.map(c => {
      const cls = c.score >= 90 ? 'high' : c.score >= 75 ? 'medium' : 'low';
      return `<div class="category-bar">
        <div class="bar-label">${c.name}</div>
        <div class="bar-track"><div class="bar-fill ${cls}" style="width:${c.score}%">${c.score}%</div></div>
      </div>`;
    }).join('');
  },

  launch() {
    document.getElementById('onboarding-screen').style.display = 'none';
    document.getElementById('aha-overlay').style.display = 'flex';
    document.getElementById('aha-overlay').classList.add('active');
  }
};

// ─── OVERVIEW ───
const Overview = {
  init() {
    this.renderChart();
    this.renderAlerts();
  },

  renderChart() {
    const container = document.getElementById('volume-chart');
    if (!container) return;
    const max = Math.max(...DemoData.volumeData.map(d => d.count));
    container.innerHTML = DemoData.volumeData.map(d => {
      const h = Math.round((d.count / max) * 180);
      return `<div class="chart-bar-group">
        <div class="chart-bar" style="height:${h}px"><div class="bar-tooltip">${d.count} tickets</div></div>
        <div class="chart-label">${d.day}</div>
      </div>`;
    }).join('');
  },

  renderAlerts() {
    const container = document.getElementById('alerts-container');
    if (!container) return;
    container.innerHTML = DemoData.alerts.map(a => `
      <div class="alert-item ${a.type}">
        <div class="alert-icon">${a.icon}</div>
        <div class="alert-body">
          <div class="alert-title">${a.title}</div>
          <div class="alert-message">${a.message}</div>
          <div class="alert-time">${a.time}</div>
          ${a.actions.length ? `<div class="alert-actions">${a.actions.map(act => `<button class="btn btn-secondary btn-sm" onclick="App.showToast('${act} — coming soon', 'info')">${act}</button>`).join('')}</div>` : ''}
        </div>
      </div>
    `).join('');
  }
};

// ─── CONVERSATIONS ───
const Conversations = {
  currentFilter: 'all',
  selectedTicket: null,

  init() {
    this.renderTicketList();
  },

  filter(type, btn) {
    this.currentFilter = type;
    document.querySelectorAll('.ticket-filter').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    this.renderTicketList();
  },

  renderTicketList() {
    const list = document.getElementById('ticket-list');
    if (!list) return;
    let tickets = DemoData.tickets;
    if (this.currentFilter !== 'all') {
      tickets = tickets.filter(t => t.status === this.currentFilter);
    }
    list.innerHTML = tickets.map(t => {
      const catClass = `badge-${t.category.toLowerCase().replace(/\s/g, '')}`;
      return `<div class="ticket-item ${this.selectedTicket === t.id ? 'active' : ''}" onclick="Conversations.selectTicket('${t.id}')">
        <div class="ticket-top">
          <span class="ticket-id">${t.id}</span>
          <span class="ticket-time">${t.time}</span>
        </div>
        <div class="ticket-subject">${t.subject}</div>
        <div class="ticket-meta">
          <span class="ticket-customer">${t.customer}</span>
          ${t.vip ? '<span class="badge badge-vip">VIP</span>' : ''}
          <span class="badge badge-${t.status}">${t.status}</span>
          <span class="badge ${catClass}">${t.category}</span>
        </div>
      </div>`;
    }).join('');
  },

  selectTicket(id) {
    this.selectedTicket = id;
    this.renderTicketList();
    const ticket = DemoData.tickets.find(t => t.id === id);
    if (!ticket) return;
    this.renderThread(ticket);
  },

  renderThread(ticket) {
    const panel = document.getElementById('conversation-panel');
    const customer = DemoData.customers[ticket.email];
    const catClass = `badge-${ticket.category.toLowerCase().replace(/\s/g, '')}`;

    panel.innerHTML = `
      <div class="thread-header">
        <div>
          <div class="thread-subject">${ticket.subject}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.15rem;">${ticket.id} · ${ticket.customer}</div>
        </div>
        <div class="thread-badges">
          ${ticket.vip ? '<span class="badge badge-vip">VIP</span>' : ''}
          <span class="badge badge-${ticket.status}">${ticket.status}</span>
          <span class="badge ${catClass}">${ticket.category}</span>
        </div>
      </div>
      <div class="thread-messages" id="thread-messages">
        ${ticket.thread.map(m => this.renderMessage(m, ticket)).join('')}
      </div>
      ${this.renderDetailSidebar(ticket, customer)}
    `;
  },

  renderMessage(msg, ticket) {
    if (msg.type === 'system-event') {
      return `<div class="thread-message system-event"><div class="message-bubble">${msg.text}</div></div>`;
    }

    const isInternal = msg.type === 'internal-note';
    const isAgent = msg.from === 'agent';
    const cls = isInternal ? 'internal-note' : (isAgent ? 'agent' : 'customer');

    let reasoningHtml = '';
    if (isAgent && !isInternal && ticket.plan) {
      reasoningHtml = `
        <div class="reasoning-toggle" onclick="this.nextElementSibling.classList.toggle('open'); this.querySelector('.toggle-icon').textContent = this.nextElementSibling.classList.contains('open') ? '▾' : '▸';">
          <span class="toggle-icon">▸</span> View Reasoning Trace
        </div>
        <div class="reasoning-trace">
          ${ticket.plan.map((s, i) => `
            <div class="trace-step">
              <div class="step-icon">${i + 1}</div>
              <div class="step-label">${s.label}</div>
              <div class="step-tool">${s.tool}</div>
              <div class="step-duration">${s.duration}ms</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    let feedbackHtml = '';
    if (isAgent && !isInternal) {
      feedbackHtml = `
        <div class="feedback-row">
          <button class="feedback-btn thumbs-up" onclick="Conversations.feedback(this, 'up')" title="Good response">👍</button>
          <button class="feedback-btn thumbs-down" onclick="Conversations.feedback(this, 'down')" title="Needs improvement">👎</button>
        </div>
        <div class="feedback-form" id="fb-form-${Math.random().toString(36).substr(2,6)}">
          <div class="form-title">What went wrong?</div>
          <div class="feedback-options">
            <div class="feedback-option" onclick="this.classList.toggle('selected')">Reply inaccurate</div>
            <div class="feedback-option" onclick="this.classList.toggle('selected')">Should have escalated</div>
            <div class="feedback-option" onclick="this.classList.toggle('selected')">Tone issue</div>
            <div class="feedback-option" onclick="this.classList.toggle('selected')">Wrong action taken</div>
          </div>
          <textarea placeholder="What should the correct response have been?"></textarea>
          <div style="margin-top:0.5rem; text-align:right;">
            <button class="btn btn-primary btn-sm" onclick="Conversations.submitFeedback(this)">Submit Feedback</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="thread-message ${cls}">
        <div class="message-meta">
          <span class="author">${msg.author}</span>
          ${isInternal ? '<span class="note-badge">Internal Note</span>' : ''}
          <span class="time">${msg.time}</span>
        </div>
        <div class="message-bubble">${msg.text}</div>
        ${reasoningHtml}
        ${feedbackHtml}
      </div>
    `;
  },

  feedback(btn, type) {
    const row = btn.closest('.feedback-row');
    row.querySelectorAll('.feedback-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (type === 'down') {
      const form = row.nextElementSibling;
      form.classList.add('open');
    } else {
      const form = row.nextElementSibling;
      if (form) form.classList.remove('open');
      Toast.show('Positive feedback recorded', 'success');
    }
  },

  submitFeedback(btn) {
    const form = btn.closest('.feedback-form');
    form.classList.remove('open');
    Toast.show('Feedback submitted — AI will learn from this', 'success');
  },

  renderDetailSidebar(ticket, customer) {
    return `
      <div class="ticket-detail-panel">
        <div class="detail-section">
          <h4>Customer</h4>
          <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${ticket.customer}</span></div>
          <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value" style="font-size:0.8rem;">${ticket.email}</span></div>
          ${customer ? `
            <div class="detail-row"><span class="detail-label">Total Orders</span><span class="detail-value">${customer.totalOrders}</span></div>
            <div class="detail-row"><span class="detail-label">Total Spend</span><span class="detail-value">${customer.totalSpend}</span></div>
            <div class="detail-row"><span class="detail-label">VIP</span><span class="detail-value">${customer.vip ? '✓ Yes' : 'No'}</span></div>
          ` : ''}
        </div>
        ${ticket.orderData ? `
          <div class="detail-section">
            <h4>Order</h4>
            <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value" style="font-family:'JetBrains Mono',monospace; font-size:0.8rem;">${ticket.orderData.id}</span></div>
            <div class="detail-row"><span class="detail-label">Items</span><span class="detail-value" style="font-size:0.8rem;">${ticket.orderData.items.join(', ')}</span></div>
            <div class="detail-row"><span class="detail-label">Total</span><span class="detail-value">${ticket.orderData.total}</span></div>
            <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${ticket.orderData.status}</span></div>
          </div>
        ` : ''}
        <div class="detail-section">
          <h4>Ticket Info</h4>
          <div class="detail-row"><span class="detail-label">Channel</span><span class="detail-value">${ticket.channel}</span></div>
          <div class="detail-row"><span class="detail-label">Priority</span><span class="detail-value">${ticket.priority}</span></div>
          <div class="detail-row"><span class="detail-label">Tags</span><span class="detail-value" style="font-size:0.75rem;">${ticket.tags.join(', ')}</span></div>
        </div>
      </div>
    `;
  }
};

// ─── PERFORMANCE ───
const Performance = {
  init() {
    this.renderChart();
    this.renderCategoryTable();
  },

  renderChart() {
    const container = document.getElementById('perf-chart');
    if (!container) return;
    const data = DemoData.performanceData.daily;
    const max = Math.max(...data.map(d => d.tickets));
    container.innerHTML = data.map(d => {
      const totalH = Math.round((d.tickets / max) * 180);
      const resolvedH = Math.round((d.resolved / max) * 180);
      return `<div class="chart-bar-group" style="position:relative;">
        <div style="display:flex; gap:3px; align-items:flex-end; height:${totalH}px; width:100%;">
          <div class="chart-bar" style="height:${resolvedH}px; background:var(--primary); flex:1;"><div class="bar-tooltip">${d.resolved} resolved</div></div>
          <div class="chart-bar" style="height:${totalH - resolvedH + 4}px; background:var(--warning); flex:1;"><div class="bar-tooltip">${d.escalated} escalated</div></div>
        </div>
        <div class="chart-label">${d.date.split(' ')[1]}</div>
      </div>`;
    }).join('');
  },

  renderCategoryTable() {
    const tbody = document.getElementById('category-table');
    if (!tbody) return;
    tbody.innerHTML = DemoData.performanceData.categoryBreakdown.map(c => {
      const color = c.resolution >= 90 ? 'var(--success)' : c.resolution >= 75 ? 'var(--warning)' : 'var(--danger)';
      return `<tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.pct}%</td>
        <td>${c.resolution}%</td>
        <td class="bar-cell"><div class="mini-bar"><div class="mini-bar-fill" style="width:${c.resolution}%; background:${color};"></div></div></td>
      </tr>`;
    }).join('');
  }
};

// ─── KNOWLEDGE ───
const Knowledge = {
  init() {
    this.renderDocuments();
    this.renderQualityItems();
    this.renderGaps();
    this.renderTempInstructions();
    this.renderAdvancedConfig();
    this.renderFeedbackLog();
  },

  switchTab(tab, btn) {
    document.querySelectorAll('.knowledge-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.knowledge-view').forEach(v => v.classList.remove('active'));
    document.getElementById(`kv-${tab}`).classList.add('active');
  },

  renderDocuments() {
    const list = document.getElementById('doc-list');
    if (!list) return;
    list.innerHTML = DemoData.knowledgeBase.documents.map(d => {
      const cls = d.score >= 90 ? 'high' : 'medium';
      return `<div class="doc-item">
        <div class="doc-icon">📄</div>
        <div class="doc-info">
          <div class="doc-name">${d.name}</div>
          <div class="doc-meta">Uploaded ${d.uploaded} · ${d.extractedRules}</div>
        </div>
        <div class="doc-score ${cls}">${d.score}%</div>
      </div>`;
    }).join('');
  },

  renderQualityItems() {
    const container = document.getElementById('quality-items');
    if (!container) return;
    container.innerHTML = DemoData.knowledgeBase.qualityBreakdown.items.map(item => {
      const icon = item.type === 'missing' ? '🔴' : item.type === 'ambiguous' ? '🟡' : '🟠';
      const prioColor = item.priority === 'high' ? 'var(--danger)' : item.priority === 'medium' ? 'var(--warning)' : 'var(--text-muted)';
      return `<div style="display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid var(--border-light); font-size:0.85rem;">
        <span>${icon}</span>
        <span style="flex:1;">${item.text}</span>
        <span style="color:var(--success); font-weight:500; font-size:0.8rem;">${item.impact}</span>
        <span style="color:${prioColor}; font-size:0.75rem; font-weight:500; text-transform:uppercase;">${item.priority}</span>
        <button class="btn btn-secondary btn-sm" onclick="Knowledge.switchTab('teach', document.querySelectorAll('.knowledge-tab')[1]); document.getElementById('teach-input').value = 'Add policy for: ${item.text}'; document.getElementById('teach-input').focus();">Teach AI</button>
      </div>`;
    }).join('');
  },

  renderGaps() {
    const list = document.getElementById('gap-list');
    if (!list) return;
    list.innerHTML = DemoData.knowledgeGaps.map(g => {
      const sourceLabel = g.source === 'ai-detected' ? '🤖 AI Detected' : '👤 Manager Feedback';
      return `<div class="gap-item">
        <div class="gap-count">${g.count}</div>
        <div class="gap-info">
          <div class="gap-topic">${g.topic}</div>
          <div class="gap-source">${sourceLabel} · Last seen: ${g.lastSeen}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="Knowledge.switchTab('teach', document.querySelectorAll('.knowledge-tab')[1]); document.getElementById('teach-input').value = 'Add knowledge about: ${g.topic}'; document.getElementById('teach-input').focus();">Teach AI</button>
      </div>`;
    }).join('');
  },

  renderTempInstructions() {
    const list = document.getElementById('temp-instructions-list');
    if (!list) return;
    list.innerHTML = DemoData.tempInstructions.map(ti => {
      const statusCls = ti.active ? 'active' : 'scheduled';
      const itemCls = ti.active ? 'active-instruction' : '';
      return `<div class="temp-instruction-item ${itemCls}">
        <div class="ti-status ${statusCls}"></div>
        <div class="ti-info">
          <div class="ti-text">${ti.text}</div>
          <div class="ti-dates">${ti.effectiveFrom} → ${ti.effectiveTo} ${ti.active ? '(Active now)' : '(Scheduled)'}</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="App.showToast('Instruction removed', 'info'); this.closest('.temp-instruction-item').remove();">✕</button>
      </div>`;
    }).join('');
  },

  renderAdvancedConfig() {
    const panels = document.getElementById('config-panels');
    if (!panels) return;
    const config = DemoData.knowledgeBase.advancedConfig;
    const sections = [
      { title: 'Agent Prompt (AOP)', key: 'prompt', icon: '💬' },
      { title: 'Guardrails', key: 'guardrails', icon: '🛡️' },
      { title: 'Action Registry', key: 'actionRegistry', icon: '⚡' },
      { title: 'Escalation Rules', key: 'escalationRules', icon: '🚨' }
    ];
    panels.innerHTML = sections.map(s => `
      <div class="config-panel">
        <div class="panel-header"><h4>${s.icon} ${s.title}</h4></div>
        <textarea>${config[s.key]}</textarea>
      </div>
    `).join('');
  },

  renderFeedbackLog() {
    const container = document.getElementById('feedback-log');
    if (!container) return;
    container.innerHTML = DemoData.feedbackLog.map(f => {
      const icon = f.type === 'positive' ? '👍' : '👎';
      const bg = f.type === 'positive' ? 'var(--success-light)' : 'var(--danger-light)';
      return `<div style="display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0.85rem; background:${bg}; border-radius:var(--radius); margin-bottom:0.5rem; font-size:0.85rem;">
        <span>${icon}</span>
        <span style="font-family:'JetBrains Mono',monospace; font-size:0.8rem; color:var(--primary);">${f.ticketId}</span>
        <span style="flex:1;">${f.reason ? `${f.reason}${f.detail ? ': ' + f.detail : ''}` : 'Good response'}</span>
        <span style="font-size:0.75rem; color:var(--text-muted);">${f.time}</span>
      </div>`;
    }).join('');
  },

  teachAI() {
    const input = document.getElementById('teach-input');
    if (!input.value.trim()) {
      Toast.show('Please enter an instruction first', 'error');
      return;
    }
    document.getElementById('teach-preview').classList.add('active');
  },

  confirmTeach() {
    document.getElementById('teach-preview').classList.remove('active');
    document.getElementById('teach-input').value = '';
    Toast.show('Knowledge updated — AI will apply this from now on', 'success');
  }
};

// ─── AGENT CONFIG ───
const AgentConfig = {
  init() {
    this.renderActions();
  },

  renderActions() {
    const list = document.getElementById('config-actions-list');
    if (!list) return;
    list.innerHTML = DemoData.agent.allowedActions.map(a => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0; border-bottom:1px solid var(--border-light);">
        <span style="font-size:0.9rem;">${a.name}</span>
        <label style="position:relative; display:inline-block; width:44px; height:24px; cursor:pointer;">
          <input type="checkbox" ${a.enabled ? 'checked' : ''} style="opacity:0; width:0; height:0;" onchange="AgentConfig.toggleAction(this, '${a.name}')">
          <span style="position:absolute; inset:0; background:${a.enabled ? 'var(--success)' : '#cbd5e1'}; border-radius:12px; transition:0.2s;"></span>
          <span style="position:absolute; top:2px; left:${a.enabled ? '22px' : '2px'}; width:20px; height:20px; background:#fff; border-radius:50%; transition:0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2);"></span>
        </label>
      </div>
    `).join('');
  },

  toggleAction(input, name) {
    const span = input.nextElementSibling.nextElementSibling;
    const bg = input.nextElementSibling;
    if (input.checked) {
      span.style.left = '22px';
      bg.style.background = 'var(--success)';
    } else {
      span.style.left = '2px';
      bg.style.background = '#cbd5e1';
    }
    Toast.show(`${name}: ${input.checked ? 'Enabled' : 'Disabled'}`, 'info');
  }
};

// ─── ZENDESK SIDEBAR DEMO ───
const ZendeskDemo = {
  init() {
    this.renderTicket();
    this.renderSidebar();
  },

  renderTicket() {
    const container = document.getElementById('zd-ticket-content');
    if (!container) return;
    // Use TK-4895 (Sophie Williams - broken zipper)
    const ticket = DemoData.tickets.find(t => t.id === 'TK-4895');
    if (!ticket) return;

    container.innerHTML = `
      <div class="zd-ticket-header">
        <h3>${ticket.subject}</h3>
        <div class="zd-meta">${ticket.id} · ${ticket.customer} · ${ticket.email} · ${ticket.status.toUpperCase()}</div>
      </div>
      ${ticket.thread.map(m => {
        if (m.type === 'system-event') {
          return `<div style="text-align:center; font-size:0.8rem; color:var(--text-muted); padding:0.5rem; margin-bottom:0.75rem;">— ${m.text} —</div>`;
        }
        const cls = m.from === 'customer' ? 'zd-customer' : (m.type === 'internal-note' ? 'zd-internal' : 'zd-agent');
        return `<div class="zd-message ${cls}">
          <div class="zd-msg-header">
            <span class="zd-msg-author">${m.author}</span>
            ${m.type === 'internal-note' ? '<span style="font-size:0.65rem; background:#fbbf24; color:#78350f; padding:0.1rem 0.4rem; border-radius:8px; font-weight:600;">Internal Note</span>' : ''}
            <span class="zd-msg-time">${m.time}</span>
          </div>
          <div class="zd-msg-body">${m.text}</div>
        </div>`;
      }).join('')}
    `;
  },

  renderSidebar() {
    const sidebar = document.getElementById('our-sidebar');
    if (!sidebar) return;
    const demo = DemoData.sidebarDemo;

    sidebar.innerHTML = `
      <div class="sidebar-header">🤖 AI Support Agent</div>

      <!-- Confidence -->
      <div class="sidebar-section">
        <h5>Confidence</h5>
        <div class="confidence-meter">
          <div class="confidence-bar"><div class="confidence-fill" style="width:${demo.confidence * 100}%"></div></div>
          <div class="confidence-value" style="color:var(--success);">${Math.round(demo.confidence * 100)}%</div>
        </div>
      </div>

      <!-- Actions Taken -->
      <div class="sidebar-section">
        <h5>Actions Taken</h5>
        ${demo.suggestedActions.map(a => `
          <div class="sidebar-action-item">
            <div class="action-status executed">✓</div>
            <div style="flex:1;">
              <div style="font-size:0.8rem; font-weight:500;">${a.action}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">${a.tool}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Reasoning Trace -->
      <div class="sidebar-section">
        <h5>Reasoning Trace</h5>
        ${DemoData.tickets.find(t => t.id === 'TK-4895').plan.map((s, i) => `
          <div style="display:flex; align-items:flex-start; gap:0.5rem; margin-bottom:0.5rem; font-size:0.75rem;">
            <div style="width:18px; height:18px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:0.6rem; flex-shrink:0; margin-top:1px;">${i + 1}</div>
            <div style="flex:1; color:var(--text-secondary);">${s.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Quick Feedback -->
      <div class="sidebar-section">
        <h5>Quick Feedback</h5>
        <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem;">
          <button class="feedback-btn thumbs-up" onclick="Toast.show('Positive feedback recorded', 'success'); this.classList.add('active');" style="flex:1; border-radius:var(--radius); width:auto; height:auto; padding:0.5rem;">👍 Good</button>
          <button class="feedback-btn thumbs-down" onclick="document.getElementById('sidebar-fb-form').style.display='block'; this.classList.add('active');" style="flex:1; border-radius:var(--radius); width:auto; height:auto; padding:0.5rem;">👎 Issue</button>
        </div>
        <div id="sidebar-fb-form" style="display:none;">
          <div class="feedback-options" style="margin-bottom:0.5rem;">
            <div class="feedback-option" onclick="this.classList.toggle('selected')">Inaccurate</div>
            <div class="feedback-option" onclick="this.classList.toggle('selected')">Should escalate</div>
            <div class="feedback-option" onclick="this.classList.toggle('selected')">Tone</div>
          </div>
          <textarea class="sidebar-teach-input" placeholder="What should have happened?"></textarea>
          <button class="btn btn-primary btn-sm btn-full mt-1" onclick="Toast.show('Feedback submitted', 'success'); document.getElementById('sidebar-fb-form').style.display='none';">Submit</button>
        </div>
      </div>

      <!-- Quick Teach -->
      <div class="sidebar-section">
        <h5>Quick Teach</h5>
        <textarea class="sidebar-teach-input" placeholder="e.g., 'Refund time is 5-10 days, not 3-5'"></textarea>
        <button class="btn btn-primary btn-sm btn-full mt-1" onclick="Toast.show('Teaching applied — AI will use this going forward', 'success');">Teach AI</button>
      </div>

      <!-- Deep Link -->
      <div class="sidebar-link" onclick="App.navigate('knowledge'); Knowledge.switchTab('gaps', document.querySelectorAll('.knowledge-tab')[2]);">
        📚 Open Knowledge Hub →
      </div>
      <div class="sidebar-link" onclick="App.navigate('performance');">
        📈 View Full Performance →
      </div>
    `;
  }
};

// ─── BOOT ───
document.addEventListener('DOMContentLoaded', () => App.init());
