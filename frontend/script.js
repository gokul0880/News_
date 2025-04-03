document.addEventListener('DOMContentLoaded', function() {
    const apiKey = '2b17cb0dc599989bc4be0d982ced4394';
    const newsContainer = document.getElementById('news-container');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const categoryLinks = document.querySelectorAll('.categories li a');
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const mainContent = document.getElementById('main-content');
    const readModal = document.getElementById('read-modal');
    const slangModal = document.getElementById('slang-modal');
    const readTextBtn = document.getElementById('read-text');
    const readVoiceBtn = document.getElementById('read-voice');
    const slangOptions = document.querySelectorAll('.slang-options button');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    
    // New elements for summary feature
    const textOptionsModal = document.getElementById('text-options-modal');
    const readFullBtn = document.getElementById('read-full');
    const readSummaryBtn = document.getElementById('read-summary');
    const summaryPage = document.getElementById('summary-page');
    const summaryContent = document.getElementById('summary-content');
    const backBtn = document.getElementById('back-btn');

    let currentCategory = 'general';
    let currentSearchTerm = '';
    let useLocalData = false;
    let currentArticle = null;

    // Initial load
    fetchNews(currentCategory);
    
    // Sidebar toggle
    menuBtn.addEventListener('click', toggleSidebar);
    closeSidebar.addEventListener('click', toggleSidebar);
    
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('shifted');
    }
    
    // Close modals when clicking X button
    closeModalButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            readModal.classList.remove('active');
            slangModal.classList.remove('active');
            textOptionsModal.classList.remove('active');
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === readModal) {
            readModal.classList.remove('active');
        }
        if (event.target === slangModal) {
            slangModal.classList.remove('active');
        }
        if (event.target === textOptionsModal) {
            textOptionsModal.classList.remove('active');
        }
    });

    // Category navigation
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active category
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            currentCategory = this.dataset.category;
            currentSearchTerm = '';
            searchInput.value = '';
            
            fetchNews(currentCategory);
        });
    });
    
    // Search functionality
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    function performSearch() {
        currentSearchTerm = searchInput.value.trim();
        if (currentSearchTerm) {
            fetchNews(currentCategory, currentSearchTerm);
        } else {
            fetchNews(currentCategory);
        }
    }
    
    async function fetchNews(category, keyword = '') {
        // Show loading state
        newsContainer.innerHTML = '';
        loadingElement.style.display = 'flex';
        errorElement.style.display = 'none';
        
        try {
            let data;
            
            if (useLocalData) {
                // Fallback to local JSON data
                const response = await fetch('tamil-news.json');
                data = await response.json();
                
                // Filter by category if not searching
                if (!keyword) {
                    data.articles = data.articles.filter(article => 
                        (article.source && article.source.name && article.source.name.toLowerCase().includes(category)) || 
                        category === 'general'
                    );
                }
                
                // Filter by keyword if searching
                if (keyword) {
                    const searchTerm = keyword.toLowerCase();
                    data.articles = data.articles.filter(article => 
                        (article.title && article.title.toLowerCase().includes(searchTerm)) || 
                        (article.description && article.description.toLowerCase().includes(searchTerm))
                    );
                }
            } else {
                // Try to fetch from API first
                let url;
                if (keyword) {
                    url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(keyword)}&lang=ta&country=in&max=30&apikey=${apiKey}`;
                } else {
                    url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=ta&country=in&max=30&apikey=${apiKey}`;
                }
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                data = await response.json();
            }
            
            if (data.articles && data.articles.length > 0) {
                displayNews(data.articles);
            } else {
                // If no articles found and we were using API, try local data
                if (!useLocalData) {
                    useLocalData = true;
                    fetchNews(category, keyword);
                } else {
                    showError('செய்திகள் எதுவும் கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.');
                }
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            
            // If API fails and we haven't tried local data yet
            if (!useLocalData) {
                useLocalData = true;
                fetchNews(category, keyword);
            } else {
                showError('செய்திகள் ஏற்றும் போது பிழை ஏற்பட்டது. பின்னர் முயற்சிக்கவும்.');
            }
        } finally {
            loadingElement.style.display = 'none';
        }
    }
    
    function displayNews(articles) {
        newsContainer.innerHTML = '';
        
        if (!articles || articles.length === 0) {
            showError('செய்திகள் எதுவும் கிடைக்கவில்லை.');
            return;
        }
        
        articles.forEach(article => {
            // Skip if article is missing required fields
            if (!article.title) return;
            
            const newsCard = document.createElement('article');
            newsCard.className = 'news-card';
            
            // Format published date
            let formattedDate = 'தேதி இல்லை';
            if (article.publishedAt) {
                const publishedDate = new Date(article.publishedAt);
                formattedDate = publishedDate.toLocaleDateString('ta-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            
            // Get category from source name or use current category
            const newsCategory = (article.source && article.source.name) || currentCategory;
            const articleContent = article.content || article.description || 'விளக்கம் இல்லை';
            
            newsCard.innerHTML = `
                <img src="${article.image || 'https://via.placeholder.com/300x180?text=No+Image'}" 
                     alt="${article.title}" 
                     class="news-image" 
                     onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
                <div class="news-content">
                    <span class="news-category">${newsCategory}</span>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description || 'விளக்கம் இல்லை'}</p>
                    <div class="news-footer">
                        <span>${formattedDate}</span>
                        <button class="read-more-btn" 
                                data-url="${article.url || '#'}" 
                                data-title="${article.title}" 
                                data-content="${articleContent.replace(/"/g, '&quot;')}"
                                data-image="${article.image || ''}">
                            மேலும் வாசிக்க <i class="fas fa-external-link-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            
            newsContainer.appendChild(newsCard);
        });
        
        // Use event delegation for dynamically created buttons
        newsContainer.addEventListener('click', function(e) {
            const readMoreBtn = e.target.closest('.read-more-btn');
            if (readMoreBtn) {
                e.preventDefault();
                currentArticle = {
                    url: readMoreBtn.dataset.url,
                    title: readMoreBtn.dataset.title,
                    content: readMoreBtn.dataset.content,
                    image: readMoreBtn.dataset.image
                };
                openReadModal();
            }
        });
    }
    
    function openReadModal() {
        if (!currentArticle) return;
        readModal.classList.add('active');
    }
    
    function showError(message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Read mode selection
    readTextBtn.addEventListener('click', function() {
        readModal.classList.remove('active');
        textOptionsModal.classList.add('active');
    });
    
    readVoiceBtn.addEventListener('click', function() {
        readModal.classList.remove('active');
        slangModal.classList.add('active');
    });
    
    // Text options selection
    readFullBtn.addEventListener('click', function() {
        textOptionsModal.classList.remove('active');
        if (currentArticle) {
            alert(`Reading full article:\n\n${currentArticle.title}\n\n${currentArticle.content}`);
        }
    });
    
    readSummaryBtn.addEventListener('click', function() {
        textOptionsModal.classList.remove('active');
        fetchSummary(currentArticle);
    });
    
    // Back button from summary page
    backBtn.addEventListener('click', function() {
        summaryPage.style.display = 'none';
        mainContent.style.display = 'block';
    });
    
    // Slang selection
    slangOptions.forEach(option => {
        option.addEventListener('click', function() {
            const slang = this.dataset.slang;
            slangModal.classList.remove('active');
            if (currentArticle) {
                // Implement voice reading with selected slang here
                console.log(`Reading with ${slang} slang:`, currentArticle.title);
                alert(`Preparing to read in ${slang} slang:\n\n${currentArticle.title}\n\n(This would call your Python backend)`);
            }
        });
    });

    // New function to fetch summary from backend
    async function fetchSummary(article) {
        loadingElement.style.display = 'flex';
        
        try {
            // In a real implementation, this would call your Python backend
            // For now, we'll simulate it with a simple summary
            const summary = await simulateSummary(article.content);
            
            // Display the summary page
            mainContent.style.display = 'none';
            summaryPage.style.display = 'block';
            
            summaryContent.innerHTML = `
                <article class="summary-article">
                    <h2 class="summary-title">${article.title}</h2>
                    <img src="${article.image || 'https://via.placeholder.com/800x400?text=No+Image'}" 
                         alt="${article.title}" 
                         class="summary-image"
                         onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
                    <div class="summary-text">
                        ${summary}
                        <p class="summary-note"><em>இது ஒரு உதாரணமான சுருக்கம். உங்கள் பைதான் பேக்எண்ட் இணைக்கப்படும் போது உண்மையான சுருக்கங்கள் கிடைக்கும்.</em></p>
                    </div>
                </article>
            `;
            
        } catch (error) {
            console.error('Error fetching summary:', error);
            showError('சுருக்கத்தை ஏற்றும் போது பிழை ஏற்பட்டது. பின்னர் முயற்சிக்கவும்.');
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    // Helper function to simulate summarization (replace with actual API call)
    function simulateSummary(text) {
        return new Promise((resolve) => {
            // Simple simulation - take first 3 sentences
            const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
            const summary = sentences.slice(0, 3).join(' ');
            resolve(summary || text.substring(0, 300) + '...');
        });
    }
});