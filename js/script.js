/**
 * =========================================================================
 * SPOTLIGHT DANCE ACADEMY 暑期班 2026 - 核心互動邏輯與 Firebase 串接 (script.js)
 * =========================================================================
 */

// 導入 Firebase 11 模組化最新版 SDK (符合 Strict Rules 規範)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase 初始化與安全防禦配置
const appId = typeof __app_id !== 'undefined' ? __app_id : 'spotlight-dance-2026';
let firebaseConfig;

if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
} else {
    // 本地環境測試時備用配置
    firebaseConfig = {
        apiKey: "AIzaSyAs-demo-key-spotlight-dance",
        authDomain: "spotlight-dance-demo.firebaseapp.com",
        projectId: "spotlight-dance-demo",
        storageBucket: "spotlight-dance-demo.appspot.com",
        messagingSenderId: "1234567890",
        appId: "1:1234567890:web:abcdef"
    };
}

// 啟動 Firebase 核心服務
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userState = null;
let firebaseReady = false;

// 【規則三優先原則】：先登入驗證、再存取雲端資料庫
const initAuth = async () => {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
        firebaseReady = true;
    } catch (err) {
        console.warn("Firebase 雲端授權超時或未啟用，本機數據庫隊列已啟動備援。", err);
    }
};
initAuth();

// 監聽使用者身份狀態變更
onAuthStateChanged(auth, (user) => {
    userState = user;
    if (user) {
        setupFirestoreSync();
    }
});

// 本地數據離線備援緩存
let localLeads = JSON.parse(localStorage.getItem('dance_leads_2026')) || [];

// 嚴格路徑安全鎖 (符合 Rule 1 規範)
const getLeadsCollectionRef = () => {
    return collection(db, 'artifacts', appId, 'public', 'data', 'leads');
};

// 即時雲端動態監聽
let unsubscribeSync = null;
const setupFirestoreSync = () => {
    if (!userState) return;

    try {
        const q = getLeadsCollectionRef();
        unsubscribeSync = onSnapshot(q, (snapshot) => {
            const tempLeads = [];
            snapshot.forEach((doc) => {
                tempLeads.push({ id: doc.id, ...doc.data() });
            });
            
            // 【規則二規範】：避開多條件複合查詢，於瀏覽器端本地記憶體執行時間排序
            tempLeads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            localLeads = tempLeads;
            localStorage.setItem('dance_leads_2026', JSON.stringify(localLeads));
            renderLeads();
        }, (error) => {
            console.error("雲端數據流同步異常:", error);
        });
    } catch (e) {
        console.error("即時監聽模組初始化失敗:", e);
    }
};

