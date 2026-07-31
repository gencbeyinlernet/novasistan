/* ============================================================
   Novarge Akademi - "Buzcuk" pengueni sohbet asistanı
   Bu dosya kendi HTML/CSS'ini sayfaya enjekte eder.
   Kullanım: <script src="assets/js/assistant.js"></script>
   (assets/js/assistant-config.js ondan ÖNCE yüklenmiş olmalı)
   ============================================================ */
(function () {
  const SYSTEM_PROMPT = [
    'Sen "Buzcuk" adında, Novarge Akademi adlı bir eğitim platformunun sevimli penguen maskotu ve sohbet asistanısın.',
    'Kibar, zarif ve hafif esprili bir üslubun var; küçük öğrencilere de büyüklere de sıcak davranırsın.',
    'Cevapların kısa ve anlaşılır olsun (genellikle 2-4 cümle), gerekmedikçe uzun paragraflar kurma.',
    'Novarge Akademi; öğrenci ve öğretmenleri buluşturan, kurslar, kariyer programları ve sertifikalar sunan bir eğitim platformudur.',
    'Kullanıcılar önce "Kayıt Ol" ekranından kullanıcı adı ve şifreyle hesap oluşturur, sonra "Giriş Yap" ekranından oturum açar.',
    'Sitenin ders içerikleri şu an yer tutucu/örnek durumdadır; çok spesifik bir ders sorulursa bunun yakında ekleneceğini nazikçe belirt.',
    'Emin olmadığın konularda uydurma kesin bilgi verme; gerekirse kullanıcıyı ilgili sayfaya ya da yönetime nazikçe yönlendir.'
  ].join(' ');

  const FALLBACK_REPLIES = [
    'Şu anda tam olarak bağlanamadım ama çok yakında sorularını gerçek zamanlı cevaplayabileceğim. O zamana kadar bu zarif sessizliğimi hoş gör! 🐧',
    'Buz gibi soğukkanlıyım ama bağlantım henüz kurulmadı — birazdan tam kapasiteyle yardımcı olacağım, söz veriyorum!',
    'Şimdilik biraz donmuş durumdayım (kelimenin tam anlamıyla, ben bir penguenim sonuçta) — çok yakında konuşabileceğiz!'
  ];

  let historyTurns = [];
  let panelOpened = false;

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .nv-fab-wrap{position:fixed;right:24px;bottom:24px;z-index:99990;display:flex;flex-direction:column;align-items:flex-end;gap:10px;}
      .nv-fab-hint{
        background:#fff;color:#151515;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
        font-size:13px;font-weight:600;padding:9px 14px;border-radius:14px;
        box-shadow:0 8px 22px rgba(6,46,111,.16);
        opacity:0;transform:translateY(6px);pointer-events:none;
        transition:opacity .35s ease, transform .35s ease;
        max-width:200px;
      }
      .nv-fab-hint.show{opacity:1;transform:translateY(0);}
      .nv-fab{
        width:66px;height:66px;border-radius:50%;border:none;cursor:pointer;
        background:linear-gradient(150deg,#63C9C7 0%,#0866E8 100%);
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 10px 26px rgba(6,46,111,.28);
        position:relative;
        animation:nv-bob 2.6s ease-in-out infinite;
      }
      .nv-fab:hover{filter:brightness(1.06);}
      .nv-fab::before{
        content:'';position:absolute;inset:-8px;border-radius:50%;
        border:2px solid rgba(99,201,199,.55);
        animation:nv-ping 2.6s ease-out infinite;
      }
      .nv-fab svg{width:44px;height:44px;position:relative;z-index:2;}
      @keyframes nv-bob{
        0%,100%{transform:translateY(0);}
        50%{transform:translateY(-7px);}
      }
      @keyframes nv-ping{
        0%{transform:scale(.9);opacity:.7;}
        70%{transform:scale(1.25);opacity:0;}
        100%{transform:scale(1.25);opacity:0;}
      }
      .nv-eye-l,.nv-eye-r{animation:nv-blink 4.4s ease-in-out infinite;transform-origin:center;}
      .nv-eye-r{animation-delay:.08s;}
      @keyframes nv-blink{
        0%,92%,100%{transform:scaleY(1);}
        95%{transform:scaleY(.15);}
      }
      .nv-wing-l{animation:nv-wave-l 2.6s ease-in-out infinite;transform-origin:70px 62px;}
      .nv-wing-r{animation:nv-wave-r 2.6s ease-in-out infinite;transform-origin:30px 62px;}
      @keyframes nv-wave-l{0%,100%{transform:rotate(0deg);}50%{transform:rotate(-10deg);}}
      @keyframes nv-wave-r{0%,100%{transform:rotate(0deg);}50%{transform:rotate(10deg);}}
      @media (prefers-reduced-motion: reduce){
        .nv-fab, .nv-fab::before, .nv-eye-l, .nv-eye-r, .nv-wing-l, .nv-wing-r{animation:none !important;}
      }

      .nv-panel{
        position:fixed;right:24px;bottom:104px;z-index:99991;
        width:380px;max-width:calc(100vw - 32px);
        height:min(600px, calc(100vh - 140px));
        background:#fff;border-radius:24px;overflow:hidden;
        box-shadow:0 24px 60px rgba(6,46,111,.28);
        display:flex;flex-direction:column;
        font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
        opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;
        transition:opacity .22s ease, transform .22s ease;
      }
      .nv-panel.open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}
      .nv-panel-header{
        background:linear-gradient(120deg,#062E6F,#0866E8);
        color:#fff;padding:16px 16px 16px 14px;
        display:flex;align-items:center;gap:10px;flex-shrink:0;
      }
      .nv-panel-avatar{
        width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.16);
        display:flex;align-items:center;justify-content:center;flex-shrink:0;
      }
      .nv-panel-avatar svg{width:26px;height:26px;}
      .nv-panel-title{flex:1;min-width:0;}
      .nv-panel-title strong{display:block;font-size:14.5px;font-weight:700;}
      .nv-panel-title span{display:block;font-size:11.5px;color:rgba(255,255,255,.78);}
      .nv-panel-close{background:none;border:none;color:#fff;opacity:.85;cursor:pointer;padding:6px;flex-shrink:0;}
      .nv-panel-close:hover{opacity:1;}
      .nv-panel-close svg{width:18px;height:18px;}

      .nv-panel-body{
        flex:1;overflow-y:auto;padding:16px 14px;
        display:flex;flex-direction:column;gap:10px;
        background:#F7FAFF;
      }
      .nv-msg{max-width:82%;font-size:13.5px;line-height:1.45;padding:10px 13px;border-radius:14px;}
      .nv-msg.bot{align-self:flex-start;background:#EAF2FF;color:#151515;border-bottom-left-radius:4px;}
      .nv-msg.user{align-self:flex-end;background:#0056D2;color:#fff;border-bottom-right-radius:4px;}
      .nv-typing{align-self:flex-start;display:flex;gap:4px;padding:12px 14px;background:#EAF2FF;border-radius:14px;border-bottom-left-radius:4px;}
      .nv-typing span{width:6px;height:6px;border-radius:50%;background:#5B7CB0;animation:nv-typing-bounce 1.1s infinite ease-in-out;}
      .nv-typing span:nth-child(2){animation-delay:.15s;}
      .nv-typing span:nth-child(3){animation-delay:.3s;}
      @keyframes nv-typing-bounce{0%,60%,100%{transform:translateY(0);opacity:.5;}30%{transform:translateY(-4px);opacity:1;}}

      .nv-panel-footer{
        display:flex;align-items:center;gap:8px;
        padding:12px;border-top:1px solid #E7ECF5;flex-shrink:0;background:#fff;
      }
      .nv-panel-footer input{
        flex:1;border:1.5px solid #D5DFEE;border-radius:22px;
        height:42px;padding:0 16px;font-size:13.5px;font-family:inherit;outline:none;
      }
      .nv-panel-footer input:focus{border-color:#0866E8;}
      .nv-send-btn{
        width:40px;height:40px;border-radius:50%;border:none;flex-shrink:0;
        background:#0056D2;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;
      }
      .nv-send-btn:hover{background:#0866E8;}
      .nv-send-btn svg{width:17px;height:17px;}

      @media (max-width:480px){
        .nv-panel{right:12px;left:12px;width:auto;bottom:96px;}
        .nv-fab-wrap{right:14px;bottom:14px;}
      }
    `;
    document.head.appendChild(style);
  }

  function penguinSVG(idPrefix) {
    return `
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <ellipse class="${idPrefix}wing-l" cx="20" cy="60" rx="8" ry="16" fill="#0B1120"/>
        <ellipse class="${idPrefix}wing-r" cx="80" cy="60" rx="8" ry="16" fill="#0B1120"/>
        <ellipse cx="50" cy="58" rx="29" ry="33" fill="#0B1120"/>
        <ellipse cx="50" cy="65" rx="18" ry="23" fill="#FFFFFF"/>
        <ellipse cx="38" cy="90" rx="7" ry="3.4" fill="#F2A93B"/>
        <ellipse cx="62" cy="90" rx="7" ry="3.4" fill="#F2A93B"/>
        <polygon points="30,12 70,12 50,2" fill="#062E6F"/>
        <rect x="30" y="10" width="40" height="6" rx="2" fill="#0866E8"/>
        <circle cx="50" cy="4" r="3" fill="#F2A93B"/>
        <circle cx="40" cy="46" r="7.5" fill="#fff"/>
        <circle cx="60" cy="46" r="7.5" fill="#fff"/>
        <g class="${idPrefix}eye-l"><circle cx="41" cy="47" r="3.4" fill="#0B1120"/></g>
        <g class="${idPrefix}eye-r"><circle cx="59" cy="47" r="3.4" fill="#0B1120"/></g>
        <polygon points="46,54 54,54 50,61" fill="#F2A93B"/>
      </svg>
    `;
  }

  function buildWidget() {
    const wrap = el('div', 'nv-fab-wrap');

    const hint = el('div', 'nv-fab-hint', 'Merhaba! Bir sorun mu var? 👋');
    const fab = el('button', 'nv-fab', penguinSVG('nv-'));
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Buzcuk asistanını aç');

    wrap.appendChild(hint);
    wrap.appendChild(fab);

    const panel = el('div', 'nv-panel');
    panel.innerHTML = `
      <div class="nv-panel-header">
        <div class="nv-panel-avatar">${penguinSVG('nvh-')}</div>
        <div class="nv-panel-title">
          <strong>Buzcuk</strong>
          <span>Novarge Akademi Asistanı</span>
        </div>
        <button type="button" class="nv-panel-close" aria-label="Kapat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="nv-panel-body" id="nvPanelBody"></div>
      <div class="nv-panel-footer">
        <input type="text" id="nvInput" placeholder="Bir şey sor…" autocomplete="off">
        <button type="button" class="nv-send-btn" id="nvSendBtn" aria-label="Gönder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(wrap);
    document.body.appendChild(panel);

    setTimeout(function () { hint.classList.add('show'); }, 1400);
    setTimeout(function () { hint.classList.remove('show'); }, 7000);

    const body = panel.querySelector('#nvPanelBody');
    const input = panel.querySelector('#nvInput');
    const sendBtn = panel.querySelector('#nvSendBtn');
    const closeBtn = panel.querySelector('.nv-panel-close');

    function addMessage(role, text) {
      const msg = el('div', 'nv-msg ' + (role === 'user' ? 'user' : 'bot'), '');
      msg.textContent = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
      return msg;
    }

    function addTyping() {
      const t = el('div', 'nv-typing', '<span></span><span></span><span></span>');
      body.appendChild(t);
      body.scrollTop = body.scrollHeight;
      return t;
    }

    function openPanel() {
      panel.classList.add('open');
      hint.classList.remove('show');
      if (!panelOpened) {
        panelOpened = true;
        addMessage('bot', 'Merhaba! Ben Buzcuk 🐧 Novarge Akademi\'nin buz gibi soğukkanlı ama bir o kadar sıcak asistanıyım. Kurslar, öğretmenler ya da kayıt olmak hakkında ne merak ediyorsan sorabilirsin!');
      }
      setTimeout(function () { input.focus(); }, 250);
    }
    function closePanel() {
      panel.classList.remove('open');
    }

    fab.addEventListener('click', function () {
      panel.classList.contains('open') ? closePanel() : openPanel();
    });
    closeBtn.addEventListener('click', closePanel);

    async function handleSend() {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMessage('user', text);
      historyTurns.push({ role: 'user', text: text });

      const typingEl = addTyping();

      const reply = await getAssistantReply(text);

      typingEl.remove();
      addMessage('bot', reply);
      historyTurns.push({ role: 'model', text: reply });
      if (historyTurns.length > 12) historyTurns = historyTurns.slice(-12);
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleSend();
    });
  }

  async function getAssistantReply(userText) {
    const apiKey = (typeof GEMINI_API_KEY !== 'undefined') ? GEMINI_API_KEY : '';
    if (!apiKey) {
      await wait(650 + Math.random() * 500);
      return FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
    }

    try {
      const model = (typeof GEMINI_MODEL !== 'undefined' && GEMINI_MODEL) ? GEMINI_MODEL : 'gemini-2.5-flash';
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;

      const contents = historyTurns.map(function (turn) {
        return { role: turn.role, parts: [{ text: turn.text }] };
      });
      contents.push({ role: 'user', parts: [{ text: userText }] });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: contents
        })
      });

      if (!res.ok) throw new Error('request failed');
      const data = await res.json();
      const text = data && data.candidates && data.candidates[0] &&
        data.candidates[0].content && data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

      return text ? text.trim() : 'Üzgünüm, tam olarak toparlayamadım şu an — bir daha sorar mısın?';
    } catch (e) {
      return 'Üzgünüm, düşüncelerim biraz buzlandı sanırım... birazdan tekrar dener misin? 🐧';
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { injectStyles(); buildWidget(); });
  } else {
    injectStyles();
    buildWidget();
  }
})();
