// Novarge Akademi - tarayıcıda oturum bilgisini (kullanıcı adı + rol) tutan yardımcı fonksiyonlar.
// Gerçek kimlik doğrulama Supabase RPC fonksiyonları üzerinden yapılır; burada sadece
// "şu an bu tarayıcıda kim oturum açmış" bilgisi tutulur (şifre asla saklanmaz).
var NOVARGE_SESSION_KEY = 'novarge_session';

function novargeSaveSession(username, role) {
  localStorage.setItem(NOVARGE_SESSION_KEY, JSON.stringify({ username: username, role: role }));
}

function novargeGetSession() {
  try {
    return JSON.parse(localStorage.getItem(NOVARGE_SESSION_KEY));
  } catch (e) {
    return null;
  }
}

function novargeClearSession() {
  localStorage.removeItem(NOVARGE_SESSION_KEY);
}