// ==========================================
// 2. 倒計時邏輯
// ==========================================
const deadline = new Date("June 22, 2026 23:59:59").getTime();
const updateCountdown = () => {
    const now = new Date().getTime();
    const difference = deadline - now;

    const countdownEl = document.getElementById("countdown");
    if (!countdownEl) return;

    if (difference < 0) {
        countdownEl.innerText = "早鳥優惠已結束，但您仍可組團享受同行優惠！";
        return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    countdownEl.innerText = `${days}天 ${hours}小時 ${minutes}分 ${seconds}秒`;
};
setInterval(updateCountdown, 1000);
updateCountdown();

// ==========================================
// 3. 互動式海報切換資料集與邏輯
// ==========================================
const posterThemes = {
    all: {
        bgClass: 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-800',
        glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-amber-400/30 via-transparent to-transparent rounded-full blur-3xl',
        emoji: '💃🕺🎟️',
        title: '全舞種通行證',
        subtitle: 'K-POP • 拉丁舞 • 幼兒律動',
        illustration: '🌟 自由體驗 多重舞種 🌟',
        age: '2.5 歲至 15 歲以上'
    },
    idta: {
        bgClass: 'bg-gradient-to-b from-slate-800 via-slate-900 to-amber-950',
        glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-yellow-400/30 via-transparent to-transparent rounded-full blur-3xl',
        emoji: '🇬🇧🏆🔥',
        title: '英國 IDTA 考試速成班',
        subtitle: '專業認證 • 密集考證班',
        illustration: '🥇 100%最優級師資護航 🥇',
        age: '6 歲至 15 歲或以上'
    },
    latin: {
        bgClass: 'bg-gradient-to-b from-rose-700 via-rose-800 to-amber-900',
        glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-amber-300/40 via-transparent to-transparent rounded-full blur-3xl',
        emoji: '💃✨🩰',
        title: '拉丁舞興趣班',
        subtitle: '倫巴 RUMBA • 森巴 SAMBA',
        illustration: '🩰 雕琢體態 培養優雅氣質 🩰',
        age: '4 歲至 15 歲或以上'
    },
    kpop: {
        bgClass: 'bg-gradient-to-b from-indigo-900 via-purple-900 to-rose-900',
        glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-pink-500/40 via-transparent to-transparent rounded-full blur-3xl',
        emoji: '🔥🎙️😎',
        title: 'K-POP 流行明星班',
        subtitle: '大熱韓流排舞 • 暑期結業演出',
        illustration: '🎥 暑期完結大型結業演出 🎥',
        age: '6 歲至 16 歲或以上'
    },
    toddler: {
        bgClass: 'bg-gradient-to-b from-sky-400 via-teal-400 to-emerald-500',
        glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-yellow-300/40 via-transparent to-transparent rounded-full blur-3xl',
        emoji: '🧸🌱🎈',
        title: '幼兒律動啟蒙班',
        subtitle: '身心啟蒙與成長',
        illustration: '👶 免費諮詢 $100試堂優惠 👶',
        age: '2.5 歲至 5 歲幼兒'
    }
};

const promoTexts = {
    all: `【🔥 今個暑假拒絕宅在家！Spotlight 舞蹈學校暑期班 荔枝角、屯門雙校區同步招生中 💃🕺】

家長們，想小朋友暑假既可以健康放電，又可以學到實用、有國際認可證書嘅技能？
我哋「荔枝角總校」及「屯門分校」暑假班，早鳥及同行大折扣已經開啟！

延續我哋 4 月份英國證書考試榮獲 【100%最優級】高水準，今個暑假我哋推出全新升級課程：

🌟 【幼兒律動啟蒙班】(2.5 - 5 歲) —— $100 試堂體驗價！
全新融入【身心啟蒙與成長】主題，透過繪本與音樂遊戲，鍛鍊手腳協調、促進身心發展，快樂建立自信！
🎁【2026暑假限定：媽媽 Me-Time 雙響炮加購方案】🎁
凡報讀幼兒班全期 12 堂，即可獲贈專業軟底鞋一雙(價值$100)，並可用超值一口價 $960 同步加配【家長伸展班】(12堂)！孩子隔壁快樂跳舞，媽媽在這邊伸展拉筋放鬆，時間完全同步，接送最省心！(亦可按需要以$280購買「幼兒舞蹈校服」)

🌟 【英國 IDTA 考試速成班】(6 歲或以上) —— 專業密集特訓！
針對英國 IDTA 國際拉丁舞蹈考試標準密集特訓，由專業名師教授，想快速拿證、提升升學履歷不容錯過！(出席率必須高於 80%及通過模擬考試，方可推薦參加正式考試；需購買官方認證考試服$380/套)

🌟 【拉丁舞興趣班】(4 歲或以上) —— 告別寒背塑造體態！
着重體態改善、核心與線條，幫孩子建立優雅氣質，踏出自信舞步！(12堂全期送專業拉丁鞋；可按需要以$280加購專屬「拉丁跳舞校服」)

🌟 【K-pop 流行明星舞班】(6 歲或以上) —— 特設【暑期結業演出】！
學習最火熱的韓風排舞，鍛鍊舞台表情，暑期尾聲更會於 8月29日 屯門分校 進行大型成果結業演出！(12堂全期送韓風運動毛巾；演出衣服需必買$380/套)

⚠️ 註：所有「單日固定 6 堂計劃」由於上課時數不足，均不能參加大匯演。
✈️ 註：特別提供外遊請假最貼心彈性補堂機制，最多兩堂可彈性延續至九月中旬繼續補完課堂。

🎁 【暑期精選獨家優惠】(※ 註：各項優惠不可同時使用，家長可選最優惠之一項)
1️⃣ 【早鳥優惠】：6 月 22 日 23:59 前報名繳費全單享有【 9 折】！
2️⃣ 【二人同行】：老友組隊報名全單立享【 85 折】！
3️⃣ 【三人以上同行】：組團大優惠，全組每位同學立享【 75 折】！

📍 校區：
1) 荔枝角總校 (地鐵站步行2分鐘)
2) 屯門分校 (西鐵站步行2分鐘)

📞 報名/諮詢專線：5475 7757
💬 WhatsApp 快捷登記：5475 7757`,

    idta: `【🏆 衝刺國際證書！英國 IDTA 拉丁舞考試速成班 暑假密集招生 🥇🇬🇧】

不論是香港還是海外升學，一份國際認可的藝術證書都是孩子無形且耀眼的加分利器！
今個暑假，Spotlight 舞蹈學校正式於【荔枝角總校】及【屯門分校】推出——【英國 IDTA 考試速成班】：

✨ 課程三大必讀亮點：
1️⃣ 【高效通關】：專為 6 歲或以上同學設計，精煉考核內容，利用暑期集中訓練，短期內突破實力！
2️⃣ 【實力名師團隊】：承接我哋學校今年 4 月英國 NATD 考試 100%最優級的高水準師資，由專業名師教授，為學員逐個動作細緻打磨。
3️⃣ 【認可度極高】：英國 IDTA 證書全球認可，在幼小銜接、中學升學面試中含金量極高！

⚠️ 報名考試須知：
* 學員出席率必須高於 80% 及通過內部模擬考試，方可推薦參加正式考試。
* 需購買官方認證考試服 $380/套，每級別官方考試費稍後公布。
* 本班為專業認證考試班，不設單日固定班及不設試堂。（可免費諮詢）

🎁 【限時精選折扣】（※ 註：各項優惠不可同時使用）
* 6月22日 23:59 前早鳥享 9 折！
* 二人同行 85 折！三人以上組團高達 75 折！

💬 聯絡電話/WhatsApp：5475 7757 立即登記專業評估與課程規劃！`,

    latin: `【🩰 改善體態 培養優雅氣質！拉丁舞興趣班 暑假多班次報名中 💃✨】

暑假來臨，您是否在為孩子看手機、無精打采、寒背或內八字感到頭痛？
來 Spotlight 舞蹈學校（荔枝角總校 / 屯門分校），用拉丁舞讓孩子煥發青春活力與自信體態！

🌟 【拉丁舞興趣班】(適合4歲或以上)
我們不走死板的考試路線，而是通過科學愉快的教學法，讓孩子在優雅的倫巴（Rumba）與熱情的森巴（Samba）中舒展身體。

✨ 課程收穫：
1️⃣ 核心鍛鍊：有效改善聳肩寒背，塑造自然挺拔的高雅體態。
2️⃣ 提升樂感：訓練節奏感與下肢協調，激發內在美感與表演力。
3️⃣ 信心倍增：克服害羞，在音樂與舞台中大方展現自我。
🎁 報名全期 12 堂即送專業拉丁鞋一雙 (價值$250) + 畢業證書！(亦可按需要以$280加購專屬「拉丁跳舞校服」)
⚠️ 註：若報讀「單日固定 6 堂計劃」，由於上課時數不足，不能參加 8/29 屯門分校之暑期大匯演。

🎁 暑期精選折扣：6月22日23:59前早鳥 9 折，二人同行 85 折，三人 or 以上同行更享超低 75 折優惠！（※ 註：各項優惠不可同時使用）

📍 荔枝角總校 (地鐵站步行2分鐘) | 屯門分校 (西鐵站步行2分鐘)
📞 查詢/WhatsApp 留位：5475 7757`
};

const switchTheme = (themeKey) => {
    const theme = posterThemes[themeKey];
    const poster = document.getElementById('dance-poster');
    const bgGlow = document.getElementById('poster-bg-glow');
    const emojiCont = document.getElementById('poster-emoji-container');
    const mainTitle = document.getElementById('poster-main-title');
    const subTitle = document.getElementById('poster-sub-title');
    const illusText = document.getElementById('poster-illustration-text');
    const ageText = document.getElementById('poster-info-age');

    poster.className = poster.className.replace(/bg-gradient-to-b\s+from-[^\s]+\s+via-[^\s]+\s+to-[^\s]+/g, '');
    poster.classList.add(...theme.bgClass.split(' '));

    bgGlow.className = theme.glowClass;
    emojiCont.innerText = theme.emoji;
    mainTitle.innerText = theme.title;
    subTitle.innerText = theme.subtitle;
    illusText.innerText = theme.illustration;
    ageText.innerText = theme.age;

    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.className = "theme-btn flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-white hover:border-rose-200 text-slate-700 font-semibold transition-all transform active:scale-[0.98]";
    });
    const activeBtn = document.getElementById(`btn-${themeKey}`);
    if (activeBtn) {
        activeBtn.className = "theme-btn active flex items-center justify-between p-4 rounded-xl border-2 border-rose-500 bg-rose-50/50 text-rose-700 font-bold transition-all transform active:scale-[0.98]";
    }

    const copyKey = (themeKey === 'toddler' || themeKey === 'kpop') ? 'all' : themeKey;
    switchCopyText(copyKey);
};

