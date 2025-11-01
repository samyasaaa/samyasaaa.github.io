document.addEventListener('DOMContentLoaded', function() {
    console.log('搜索脚本已加载');
    
    // 获取DOM元素
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchStats = document.getElementById('searchStats');
    const noResults = document.getElementById('noResults');
    
    let searchData = [];
    let isLoading = false;
    
    // 加载搜索索引
    function loadSearchIndex() {
        if (isLoading) return;
        
        isLoading = true;
        console.log('开始加载搜索索引...');
        
        fetch('/searchindex.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('搜索索引加载失败: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                // 额外过滤：确保没有showcase类型的内容
                searchData = data.filter(item => {
                    return item && item.type !== 'showcase' && item.section !== 'showcase';
                });
                console.log('搜索索引加载完成，共', searchData.length, '条数据');
                console.log('样本数据:', searchData.slice(0, 2)); // 打印前两条数据用于调试
                isLoading = false;
                
                // 如果有URL查询参数，自动执行搜索
                const urlParams = new URLSearchParams(window.location.search);
                const query = urlParams.get('q');
                if (query && query.trim() !== '') {
                    searchInput.value = query;
                    performSearch(query);
                }
            })
            .catch(error => {
                console.error('加载搜索索引时出错:', error);
                searchResults.innerHTML = `<p class="error-message">搜索数据加载失败: ${error.message}</p>`;
                isLoading = false;
            });
    }
    
    // 初始化加载搜索索引
    loadSearchIndex();
    
    // 监听表单提交事件
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm === '') {
            searchResults.innerHTML = '<p>请输入搜索关键词</p>';
            searchStats.innerHTML = '';
            noResults.style.display = 'none';
            return;
        }
        
        // 更新URL但不刷新页面
        const newUrl = `${window.location.pathname}?q=${encodeURIComponent(searchTerm)}`;
        window.history.pushState({}, '', newUrl);
        
        // 执行搜索
        performSearch(searchTerm);
    });
    
    // 监听浏览器前进/后退
    window.addEventListener('popstate', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');
        
        if (query && query.trim() !== '') {
            searchInput.value = query;
            performSearch(query);
        } else {
            searchResults.innerHTML = '<p>请输入搜索关键词</p>';
            searchStats.innerHTML = '';
            noResults.style.display = 'none';
        }
    });

    function performSearch(searchTerm) {
        console.log('开始搜索:', searchTerm);
        
        // 显示搜索中状态
        searchResults.innerHTML = `<p>正在搜索 "${searchTerm}"...</p>`;
        
        // 如果数据还在加载中，等待加载完成
        if (isLoading) {
            console.log('等待搜索索引加载完成...');
            const checkInterval = setInterval(() => {
                if (!isLoading) {
                    clearInterval(checkInterval);
                    executeSearch(searchTerm);
                }
            }, 100);
            return;
        }
        
        executeSearch(searchTerm);
    }
    
    function executeSearch(searchTerm) {
        try {
            const results = searchInContent(searchData, searchTerm);
            displayResults(results, searchTerm);
        } catch (error) {
            console.error('搜索过程中出错:', error);
            searchResults.innerHTML = `<p class="error-message">搜索过程中出现错误: ${error.message}</p>`;
        }
    }

    function searchInContent(items, searchTerm) {
        const results = [];
        const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
        
        // 如果没有搜索词，返回空结果
        if (searchWords.length === 0) {
            return results;
        }
        
        items.forEach(item => {
            try {
                if (!item || !item.title) return;
                
                let score = 0;
                // 构建搜索内容，包含所有可能被搜索的字段
                const searchableContent = [
                    item.title || '',
                    item.content || '',
                    item.summary || '',
                    item.research || '',
                    item.position || '', // 确保包含职位字段
                    item.role || '',
                    item.research_area || '',
                    item.experience || '',
                    item.projects || '',
                    item.papers || '',
                    item.authors ? item.authors.join(' ') : ''
                ].join(' ').toLowerCase();
                
                const title = (item.title || '').toLowerCase();
                
                // 计算匹配度
                searchWords.forEach(word => {
                    if (title.includes(word)) {
                        score += 3; // 标题匹配权重更高
                    }
                    if (searchableContent.includes(word)) {
                        score += 1;
                    }
                });
                
                if (score > 0) {
                    results.push({
                        ...item,
                        score: score
                    });
                }
            } catch (error) {
                console.warn('处理搜索项时出错:', item, error);
            }
        });
        
        // 按匹配度排序
        return results.sort((a, b) => b.score - a.score);
    }

    function displayResults(results, searchTerm) {
        console.log('显示搜索结果:', results);
        
        // 更新统计信息
        searchStats.innerHTML = `<p>找到 ${results.length} 条搜索结果</p>`;
        
        if (results.length === 0) {
            searchResults.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';
        searchResults.style.display = 'block';
        
        // 生成搜索结果HTML
        let resultsHTML = '';
        
        results.forEach((result, index) => {
            try {
                console.log('处理结果项:', result); // 调试信息
                
                const highlightedTitle = highlightText(result.title, searchTerm);
                const highlightedSummary = getHighlightedSummary(
                    getSearchSummary(result, searchTerm),
                    searchTerm
                );
                const typeLabel = getTypeLabel(result.type);
                
                resultsHTML += `
                    <article class="search-result-item">
                        <div class="result-type">${typeLabel}</div>
                        <h2 class="search-result-title">
                            <a href="${result.permalink}">${highlightedTitle}</a>
                        </h2>
                        <div class="search-result-meta">
                            ${getResultMeta(result)}
                        </div>
                        <div class="search-result-summary">
                            ${highlightedSummary}
                        </div>
                        ${index < results.length - 1 ? '<hr class="result-divider">' : ''}
                    </article>
                `;
            } catch (error) {
                console.warn('生成结果项时出错:', result, error);
            }
        });
        
        searchResults.innerHTML = resultsHTML;
    }
    
    function getSearchSummary(result, searchTerm) {
        // 根据内容类型选择最适合显示的摘要
        if (result.type === 'member') {
            // 成员页面：优先显示研究方向和职位
            const memberInfo = [];
            if (result.position) memberInfo.push(result.position);
            if (result.research) memberInfo.push(`研究方向: ${result.research}`);
            if (result.role) memberInfo.push(result.role);
            
            if (memberInfo.length > 0) {
                return memberInfo.join(' | ');
            }
            return result.experience || result.summary || result.content;
        } else if (result.type === 'paper') {
            return `作者: ${result.authors ? result.authors.join(', ') : ''} | 发表于: ${result.venue || ''}`;
        } else if (result.type === 'research') {
            return result.summary || result.content;
        } else {
            return result.summary || result.content;
        }
    }
    
    function getResultMeta(result) {
        const metaParts = [];
        
        // 处理日期显示
        if (result.date) {
            // 如果日期是时间戳，转换为可读格式
            let dateStr = result.date;
            if (typeof dateStr === 'number') {
                const date = new Date(dateStr * 1000);
                dateStr = date.toLocaleDateString('zh-CN');
            }
            metaParts.push(`发布于 ${dateStr}`);
        }
        
        if (result.authors && result.authors.length > 0) {
            metaParts.push(`作者: ${result.authors.join(', ')}`);
        }
        
        // 成员特定信息
        if (result.type === 'member') {
            if (result.position && !result.position.includes('|')) {
                metaParts.push(`职位: ${result.position}`);
            }
            if (result.research && !result.research.includes('|')) {
                metaParts.push(`研究方向: ${result.research}`);
            }
            if (result.role && !result.role.includes('|')) {
                metaParts.push(`角色: ${result.role}`);
            }
        }
        
        if (result.research_area) {
            metaParts.push(`研究领域: ${result.research_area}`);
        }
        
        if (result.venue) {
            metaParts.push(`发表刊物: ${result.venue}`);
        }
        
        return metaParts.join(' | ');
    }

    function highlightText(text, searchTerm) {
        if (!text) return '';
        
        const words = searchTerm.split(' ').filter(word => word.length > 0);
        let highlighted = text;
        
        words.forEach(word => {
            const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
            highlighted = highlighted.replace(regex, '<span class="search-highlight">$1</span>');
        });
        
        return highlighted;
    }

    function getHighlightedSummary(content, searchTerm, maxLength = 200) {
        if (!content) return '';
        
        const words = searchTerm.split(' ').filter(word => word.length > 0);
        const contentLower = content.toLowerCase();
        
        // 查找第一个匹配的位置
        let firstMatchIndex = -1;
        for (const word of words) {
            const index = contentLower.indexOf(word.toLowerCase());
            if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
                firstMatchIndex = index;
            }
        }
        
        let summary = '';
        if (firstMatchIndex !== -1) {
            // 从匹配处前后截取
            const start = Math.max(0, firstMatchIndex - 50);
            const end = Math.min(content.length, firstMatchIndex + 150);
            summary = content.substring(start, end);
            
            if (start > 0) {
                summary = '...' + summary;
            }
            if (end < content.length) {
                summary = summary + '...';
            }
        } else {
            // 没有匹配，截取开头
            summary = content.substring(0, maxLength);
            if (content.length > maxLength) {
                summary += '...';
            }
        }
        
        return highlightText(summary, searchTerm);
    }

    function getTypeLabel(type) {
        const labels = {
            'page': '页面',
            'member': '成员',
            'project': '项目',
            'paper': '论文',
            'research': '研究方向'
        };
        
        return labels[type] || '内容';
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});