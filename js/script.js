let userData = {};

document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 儲存資料
    userData = {
        name: document.getElementById('name').value,
        package: document.getElementById('package').value
    };

    // 切換介面
    document.getElementById('formSection').classList.add('hidden');
    document.getElementById('successSection').classList.remove('hidden');
});

document.getElementById('whatsappBtn').addEventListener('click', function() {
    // 請將 85254757757 修改為您的真實電話
    const phone = "85254757757"; 
    const msg = `你好，我想登記：${userData.package}，學生姓名：${userData.name}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
});