document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.research-tab');
    const tabContents = document.querySelectorAll('.research-tab-content');
    
    // 默认激活第一个标签页
    if (tabs.length > 0 && tabContents.length > 0) {
        tabs[0].classList.add('active');
        tabContents[0].classList.add('active');
    }
    
    // 为每个标签页添加点击事件
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 移除所有标签页的激活状态
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 激活当前标签页和对应内容
            this.classList.add('active');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
                
                // 滚动到内容区域
                targetContent.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // URL hash 支持 - 允许直接链接到特定标签页
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const targetTab = document.querySelector(`.research-tab[data-tab="${hash}"]`);
        if (targetTab) {
            targetTab.click();
        }
    }
    
    // 可选：添加键盘导航支持
    document.addEventListener('keydown', function(e) {
        const activeTab = document.querySelector('.research-tab.active');
        if (!activeTab) return;
        
        let nextTab;
        
        if (e.key === 'ArrowRight') {
            nextTab = activeTab.nextElementSibling || tabs[0];
        } else if (e.key === 'ArrowLeft') {
            nextTab = activeTab.previousElementSibling || tabs[tabs.length - 1];
        }
        
        if (nextTab) {
            nextTab.click();
        }
    });
});