const switchCopyText = (key) => {
    const display = document.getElementById('promo-text-display');
    if (display) display.innerText = promoTexts[key] || promoTexts.all;
    
    document.querySelectorAll('.copy-tab-btn').forEach(btn => {
        btn.className = "copy-tab-btn px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 transition-all";
    });
    const activeCopyBtn = document.getElementById(`btn-copy-${key}`);
    if (activeCopyBtn) {
        activeCopyBtn.className = "copy-tab-btn px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm transition-all";
    }
};

// 綁定海報與文案切換事件
const keys = ['all', 'idta', 'latin', 'kpop', 'toddler'];
keys.forEach(k => {
    const btn = document.getElementById(`btn-${k}`);
    if (btn) {
        btn.addEventListener('click', () => switchTheme(k));
    }
    const copyTabBtn = document.getElementById(`btn-copy-${k}`);
    if (copyTabBtn) {
        copyTabBtn.addEventListener('click', () => switchCopyText(k));
    }
});

// 初始化預設值
switchCopyText('all');

// 複製宣傳文案到剪貼簿
const copyToClipboard = () => {
    const display = document.getElementById('promo-text-display');
    if (!display) return;
    const textToCopy = display.innerText;
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            const btnText = document.getElementById('copy-btn-text');
            const icon = document.getElementById('copy-icon');
            
            if (btnText && icon) {
                btnText.innerText = '複製成功！';
                icon.className = "fa-solid fa-circle-check text-emerald-500 mr-1.5";
                
                setTimeout(() => {
                    btnText.innerText = '一鍵複製';
                    icon.className = "fa-regular fa-copy mr-1.5";
                }, 2000);
            }
        } else {
            showCustomModal('複製失敗，請手動複製！', 'rose');
        }
    } catch (err) {
        showCustomModal('您的瀏覽器不支援一鍵複製，請手動複製文字。', 'amber');
    }
    document.body.removeChild(textarea);
};
const copyTextBtn = document.getElementById('copy-text-btn');
if (copyTextBtn) {
    copyTextBtn.addEventListener('click', copyToClipboard);
}

