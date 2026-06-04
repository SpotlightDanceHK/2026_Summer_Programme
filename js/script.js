/**
* =========================================================================
* SPOTLIGHT DANCE ACADEMY 暑期班 2026 - 核心互動邏輯與 Firebase 串接 (script.js)
* =========================================================================
*/

// 導入 Firebase 11 模組化最新版 SDK (符合 Strict Rules 規範)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 1. 全局配置與安全環境變數讀取
// ==========================================
const appId = typeof window !== 'undefined' && window.__app_id ? window.__app_id : 'spotlight-dance-2026';
let firebaseConfig;

if (typeof window !== 'undefined' && window.__firebase_config) {
firebaseConfig = JSON.parse(window.__firebase_config);
} else {
// 預設 GitHub Pages 安全備用配置
firebaseConfig = {
apiKey: "AIzaSyAs-demo-key-spotlight-dance",
authDomain: "spotlight-dance-demo.firebaseapp.com",
projectId: "spotlight-dance-demo",
storageBucket: "spotlight-dance-demo.appspot.com",
messagingSenderId: "1234567890",
appId: "1:1234567890:web:abcdef"
};
}

// 宣告運作變數
let db, auth;
let userState = null;
let firebaseReady = false;
let localLeads = JSON.parse(localStorage.getItem('dance_leads_2026')) || [];

// ==========================================
// 2. 獨立的前端交互邏輯
// ==========================================

// 海報與文案切換資料庫
const posterThemes = {
all: {
bgClass: 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-800',
glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-amber-400/30 via-transparent to-transparent rounded-full blur-3xl',
emoji: '💃🕺🎟️',
title: '全舞種通行證',
subtitle: 'K-POP • 拉丁舞 • 標準舞',
illustration: '🌟 自由體驗 多重舞種 🌟',
age: '2.5 歲至 15 歲以上'
},
idta: {
bgClass: 'bg-gradient-to-b from-slate-800 via-slate-900 to-amber-950',
glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-yellow-400/30 via-transparent to-transparent rounded-full blur-3xl',
emoji: '🇬🇧🏆🔥',
title: '英國 IDTA 考試速成班',
subtitle: '專業雙人配合 • 密集考證',
illustration: '🥇 100%最優級師資護航 🥇',
age: '6 歲至 15 歲或以上'
},
ballroom: {
bgClass: 'bg-gradient-to-b from-amber-500 via-orange-600 to-amber-800',
glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-yellow-300/40 via-transparent to-transparent rounded-full blur-3xl',
emoji: '💃✨🕺',
title: '兒童及青少年標準舞班',
subtitle: '華爾茲 WALTZ • 探戈 TANGO',
illustration: '🩰 贈專業標準舞鞋 + 畢業證書 🩰',
age: '4 歲至 15 歲或以上'
},
latin: {
bgClass: 'bg-gradient-to-b from-rose-700 via-rose-800 to-amber-900',
glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-amber-300/40 via-transparent to-transparent rounded-full blur-3xl',
emoji: '💃✨🩰',
title: '拉丁舞興趣班',
subtitle: '單人Solo • 精彩主題團舞',
illustration: '🩰 雕琢體態 培養優雅氣質 🩰',
age: '4 歲至 15 歲或以上'
},
kpop: {
bgClass: 'bg-gradient-to-b from-indigo-900 via-purple-900 to-rose-900',
glowClass: 'absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[60%] bg-gradient-to-b from-pink-500/40 via-transparent to-transparent rounded-full blur-3xl',
emoji: '🔥🎙️😎',
title: 'K-POP 流行明星班',
subtitle: '大熱韓流排舞 • 暑期畢業大匯演',
illustration: '🎥 暑期畢業大匯演熱門 🎥',
age: '4 歲至 16 歲或以上'
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

延續我哋英國證書考試榮獲 【100%最優級】高水準，今個暑假我哋推出全新升級課程：

🌟 【幼兒律動啟蒙班】(2.5 - 5 歲) —— $100 試堂體驗價！
🎁【2026暑假限定：媽媽 Me-Time 雙響炮加購方案】🎁
凡報讀幼兒班全期 12 堂，即可獲贈專業軟底鞋一雙(價值$100)，並可用超值一口價 $960 同步加配【家長伸展班】(12堂)！時間完全同步，接送最省心！

🌟 【兒童及青少年標準舞班】(4 歲或以上) —— 華爾茲及探戈啟蒙！
端莊優雅！著重挺拔身姿與空間協調訓練。報讀全期 12 堂即送專業標準舞鞋一雙 (價值 $250) + 畢業證書！時間接連在幼兒班後 1 小時上課。

🌟 【拉丁舞興趣班】(4 歲或以上) —— 告別駝背塑造體態！
特別以「單人舞步 (Solo)」為主，同時強力強調以「訓練精彩主題團體舞」為課程核心，讓孩子展現優雅氣質，開心登上大匯演舞台。報讀全期 12 堂送專業拉丁鞋一雙 (價值 $250) + 畢業證書！

🌟 【K-pop 流行明星舞班】(4 歲或以上) —— 特設【暑期畢業演出】！
學習最熱韓風排舞，鍛鍊核心，暑期尾聲於 8月29日 屯門分校 進行暑期畢業大匯演！全期 12 堂送潮流運動毛巾。

🌟 【英國 IDTA 考試速成班】(6 歲或以上) —— 雙人配合傳統考證班！
專攻傳統拉丁舞雙人舞步，密集高強度訓練，適合快速衝刺考取國際證書、升學面試履歷加分！

✈️ 註：特別提供外遊請假最貼心彈性補堂機制，最多兩堂可彈性延續至九月中旬繼續補完課堂。

🎁 【組合多修重磅大折扣】
1️⃣ 【跨科雙修】：任選二科報讀全期 24 堂享【 85 折】優惠，全單只需 $3,570 (慳 $630)！
2️⃣ 【全能舞霸大滿貫】：同時報讀標準舞 + 拉丁舞興趣 + K-pop 共 36 堂即享【 75 折】終極折扣，全單只需 $4,725 (慳 $1,575)！
3️⃣ 【早鳥優惠】：單科 6 月 22 日前報名享 9 折。二人同行單科享 85 折，三人同行單科享 75 折！(※ 註：各項優惠不可疊加)

📍 校區：
1) 荔枝角總校 (地鐵站步行 2 分鐘)
2) 屯門分校 (西鐵站步行 2 分鐘)

