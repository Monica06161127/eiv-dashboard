// EIV Dashboard — 前端逻辑
// 连接 eiv-core API，展示 intent vs execution diff

const API_BASE = 'http://127.0.0.1:8000';

// ========== API 调用 ==========

async function checkApiHealth() {
  const el = document.getElementById('api-status');
  try {
    const res = await fetch(`${API_BASE}/healthz`);
    if (res.ok) {
      el.className = 'status-dot online';
      el.querySelector('.label').textContent = 'API: 已连接';
      return true;
    }
  } catch (e) { /* offline */ }
  el.className = 'status-dot offline';
  el.querySelector('.label').textContent = 'API: 未连接';
  return false;
}

async function fetchValidations() {
  const res = await fetch(`${API_BASE}/validations`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).validations;
}

async function fetchValidation(id) {
  const res = await fetch(`${API_BASE}/validations/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// ========== 渲染 ==========

function renderRecordRow(record) {
  const div = document.createElement('div');
  div.className = 'record-row';
  div.dataset.id = record.validation_id;
  div.innerHTML = `
    <span class="record-verdict ${record.verdict}">${record.verdict}</span>
    <span class="record-tx">${record.tx_ref}</span>
    <span class="record-time">${new Date(record.created_at).toLocaleString('zh-CN')}</span>
  `;
  div.onclick = () => loadDetail(record.validation_id);
  return div;
}

function renderViolations(violations) {
  if (!violations || violations.length === 0) {
    return '<p style="color:var(--green)">✓ 无违规项</p>';
  }
  return violations.map(v => {
    const isWarn = v.severity !== 'FAIL';
    return `
      <div class="violation-item ${isWarn ? 'warn' : ''}">
        <span class="violation-sev ${v.severity}">${v.severity}</span>
        <div>
          <div class="violation-cat">${v.category}</div>
          <div class="violation-detail">${v.detail}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAttestation(att) {
  if (!att) return '<p style="color:var(--text-muted)">无 attestation 数据</p>';
  return `
    <div>tag: ${att.tag}</div>
    <div>response (score): ${att.response}</div>
    <div>request_hash: ${att.request_hash}</div>
    <div>tx_ref: ${att.attestation_ref}</div>
  `;
}

function renderConsumerDecision(verdict, attestation) {
  const el = document.getElementById('consumer-decision');
  if (verdict === 'PASS') {
    el.className = 'accept';
    el.innerHTML = '✅ Consumer: 接受该 agent（reputation 正常）';
  } else {
    el.className = 'reject';
    el.innerHTML = '🚫 Consumer: 拒绝该 agent（FAIL 已记录到 reputation）';
  }
}

// ========== 交互 ==========

async function refreshList() {
  const container = document.getElementById('records-container');
  const countEl = document.getElementById('record-count');
  container.innerHTML = '<p class="placeholder">加载中...</p>';

  const online = await checkApiHealth();
  if (!online) {
    container.innerHTML = `
      <p class="placeholder">
        ⚠️ 无法连接 API。请先启动 eiv-core：<br>
        <code>cd eiv-core && python -m eiv.api --port 8000</code>
        <br><br>
        或者点击下方按钮加载 mock 数据（开发用）：<br>
        <button onclick="loadMockData()" style="margin-top:8px">📂 加载 Mock 数据</button>
      </p>`;
    return;
  }

  try {
    const records = await fetchValidations();
    countEl.textContent = `${records.length} 条记录`;
    container.innerHTML = '';
    records.forEach(r => container.appendChild(renderRecordRow(r)));

    if (records.length > 0) {
      loadDetail(records[0].validation_id);
    }
  } catch (e) {
    container.innerHTML = `<p class="placeholder">❌ 加载失败: ${e.message}</p>`;
  }
}

async function loadDetail(id) {
  // 高亮选中行
  document.querySelectorAll('.record-row').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  const panel = document.getElementById('detail-panel');
  panel.classList.remove('hidden');
  document.getElementById('detail-id').textContent = id;

  try {
    const record = await fetchValidation(id);
    const result = record.result;
    const verdict = result.verdict;

    // 判定 banner
    const banner = document.getElementById('verdict-banner');
    banner.className = `verdict ${verdict}`;
    banner.textContent = verdict === 'PASS'
      ? '✅ PASS — 执行符合签章授权'
      : '❌ FAIL — 执行偏离签章授权';

    // Intent vs Execution diff
    document.getElementById('intent-view').textContent =
      JSON.stringify(record.intent, null, 2);
    // execution trace 不在 record 里，用 tx_ref 提示
    document.getElementById('trace-view').textContent =
      `tx_ref: ${record.tx_ref}\n\n` +
      `（ChainAdapter 拉取的 ExecutionTrace 在 validator 内部处理，\n` +
      `此处显示的是验证结果摘要：）\n\n` +
      JSON.stringify(result, null, 2);

    // 违规项
    document.getElementById('violations-list').innerHTML =
      renderViolations(result.violations);

    // Attestation
    document.getElementById('attestation-info').innerHTML =
      renderAttestation(record.attestation);

    // Mock Consumer
    renderConsumerDecision(verdict, record.attestation);

  } catch (e) {
    document.getElementById('verdict-banner').textContent = `❌ 加载失败: ${e.message}`;
  }
}

// ========== Mock 数据（API 不在线时开发用） ==========

function loadMockData() {
  const container = document.getElementById('records-container');
  const countEl = document.getElementById('record-count');

  const mockRecords = [
    {
      validation_id: 'mock_pass_001',
      tx_ref: 'tx_clean',
      verdict: 'PASS',
      created_at: '2026-06-08T10:00:00Z'
    },
    {
      validation_id: 'mock_fail_002',
      tx_ref: 'tx_residual',
      verdict: 'FAIL',
      created_at: '2026-06-08T10:01:00Z'
    },
    {
      validation_id: 'mock_fail_003',
      tx_ref: 'tx_unauth',
      verdict: 'FAIL',
      created_at: '2026-06-08T10:02:00Z'
    }
  ];

  countEl.textContent = `${mockRecords.length} 条记录 (mock)`;
  container.innerHTML = '';
  mockRecords.forEach(r => container.appendChild(renderRecordRow(r)));

  // 高亮 API 状态为 mock 模式
  const el = document.getElementById('api-status');
  el.className = 'status-dot online';
  el.querySelector('.label').textContent = 'API: Mock 模式';

  // 加载第一条详情
  loadMockDetail();
}

function loadMockDetail() {
  const panel = document.getElementById('detail-panel');
  panel.classList.remove('hidden');
  document.getElementById('detail-id').textContent = 'mock_fail_002';

  document.getElementById('verdict-banner').className = 'verdict FAIL';
  document.getElementById('verdict-banner').textContent =
    '❌ FAIL — 执行偏离签章授权';

  document.getElementById('intent-view').textContent = JSON.stringify({
    spec: {
      allowed_targets: ["0xRouter"],
      allowed_spenders: ["0xRouter"],
      token_in: "USDC", token_out: "WETH",
      max_amount_in: "100", min_amount_out: "90",
      recipient: "0xUser",
      deadline: 1000,
      require_zero_residual: true,
      bounded_approval: true,
      max_slippage_bps: 50
    },
    signer: "0xUser"
  }, null, 2);

  document.getElementById('trace-view').textContent = JSON.stringify({
    calls_to: ["0xRouter"],
    approvals: [{ spender: "0xRouter", amount: "100" }],
    transfers_out: [{ token: "WETH", to: "0xUser", amount: "95" }],
    amount_in: "100", amount_out: "95",
    block_ts: 900,
    residual_allowances: { "0xRouter": "50" }  // 残留！
  }, null, 2);

  document.getElementById('violations-list').innerHTML = renderViolations([
    {
      category: "F:Residual",
      severity: "FAIL",
      detail: "执行后残留 allowance 50 给 0xRouter（spec 要求 require_zero_residual）"
    }
  ]);

  document.getElementById('attestation-info').innerHTML = `
    <div>tag: EIV.L2.FAIL</div>
    <div>response (score): 0</div>
    <div>request_hash: 0x018480...f9fc9</div>
    <div>tx_ref: 0xb7643d...8b0f</div>
  `;

  renderConsumerDecision('FAIL');
}

// ========== 初始化 ==========

document.addEventListener('DOMContentLoaded', () => {
  checkApiHealth();
  refreshList();
});