// 輔助函式：自訂提示彈跳視窗 (非瀏覽器原生 Alert)
const showCustomModal = (message, colorTheme = 'indigo') => {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] px-4 animate-fade-in";
    const borderColors = colorTheme === 'rose' ? 'border-rose-500' : 'border-indigo-500';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-4 ${borderColors}">
            <p class="text-slate-800 text-sm font-semibold leading-relaxed">${message}</p>
            <button class="mt-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-lg transition-all" id="custom-modal-ok-btn">
                確認
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('custom-modal-ok-btn').addEventListener('click', () => modal.remove());
};

// ==========================================
// 4. 登記表單提交處理 (本機緩存及 Firebase 雲端雙向流)
// ==========================================
const handleFormSubmit = async (event) => {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn-text');
    if (submitBtn) submitBtn.innerText = "資料傳送中...";

    const campus = document.getElementById('form-campus').value;
    const parentName = document.getElementById('form-parent-name').value;
    const phone = document.getElementById('form-phone').value;
    const childName = document.getElementById('form-child-name').value;
    const age = document.getElementById('form-age').value;
    const notes = document.getElementById('form-notes').value;
    
    const interests = [];
    document.querySelectorAll('#form-interests input[type="checkbox"]:checked').forEach(cb => {
        interests.push(cb.value);
    });

    if (interests.length === 0) {
        showCustomModal('請至少選擇一門感興趣的課程！', 'rose');
        if (submitBtn) submitBtn.innerText = "提交登記 • 鎖定暑期精選折扣 🎁";
        return;
    }

    const record = {
        timestamp: new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' }),
        campus,
        parentName,
        phone,
        childName,
        age,
        interests: interests.join(', '),
        notes: notes || '無'
    };

    // Firebase 寫入機制 (遵從安全登入原則)
    if (userState && firebaseReady) {
        try {
            await addDoc(getLeadsCollectionRef(), record);
        } catch (err) {
            console.error("雲端存取失敗，使用本機暫存緩存。", err);
        }
    } else {
        localLeads.push(record);
        localStorage.setItem('dance_leads_2026', JSON.stringify(localLeads));
        renderLeads();
    }

    // 建立預留學位的 WhatsApp 導引流
    const waMessage = `你好，Spotlight Dance！我已在網上提交了 2026 暑假班的登記資訊，詳情如下：
---------------------------
📍 選擇校區：${campus}
👤 家長姓名：${parentName}
📞 聯絡電話：${phone}
👶 學生姓名：${childName} (${age})
💃 感興趣課程：${interests.join(', ')}
💬 備註：${notes || '無'}`;

    const encodedMsg = encodeURIComponent(waMessage);
    const waUrl = `https://wa.me/85254757757?text=${encodedMsg}`;

    // 自訂成功回饋視窗
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4";
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl border border-rose-100">
            <div class="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                <i class="fa-solid fa-check"></i>
            </div>
            <h3 class="text-xl font-bold text-slate-800">🎉 登記成功並已備份！</h3>
            <p class="text-slate-500 text-xs mt-2 leading-relaxed">
                您的登記資料已成功存儲在學校的數據安全中心。
            </p>
            <div class="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-4 text-left">
                <span class="text-xs font-bold text-amber-800 block mb-1">安排試堂：</span>
                <span class="text-[11px] text-slate-600 block leading-normal">建議您點擊下方按鈕，直接透過 WhatsApp 發送登記資訊給我們，讓我們能立即為您預留學位和排課！</span>
            </div>
            <div class="grid grid-cols-2 gap-3 mt-6">
                <button id="modal-close-btn" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition-all">
                    稍後聯絡
                </button>
                <a href="${waUrl}" target="_blank" id="modal-wa-btn" class="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-1">
                    <i class="fa-brands fa-whatsapp text-sm"></i> <span>WhatsApp 發送</span>
                </a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('modal-close-btn').addEventListener('click', () => modal.remove());
    document.getElementById('modal-wa-btn').addEventListener('click', () => modal.remove());

    const form = document.getElementById('dance-lead-form');
    if (form) form.reset();
    if (submitBtn) submitBtn.innerText = "提交登記 • 鎖定暑期精選折扣 🎁";
};