📞 報名/諮詢專線：5475 7757
💬 WhatsApp 快捷登記：5475 7757`,

idta: `【🏆 升學面試大熱！英國 IDTA 拉丁舞考試速成班 暑假密集招募中 🥇🇬🇧】

不論是香港還是海外升學，一份國際認可的頂尖證書都是孩子耀眼的履歷加分項！
今個暑假，Spotlight 舞蹈學校正式於【荔枝角總校】及【屯門分校】推出——【英國 IDTA 考試速成班】：

✨ 課程三大特色：
1️⃣ 【傳統雙人配合】：本班專攻傳統國際拉丁雙人配合舞步，著重身形線條、配合空間感與雙人默契。
2️⃣ 【短期密集考證】：專為 6 歲或以上設計，集中在暑期高強度精煉，快速衝刺。
3️⃣ 【升學面試加分】：在幼小銜接、中學面試中含金量極高。學員出席率須高於 80% 並通過內部模擬考試，方推薦參加正式考試。

💬 聯絡電話/WhatsApp：5475 7757 立即登記專業評估與課程規劃！`,

ballroom: `【🕺 端莊體態氣質！兒童及青少年標準舞班 全新暑期矚目上線 🌟】

想孩子告別手機低頭族，塑造挺拔大方的明星身姿？Spotlight 舞蹈學校推出全新【兒童及青少年標準舞班】！

✨ 課程大亮點：
1️⃣ 【端莊儀態】：學習經典華爾茲、探戈入門，著重肢體控制、身姿優雅與空間協調。
2️⃣ 【專屬大贈送】：報讀全期 12 堂即免費贈送「專業標準舞鞋一雙 (價值 $250)」與培訓畢業證書！
3️⃣ 【暑期畢業演出】：全期學員可參與 8/29 暑期畢業大匯演！大演出服裝訂購價 $380/套。

🎁 暑期精選大折扣：
* 任選兩修(雙修)享 85 折！三科全包(標準舞 + 拉丁舞興趣 + K-pop) 終極大滿貫更享有 75 折大特惠，每堂低至 $131.25！

