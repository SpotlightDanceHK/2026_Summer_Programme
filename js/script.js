// 1. 初始化 Firebase 雲端儲存 (請替換為您的 Firebase 專案設定)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 若已填寫正確 API Key，則啟動資料庫
if(firebaseConfig.apiKey !== "YOUR_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    var db = firebase.firestore();
}

let currentFormData = {};

// 2. 處理表單提交
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerText = "資料備份中...";

    // 取得資料
    currentFormData = {
        studentName: document.getElementById('studentName').value,
        course: document.getElementById('course').value,
        timestamp: new Date()
    };

    // 將資料寫入 Firebase Firestore
    if(typeof db !== 'undefined') {
        db.collection("summer_registrations").add(currentFormData)
        .then(() => {
            showSuccessSection();
        })
        .catch((error) => {
            console.error("資料備份失敗: ", error);
            alert("系統忙碌中，但您仍可直接透過 WhatsApp 聯絡我們。");
            showSuccessSection(); // 即使失敗也讓家長能聯絡
        });
    } else {
        // 測試模式：若未設定 Firebase，模擬備份完成
        console.log("尚未設定 Firebase，模擬備份成功");
        setTimeout(showSuccessSection, 800);
    }
});

// 3. 切換至成功頁面
function showSuccessSection() {
    document.getElementById('formSection').classList.add('hidden');
    document.getElementById('successSection').classList.remove('hidden');
}

// 4. WhatsApp 按鈕邏輯
document.getElementById('whatsappBtn').addEventListener('click', function() {
    // ⚠️ 請在這裡填寫您的 WhatsApp 號碼 (852 開頭，不需加 + 號)
    const phoneNumber = "85290000000"; 
    
    const message = `你好，已在網頁完成登記只差最後確認：\n\n學生姓名：${currentFormData.studentName}\n報讀課程：${currentFormData.course}\n\n請協助確認，謝謝！`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
});