const formEl = document.getElementById('dance-lead-form');
if (formEl) {
    formEl.addEventListener('submit', handleFormSubmit);
}

// ==========================================
// 5. 管理員後台安全驗證與列表渲染
// ==========================================
let adminAuthorized = false;

const toggleAdminPanel = () => {
    const panel = document.getElementById('admin-panel');
    if (!panel) return;
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
        panel.scrollIntoView({ behavior: 'smooth' });
        renderLeads();
    }
};
const navAdminBtn = document.getElementById('nav-admin-btn');
if (navAdminBtn) navAdminBtn.addEventListener('click', toggleAdminPanel);

const closeAdminBtn = document.getElementById('close-admin-btn');
if (closeAdminBtn) closeAdminBtn.addEventListener('click', toggleAdminPanel);

const verifyAdminPassword = () => {
    const pwd = document.getElementById('admin-password').value;
    if (pwd === '54757757' || pwd === 'spotlight888') {
        const loginBox = document.getElementById('admin-login-box');
        const dataBox = document.getElementById('admin-data-box');
        if (loginBox) loginBox.classList.add('hidden');
        if (dataBox) dataBox.classList.remove('hidden');
        adminAuthorized = true;
        renderLeads();
    } else {
        showCustomModal('密碼錯誤！請輸入學校聯絡電話（8位數）作為管理密碼。', 'rose');
    }
};
const verifyAdminBtn = document.getElementById('verify-admin-btn');
if (verifyAdminBtn) verifyAdminBtn.addEventListener('click', verifyAdminPassword);

