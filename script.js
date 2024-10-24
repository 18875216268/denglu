// Firebase配置
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDk5p6EJAe02LEeqhQm1Z1dZxlIqGrRcUo",
    authDomain: "asqrt-ed615.firebaseapp.com",
    databaseURL: "https://asqrt-ed615-default-rtdb.firebaseio.com",
    projectId: "asqrt-ed615",
    storageBucket: "asqrt-ed615.appspot.com",
    messagingSenderId: "131720495048",
    appId: "1:131720495048:web:35f43929e31c1cc3428afd",
    measurementId: "G-G7D5HRMF0E"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 获取DOM元素
const openModalBtn = document.getElementById('openModalBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.querySelector('.close');
const inputData = document.getElementById('inputData');
const tijiao = document.getElementById('tijiao');
const siteList = document.getElementById('siteList');
const deleteBtn = document.getElementById('deleteBtn');
const checkLatencyBtn = document.getElementById('checkLatencyBtn');

// 打开弹窗
openModalBtn.addEventListener('click', () => {
    modal.style.display = 'block';
});

// 关闭弹窗
closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

// 提交数据
tijiao.addEventListener('click', async () => {
    const lines = inputData.value.split('\n'); // 按行分割输入内容
    for (const line of lines) {
        const [name, url] = line.split('|').map(item => item.trim()); // 分割名称和链接
        if (name && url) {
            const newSiteRef = ref(database, 'sites/' + Date.now());
            
            const status = await checkURLStatus(url); // 检查URL状态
            const data = { name, url, status: status || 'N/A' }; // 保存状态或'N/A'
            
            await set(newSiteRef, data); // 写入Firebase数据库
        }
    }
    alert('软件库已添加！');
    inputData.value = '';
    modal.style.display = 'none'; // 关闭弹窗
});

// 从Firebase获取网站列表
onValue(ref(database, 'sites'), (snapshot) => {
    siteList.innerHTML = ''; // 清空当前列表
    snapshot.forEach((childSnapshot) => {
        const site = childSnapshot.val();
        const siteId = childSnapshot.key;

        const li = document.createElement('li');
        li.innerHTML = `
            <input type="text" class="site-name" value="${site.name}" disabled />
            <input type="text" class="site-url" value="${site.url}" disabled />
            <span class="latency">${site.status || 'N/A'}</span> 
            <button class="edit-btn" data-id="${siteId}">修改</button>
            <button class="save-btn" data-id="${siteId}" style="display:none;" disabled>保存</button>
            <button class="delete-single-btn" data-id="${siteId}">删除</button>
            <input type="checkbox" class="delete-checkbox" data-id="${siteId}" style="display:none;" />
        `;
        siteList.appendChild(li);
    });
    attachEventListeners(); // 绑定事件
});

// 绑定所有按钮的事件
function attachEventListeners() {
    const editBtns = document.querySelectorAll('.edit-btn');
    const saveBtns = document.querySelectorAll('.save-btn');
    const deleteCheckboxes = document.querySelectorAll('.delete-checkbox');

    editBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const li = btn.parentElement;
            li.querySelector('.site-name').removeAttribute('disabled');
            li.querySelector('.site-url').removeAttribute('disabled');
            btn.style.display = 'none';
            const saveBtn = li.querySelector('.save-btn');
            saveBtn.style.display = 'inline-block';
            saveBtn.removeAttribute('disabled');
        });
    });

    saveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const li = btn.parentElement;
            const siteId = btn.getAttribute('data-id');
            const name = li.querySelector('.site-name').value;
            const url = li.querySelector('.site-url').value;

            if (name && url) {
                set(ref(database, 'sites/' + siteId), { name, url })
                    .then(() => {
                        btn.style.display = 'none';
                        li.querySelector('.edit-btn').style.display = 'inline-block';
                        li.querySelector('.site-name').setAttribute('disabled', 'true');
                        li.querySelector('.site-url').setAttribute('disabled', 'true');
                    })
                    .catch((error) => {
                        console.error('更新网站信息时出错！', error);
                    });
            } else {
                alert('请填写完整的网站名称和链接。');
            }
        });
    });

    checkLatencyBtn.addEventListener('click', async () => {
        const statusElements = document.querySelectorAll('.latency'); // 获取所有状态显示元素
        for (const element of statusElements) {
            const url = element.previousElementSibling.value; // 获取对应的URL
            const status = await checkURLStatus(url); // 检测状态
            element.textContent = status; // 更新显示为“正常”或“异常”
        }
    });

    document.querySelectorAll('.delete-single-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const siteId = btn.getAttribute('data-id');
            deleteSite(siteId); // 调用删除函数
        });
    });
}

// 统一删除按钮事件
deleteBtn.addEventListener('click', () => {
    const deleteCheckboxes = document.querySelectorAll('.delete-checkbox');

    if (deleteBtn.textContent === "批量删除库") {
        deleteCheckboxes.forEach(checkbox => {
            checkbox.style.display = 'inline-block';
        });
        deleteBtn.textContent = "确认删除库";
    } else {
        const selectedIds = Array.from(deleteCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.getAttribute('data-id'));

        if (selectedIds.length > 0) {
            selectedIds.forEach(siteId => {
                deleteSite(siteId);
            });
        } 
        deleteCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.style.display = 'none';
        });
        deleteBtn.textContent = "批量删除库"; // 恢复删除按钮文本
    }
});

// 从Firebase删除特定的软件库
function deleteSite(siteId) {
    remove(ref(database, 'sites/' + siteId))
        .then(() => {
            console.log('软件库已删除');
        })
        .catch((error) => {
            console.error('删除时出错:', error);
        });
}

// 检查URL是否可访问并返回状态
async function checkURLStatus(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return response.ok ? '正常' : '异常';
    } catch (error) {
        console.error('无法访问URL:', error);
        return '异常';
    }
}

// 绑定全选功能
const selectAllCheckbox = document.getElementById('selectAllCheckbox');
selectAllCheckbox.addEventListener('change', () => {
    const deleteCheckboxes = document.querySelectorAll('.delete-checkbox');
    deleteCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
});