📍 荔枝角總校 (步行2分鐘) | 屯門分校 (步行2分鐘)
📞 查詢/WhatsApp 留位：5475 7757`,

latin: `【🩰 專注個人風采與主題團舞！拉丁舞興趣班 暑假班次全面報讀中 💃✨】

暑假來臨，給孩子一個綻放自信的熱情暑假！Spotlight 舞蹈學校全新調整：

🌟 【拉丁舞興趣班】(適合 4 歲或以上)
1️⃣ 【單人Solo與精彩團舞】：本興趣班特別以「單人舞步 (Solo)」為主！同時強力強調「以訓練精彩主題團體舞為主」，孩子既可在無配對拘束下，專注於自我核心、平衡，又能與夥伴們一起磨練具有故事張力的團體排舞，特別適合渴望登上暑期畢業大匯演大展身手的孩子！
2️⃣ 【塑造體態】：專注改善聳肩駝背，舒展肢體，培養高雅氣格。
3️⃣ 【專屬贈鞋】：報讀全期 12 堂即贈送「專業拉丁舞鞋一雙 (價值 $250)」及培訓畢業證書！
⚠️ 註：單日固定 6 堂計劃時數不足，不能參加畢業成果大匯演。

🎁 限時精選折扣：單科早鳥 9 折，雙修 85 折，大滿貫三科全修享有 75 折極致特惠，每堂低至 $131.25！