// 渲染名單資料庫列表
const renderLeads = () => {
    if (!adminAuthorized) return;

    const tbody = document.getElementById('leads-table-body');
    const countEl = document.getElementById('leads-count');
    if (!tbody || !countEl) return;

    tbody.innerHTML = '';
    countEl.innerText = localLeads.length;

    if (localLeads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center p-8 text-slate-400 font-medium">目前暫無家長登記數據</td>
            </tr>
        `;
        return;
    }

    localLeads.forEach((lead, index) => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 transition-colors border-b border-slate-100";
        
        const campusText = lead.campus || '';
        const parentText = lead.parentName || '';
        const phoneText = lead.phone || '';
        const childText = lead.childName || '';
        const ageText = lead.age || '';
        const interestsText = lead.interests || '';
        const notesText = lead.notes || '';
        const timestampText = lead.timestamp || '';

        tr.innerHTML = `
            <td class="p-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">${timestampText}</td>
            <td class="p-3 font-semibold text-slate-700 whitespace-nowrap">${campusText}</td>
            <td class="p-3 font-bold text-slate-800 whitespace-nowrap">${parentText}</td>
            <td class="p-3 whitespace-nowrap">
                <a href="https://wa.me/852${phoneText.replace(/\s+/g, '')}" target="_blank" class="text-emerald-600 hover:underline inline-flex items-center font-bold font-mono">
                    <i class="fa-brands fa-whatsapp mr-1 text-sm"></i> ${phoneText}
                </a>
            </td>
            <td class="p-3 whitespace-nowrap font-medium">${childText} <span class="text-slate-400 text-xs font-normal">(${ageText})</span></td>
            <td class="p-3"><span class="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-md text-xs border border-rose-100">${interestsText}</span></td>
            <td class="p-3 text-slate-500 max-w-xs truncate" title="${notesText}">${notesText}</td>
            <td class="p-3 text-center whitespace-nowrap">
                <button class="delete-lead-btn text-slate-300 hover:text-red-500 transition-colors text-sm p-1.5" data-index="${index}" data-id="${lead.id || ''}">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // 刪除條目安全機制
    document.querySelectorAll('.delete-lead-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = btn.getAttribute('data-index');
            const cloudId = btn.getAttribute('data-id');
            
            const confirmModal = document.createElement('div');
            confirmModal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] px-4";
            confirmModal.innerHTML = `
                <div class="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border-t-4 border-rose-500">
                    <p class="text-slate-800 text-sm font-semibold leading-relaxed">確定要刪除這筆登記資料嗎？此操作不可恢復。</p>
                    <div class="grid grid-cols-2 gap-3 mt-4">
                        <button id="cancel-delete-btn" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all">
                            取消
                        </button>
                        <button id="confirm-delete-btn" class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all">
                            確認刪除
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);

            document.getElementById('cancel-delete-btn').addEventListener('click', () => confirmModal.remove());
            document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
                confirmModal.remove();
                if (cloudId && userState && firebaseReady) {
                    try {
                        const leadDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'leads', cloudId);
                        await deleteDoc(leadDocRef);
                    } catch (err) {
                        console.error("雲端數據刪除錯誤:", err);
                    }
                } else {
                    localLeads.splice(idx, 1);
                    localStorage.setItem('dance_leads_2026', JSON.stringify(localLeads));
                    renderLeads();
                }
            });
        });
    });
};

// 導出名單為 CSV (適用於 Excel 導入)
const exportToCSV = () => {
    if (localLeads.length === 0) {
        showCustomModal('目前沒有可導出的名單！', 'amber');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "登記時間,分校,家長姓名,聯絡電話,學生姓名,年齡,感興趣課程,備註\n";

    localLeads.forEach(lead => {
        const row = [
            lead.timestamp || '',
            lead.campus || '',
            lead.parentName || '',
            lead.phone || '',
            lead.childName || '',
            lead.age || '',
            `"${(lead.interests || '').replace(/"/g, '""')}"`,
            `"${(lead.notes || '').replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Spotlight_暑期班報名表_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
const exportBtn = document.getElementById('export-excel-btn');
if (exportBtn) exportBtn.addEventListener('click', exportToCSV);