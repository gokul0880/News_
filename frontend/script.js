document.addEventListener('DOMContentLoaded', function() {
    // API Keys
    const newsApiKey = 'eed69360b67984d8ed5bd4a82da82f5c';
    const openaiApiKey = 'API';
    
    // DOM Elements
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
    const textOptionsModal = document.getElementById('text-options-modal');
    const readFullBtn = document.getElementById('read-full');
    const readSummaryBtn = document.getElementById('read-summary');
    const summaryPage = document.getElementById('summary-page');
    const summaryContent = document.getElementById('summary-content');
    const backBtn = document.getElementById('back-btn');
    const animateBtn = document.getElementById('animate-btn');
    const animationModal = document.getElementById('animation-modal');
    const animationResult = document.getElementById('animation-result');
    const animationControls = document.getElementById('animation-controls');
    const restartAnimationBtn = document.getElementById('restart-animation');
    const downloadAnimationBtn = document.getElementById('download-animation');
    const closeAnimationModal = document.getElementById('close-animation-modal');
    
    // State variables
    let currentCategory = 'general';
    let currentSearchTerm = '';
    let useLocalData = false;
    let currentArticle = null;
    let currentAnimation = null;

    // Initialize
    fetchNews(currentCategory);
    
    // Event Listeners
    menuBtn.addEventListener('click', toggleSidebar);
    closeSidebar.addEventListener('click', toggleSidebar);
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });
    
    // Modal controls
    readTextBtn.addEventListener('click', () => {
        readModal.classList.remove('active');
        textOptionsModal.classList.add('active');
    });
    
    readVoiceBtn.addEventListener('click', () => {
        readModal.classList.remove('active');
        slangModal.classList.add('active');
    });
    
    animateBtn.addEventListener('click', () => {
        readModal.classList.remove('active');
        createAnimation();
    });
    
    readFullBtn.addEventListener('click', showFullArticle);
    readSummaryBtn.addEventListener('click', () => fetchSummary(currentArticle));
    backBtn.addEventListener('click', () => {
        summaryPage.style.display = 'none';
        mainContent.style.display = 'block';
    });
    
    restartAnimationBtn.addEventListener('click', createAnimation);
    downloadAnimationBtn.addEventListener('click', downloadAnimation);
    
    closeAnimationModal.addEventListener('click', () => {
        animationModal.classList.remove('active');
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // Category navigation
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            categoryLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            currentSearchTerm = '';
            searchInput.value = '';
            fetchNews(currentCategory);
        });
    });

    // Slang selection
    slangOptions.forEach(option => {
        option.addEventListener('click', function() {
            const slang = this.dataset.slang;
            readInSlang(slang);
            slangModal.classList.remove('active');
        });
    });

    // Core Functions
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('shifted');
    }

    function performSearch() {
        currentSearchTerm = searchInput.value.trim();
        if (currentSearchTerm) {
            fetchNews(currentCategory, currentSearchTerm);
        }
    }

    async function fetchNews(category, keyword = '') {
        newsContainer.innerHTML = '';
        loadingElement.classList.add('active');
        errorElement.style.display = 'none';
        
        try {
            let data;
            
            if (useLocalData) {
                // Fallback to local data if API fails
                const response = await fetch('tamil-news.json');
                data = await response.json();
                
                if (!keyword) {
                    data.articles = data.articles.filter(article => 
                        (article.source?.name?.toLowerCase().includes(category)) || 
                        category === 'general'
                    );
                }
                
                if (keyword) {
                    const searchTerm = keyword.toLowerCase();
                    data.articles = data.articles.filter(article => 
                        (article.title?.toLowerCase().includes(searchTerm)) || 
                        (article.description?.toLowerCase().includes(searchTerm))
                    );
                }
            } else {
                let url = keyword ? 
                    `https://gnews.io/api/v4/search?q=${encodeURIComponent(keyword)}&lang=ta&country=in&max=30&apikey=${newsApiKey}` :
                    `https://gnews.io/api/v4/top-headlines?category=${category}&lang=ta&country=in&max=30&apikey=${newsApiKey}`;
                
                const response = await fetch(url);
                
                if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
                data = await response.json();
            }
            
            if (data.articles?.length > 0) {
                displayNews(data.articles);
            } else if (!useLocalData) {
                // Try with local data if API returns no results
                useLocalData = true;
                fetchNews(category, keyword);
            } else {
                showError('செய்திகள் எதுவும் கிடைக்கவில்லை.');
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            if (!useLocalData) {
                useLocalData = true;
                fetchNews(category, keyword);
            } else {
                showError('செய்திகள் ஏற்றும் போது பிழை ஏற்பட்டது.');
            }
        } finally {
            loadingElement.classList.remove('active');
        }
    }

    function displayNews(articles) {
        newsContainer.innerHTML = '';
        
        if (!articles || articles.length === 0) {
            showError('செய்திகள் எதுவும் கிடைக்கவில்லை.');
            return;
        }
        
        articles.forEach(article => {
            if (!article.title) return;
            
            const newsCard = document.createElement('article');
            newsCard.className = 'news-card';
            
            const formattedDate = article.publishedAt ? 
                new Date(article.publishedAt).toLocaleDateString('ta-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'தேதி இல்லை';
            
            const newsCategory = article.source?.name || currentCategory;
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
        
        // Event delegation for read buttons
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
                readModal.classList.add('active');
            }
        });
    }

    // Animation Functions
    async function createAnimation() {
        if (!currentArticle) return;
        
        animationModal.classList.add('active');
        animationResult.innerHTML = `
            <div class="animation-placeholder">
                <i class="fas fa-spinner fa-spin animation-icon"></i>
                <p>செய்தியின் வேடிக்கையான விளக்கத்தை உருவாக்குகிறது...</p>
            </div>
        `;
        animationControls.style.display = 'none';
        
        try {
            // Simulate API call to generate animation (in a real app, you'd call an actual API)
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Create a mock animation result as GIF
            currentAnimation = {
                title: currentArticle.title,
                imageUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2R1Z2F4b3J6dWl3Y2J5dG1mY2Z0Z2hxZzJwY3F3M2F6Z2N6dGJ6eCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT5LMHxhOfscxPfIfm/giphy.gif', // Example GIF URL
                prompt: `A funny animated GIF interpretation of: ${currentArticle.title}`
            };
            
            // Display the result as an image
            animationResult.innerHTML = `
                <div class="animation-success">
                    <img src="${currentAnimation.imageUrl}" 
                         alt="${currentArticle.title} Animation" 
                         class="animation-gif">
                    <div class="animation-prompt">Prompt: ${currentAnimation.prompt}</div>
                </div>
            `;
            
            animationControls.style.display = 'flex';
        } catch (error) {
            console.error('Animation error:', error);
            animationResult.innerHTML = `
                <div class="animation-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>அனிமேஷன் உருவாக்கப்படும் போது பிழை ஏற்பட்டது: ${error.message}</p>
                    <button class="retry-btn" onclick="createAnimation()">மீண்டும் முயற்சிக்கவும்</button>
                </div>
            `;
        }
    }

    function downloadAnimation() {
        if (!currentAnimation) return;
        
        // Create a temporary link to download the GIF
        const link = document.createElement('a');
        link.href = currentAnimation.imageUrl;
        link.download = `animation-${Date.now()}.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Helper Functions
    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    function showError(message) {
        errorElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        `;
        errorElement.style.display = 'block';
    }

    function showFullArticle() {
        textOptionsModal.classList.remove('active');
        // In a real app, you might show this in a modal or new page
        summaryPage.style.display = 'block';
        mainContent.style.display = 'none';
        
        summaryContent.innerHTML = `
            <article class="summary-article">
                <h2>${currentArticle.title}</h2>
                <img src="${currentArticle.image || 'https://via.placeholder.com/800x400?text=No+Image'}" 
                     alt="${currentArticle.title}" 
                     class="summary-image"
                     onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
                <div class="summary-text">${currentArticle.content}</div>
            </article>
        `;
    }

    function readInSlang(slang) {
        alert(`Reading article in ${slang} accent...`);
        // In a real app, you would use text-to-speech API with accent parameters
    }

    async function fetchSummary(article) {
        loadingElement.classList.add('active');
        textOptionsModal.classList.remove('active');
        
        try {
            // Simulate API call to generate summary
            const summary = await generateSummary(article.content);
            
            mainContent.style.display = 'none';
            summaryPage.style.display = 'block';
            
            summaryContent.innerHTML = `
                <article class="summary-article">
                    <h2>${article.title}</h2>
                    <img src="${article.image || 'https://via.placeholder.com/800x400?text=No+Image'}" 
                         alt="${article.title}" 
                         class="summary-image"
                         onerror="this.src='https://via.placeholder.com/800x400?text=No+Image'">
                    <div class="summary-text">${summary}</div>
                </article>
            `;
        } catch (error) {
            console.error('Summary error:', error);
            showError('சுருக்கத்தை ஏற்றும் போது பிழை ஏற்பட்டது.');
        } finally {
            loadingElement.classList.remove('active');
        }
    }

    function generateSummary(text) {
        return new Promise((resolve) => {
            // Simulate API delay
            setTimeout(() => {
                const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
                const summary = sentences.slice(0, 3).join(' ') || text.substring(0, 300) + '...';
                resolve(summary);
            }, 1500);
        });
    }
});
