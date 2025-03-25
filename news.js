document.addEventListener('DOMContentLoaded', function() {
    const apiKey = '2b17cb0dc599989bc4be0d982ced4394';
    const newsContainer = document.getElementById('news-container');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const categoryLinks = document.querySelectorAll('.categories li a');
    
    let currentCategory = 'general';
    let currentSearchTerm = '';
    let useLocalData = false;
    
    // Initial load
    fetchNews(currentCategory);
    
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
                const response = await fetch('news.json');
                data = await response.json();
                
                // Filter by category if not searching
                if (!keyword) {
                    data.articles = data.articles.filter(article => 
                        article.source.name.toLowerCase().includes(category) || 
                        category === 'general'
                    );
                }
                
                // Filter by keyword if searching
                if (keyword) {
                    const searchTerm = keyword.toLowerCase();
                    data.articles = data.articles.filter(article => 
                        article.title.toLowerCase().includes(searchTerm) || 
                        article.description.toLowerCase().includes(searchTerm)
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
        
        articles.forEach(article => {
            const newsCard = document.createElement('article');
            newsCard.className = 'news-card';
            
            // Format published date
            const publishedDate = new Date(article.publishedAt);
            const formattedDate = publishedDate.toLocaleDateString('ta-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Get category from source name or use current category
            const newsCategory = article.source?.name || currentCategory;
            
            newsCard.innerHTML = `
                <img src="${article.image || 'https://via.placeholder.com/300x180?text=No+Image'}" alt="${article.title}" class="news-image" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
                <div class="news-content">
                    <span class="news-category">${newsCategory}</span>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description || 'விளக்கம் இல்லை'}</p>
                    <div class="news-footer">
                        <span>${formattedDate}</span>
                        <a href="${article.url}" target="_blank" rel="noopener noreferrer">மேலும் வாசிக்க <i class="fas fa-external-link-alt"></i></a>
                    </div>
                </div>
            `;
            
            newsContainer.appendChild(newsCard);
        });
    }
    
    function showError(message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
});