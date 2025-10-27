document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');  //后来添加
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const yearFilter = document.getElementById('yearFilter');
    const paperItems = document.querySelectorAll('.paper-item');
    const noResults = document.getElementById('noResults');

    console.log('Found paper items:', paperItems.length);  //后来添加

    // 如果论文数量为0，说明数据加载有问题
    if (paperItems.length === 0) {
        console.error('No paper items found. Check your data file.');
        noResults.style.display = 'block';
        noResults.textContent = '暂无论文数据';
        return;
    }
    
    // 初始化筛选功能
    function initFilter() {
        // 动态生成年份选项
        const years = [...new Set([...paperItems].map(item => item.dataset.year))].sort((a, b) => b - a);
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
        
        // 绑定事件监听器
        searchInput.addEventListener('input', debounce(filterPapers, 300));
        typeFilter.addEventListener('change', filterPapers);
        yearFilter.addEventListener('change', filterPapers);
        
        // 初始过滤
        filterPapers();
    }
    
    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 过滤论文函数
    function filterPapers() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedType = typeFilter.value;
        const selectedYear = yearFilter.value;
        
        let visibleCount = 0;
        
        paperItems.forEach(item => {
            const title = item.dataset.title;
            const authors = item.dataset.authors;
            const type = item.dataset.type;
            const year = item.dataset.year;
            
            // 检查搜索条件
            const matchesSearch = !searchTerm || 
                                title.includes(searchTerm) || 
                                authors.includes(searchTerm);
            
            // 检查类型条件
            const matchesType = !selectedType || type === selectedType;
            
            // 检查年份条件
            const matchesYear = !selectedYear || year === selectedYear;
            
            // 显示或隐藏论文项
            if (matchesSearch && matchesType && matchesYear) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });
        
        // 显示/隐藏无结果提示
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        
        // 如果没有论文显示，调整无结果提示的位置
        if (visibleCount === 0) {
            noResults.style.marginTop = '20px';
        }
    }
    
    // 初始化
    initFilter();
});