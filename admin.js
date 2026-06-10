const supabaseClient = window.supabaseClient;

var ADMIN_PASSWORD = 'admin123';
var AUTH_KEY = 'ls_admin_auth';


function showToast(message, type) {
  var container = document.getElementById('toastContainer');
  var toast = document.createElement('div');
  toast.className = 'toast toast--' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('removing');
    setTimeout(function () { toast.remove(); }, 300);
  }, 4000);
}

function showLoader() {
  document.getElementById('loader').classList.add('active');
}

function hideLoader() {
  document.getElementById('loader').classList.remove('active');
}

function isAdminLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function adminLogin() {
  var pass = document.getElementById('adminPass').value;
  var errEl = document.getElementById('loginError');
  if (pass === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true');
    errEl.classList.remove('visible');
    showDashboard();
  } else {
    errEl.classList.add('visible');
  }
}

function adminLogout() {
  localStorage.removeItem(AUTH_KEY);
  document.getElementById('dashboardView').style.display = 'none';
  document.getElementById('loginView').style.display = 'flex';
  showToast('تم تسجيل الخروج', 'info');
}

function showDashboard() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('dashboardView').style.display = 'block';
  loadLocations();
}

function formatDate(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

async function loadLocations() {
  showLoader();
  try {
    var { data, error } = await supabaseClient
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    renderStats(data || []);
    renderTable(data || []);
  } catch (err) {
    showToast('فشل تحميل البيانات', 'error');
  } finally {
    hideLoader();
  }
}

function renderStats(data) {
  var area = document.getElementById('statsArea');
  var total = data.length;
  var avgAcc = total ? Math.round(data.reduce(function (s, r) { return s + r.accuracy; }, 0) / total) : 0;
  var today = data.filter(function (r) {
    return new Date(r.created_at).toDateString() === new Date().toDateString();
  }).length;

  area.innerHTML =
    '<div class="stat-card"><div class="stat-card__value">' + total + '</div><div class="stat-card__label">إجمالي المواقع</div></div>' +
    '<div class="stat-card"><div class="stat-card__value">' + today + '</div><div class="stat-card__label">اليوم</div></div>' +
    '<div class="stat-card"><div class="stat-card__value">' + avgAcc + ' م</div><div class="stat-card__label">متوسط الدقة</div></div>';
}

function renderTable(data) {
  var tbody = document.getElementById('locationsBody');
  var empty = document.getElementById('emptyState');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  tbody.innerHTML = data.map(function (row, i) {
    return '<tr>' +
      '<td>' + (i + 1) + '</td>' +
      '<td>' + formatDate(row.created_at) + '</td>' +
      '<td>' + row.latitude.toFixed(6) + '</td>' +
      '<td>' + row.longitude.toFixed(6) + '</td>' +
      '<td>' + Math.round(row.accuracy) + '</td>' +
      '<td class="actions">' +
        '<a class="btn btn--outline btn--sm" href="https://maps.google.com/?q=' + row.latitude + ',' + row.longitude + '" target="_blank" rel="noopener">خريطة</a>' +
        '<button class="btn btn--danger btn--sm" onclick="deleteLocation(\'' + row.id + '\')">حذف</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

async function deleteLocation(id) {
  if (!confirm('هل تريد حذف هذا الموقع؟')) return;
  try {
    var { error } = await supabaseClient.from('locations').delete().eq('id', id);
    if (error) throw error;
    showToast('تم حذف الموقع', 'success');
    loadLocations();
  } catch (err) {
    showToast('فشل حذف الموقع', 'error');
  }
}

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.loadLocations = loadLocations;
window.deleteLocation = deleteLocation;

if (isAdminLoggedIn()) {
  showDashboard();
}