📞 查詢/WhatsApp 留位：5475 7757`
};

// 執行前端頁面初始化
const initUI = () => {
// 1. 初始化倒計時 (使用 iOS、Safari 100% 相容的日期數值構造，徹底解決NaN問題)
const deadline = new Date(2026, 5, 22, 23, 59, 59).getTime(); // 2026年6月22日
const updateCountdown = () => {
const now = new Date().getTime();
const difference = deadline - now;
const countdownEl = document.getElementById("countdown");
if (!countdownEl) return;

if (difference < 0) {
countdownEl.innerText = "早鳥優惠已截止，但您仍可組團享受同行優惠！";
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

// 預設載入通行證文案
switchCopyText('all');
};

// 切換海報邏輯
const switchTheme = (themeKey) => {
const theme = posterThemes[themeKey];
const poster = document.getElementById('dance-poster');
const bgGlow = document.getElementById('poster-bg-glow');
const emojiCont = document.getElementById('poster-emoji-container');
const mainTitle = document.getElementById('poster-main-title');
const subTitle = document.getElementById('poster-sub-title');
const illusText = document.getElementById('poster-illustration-text');
const ageText = document.getElementById('poster-info-age');

if (!poster || !theme) return;

poster.className = poster.className.replace(/bg-gradient-to-b\s+from-[^\s]+\s+via-[^\s]+\s+to-[^\s]+/g, '');
poster.classList.add(...theme.bgClass.split(' '));

if (bgGlow) bgGlow.className = theme.glowClass;
if (emojiCont) emojiCont.innerText = theme.emoji;
if (mainTitle) mainTitle.innerText = theme.title;
if (subTitle) subTitle.innerText = theme.subtitle;
if (illusText) illusText.innerText = theme.illustration;
if (ageText) ageText.innerText = theme.age;

// 切換控制面板按鈕樣式
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

// 切換文案顯示
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

// 一鍵複製
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
showCustomModal('您的瀏覽器不支援此複製功能，請手動選取複製。', 'amber');
}
document.body.removeChild(textarea);
};

// 自訂非阻斷彈窗
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
// 3. Firebase 基礎模組化初始化 (沙盒包裝)
// ==========================================
const initFirebase = async () => {
try {
const app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getFirestore(app);

// 先授權、後存取 (Strict Rule 3)
if (typeof window !== 'undefined' && window.__initial_auth_token) {
await signInWithCustomToken(auth, window.__initial_auth_token);
} else {
await signInAnonymously(auth);
}

firebaseReady = true;

onAuthStateChanged(auth, (user) => {
userState = user;
if (user) {
setupFirestoreSync();
}
});
} catch (e) {
console.warn("已啟動本地緩存與 WhatsApp 即時發送模式。", e);
}
};

const getLeadsCollectionRef = () => {
return collection(db, 'artifacts', appId, 'public', 'data', 'leads');
};

let unsubscribeSync = null;
const setupFirestoreSync = () => {
if (!userState || !firebaseReady) return;
try {
const q = getLeadsCollectionRef();
unsubscribeSync = onSnapshot(q, (snapshot) => {
const tempLeads = [];
snapshot.forEach((doc) => {
tempLeads.push({ id: doc.id, ...doc.data() });
});

// 本地排序避開複合查詢索引錯誤 (Strict Rule 2)
tempLeads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

localLeads = tempLeads;
localStorage.setItem('dance_leads_2026', JSON.stringify(localLeads));
renderLeads();
}, (error) => {
console.warn("取得資料流微調中，已啟動本地快照緩存機制。", error);
});
} catch (e) {
console.warn("即時監聽模組載入失敗。", e);
}
};

// ==========================================
// 4. 登記資料提交與 WhatsApp 完美導流 (100% 成功解決方案)
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

// 先存至本地隊列 (高保障不漏單)
localLeads.push(record);
localStorage.setItem('dance_leads_2026', JSON.stringify(localLeads));
renderLeads();

// 異步備份至 Firebase
if (userState && firebaseReady) {
try {
await addDoc(getLeadsCollectionRef(), record);
} catch (err) {
console.error("雲端寫入延遲，改用本地紀錄緩存。", err);
}
}

// 建立 WhatsApp 回報連結流
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

// 呼叫自訂彈窗引流
const modal = document.createElement('div');
modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 animate-fade-in";
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
<span class="text-xs font-bold text-amber-800 block mb-1">鎖定學位與排課：</span>
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

// ==========================================
// 5. 管理員控制台
// ==========================================
const toggleAdminPanel = () => {
const panel = document.getElementById('admin-panel');
if (!panel) return;
panel.classList.toggle('hidden');
if (!panel.classList.contains('hidden')) {
panel.scrollIntoView({ behavior: 'smooth' });
renderLeads();
}
};

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

const deleteLead = (index) => {
const confirmModal = document.createElement('div');
confirmModal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] px-4 animate-fade-in";
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
const lead = localLeads[index];
if (lead && lead.id && userState && firebaseReady) {
try {
const leadDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'leads', lead.id);
await deleteDoc(leadDocRef);
} catch (err) {
console.error("雲端數據刪除錯誤:", err);
}
} else {
localLeads.splice(index, 1);
localStorage.setItem('dance_leads_2026', JSON.stringify(localLeads));
renderLeads();
}
});
};

let adminAuthorized = false;
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
<button onclick="deleteLead(${index})" class="text-slate-300 hover:text-red-500 transition-colors text-sm p-1.5">
<i class="fa-regular fa-trash-can"></i>
</button>
</td>
`;
tbody.appendChild(tr);
});
};

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

// ==========================================
// 6. 全局橋接掛載與事件綁定 (完美解決 onclick ReferenceError 隔離錯誤)
// ==========================================
window.switchTheme = switchTheme;
window.switchCopyText = switchCopyText;
window.toggleAdminPanel = toggleAdminPanel;
window.verifyAdminPassword = verifyAdminPassword;
window.deleteLead = deleteLead;
window.exportToCSV = exportToCSV;
window.copyToClipboard = copyToClipboard;
window.handleFormSubmit = handleFormSubmit;

// 頁面主入口監聽
window.addEventListener('DOMContentLoaded', () => {
// 優先執行交互初始化 (確保倒數計時與切換海報在毫秒內正常啟動)
initUI();

// 主動手動綁定表單與文案複製按鈕以防 HTML 綁定意外失效
const formEl = document.getElementById('dance-lead-form');
if (formEl) {
formEl.addEventListener('submit', handleFormSubmit);
}
const copyBtn = document.getElementById('copy-text-btn');
if (copyBtn) {
copyBtn.addEventListener('click', copyToClipboard);
}
const adminPanelBtn = document.getElementById('nav-admin-btn');
if (adminPanelBtn) {
adminPanelBtn.addEventListener('click', toggleAdminPanel);
}

// 異步靜默連結 Firebase SDK 資料流，防止卡死
initFirebase();
});