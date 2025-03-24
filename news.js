const apiKey = '98a66743a75348deb1774c012a17d501';  // Replace with your key

// Function to fetch news by category
function fetchNews(category = 'general') {
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let newsContainer = document.getElementById("news-container");
            let newsHeading = document.querySelector("#news h2");
            
            // Update the heading based on the category
            newsHeading.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} News`;

            newsContainer.innerHTML = ''; // Clear previous news
            data.articles.forEach(article => {
                let newsItem = document.createElement("div");
                newsItem.classList.add("news-card");
                newsItem.innerHTML = `
                    <img src="${article.urlToImage || 'https://via.placeholder.com/400x200'}" alt="News Image">
                    <div class="news-card-content">
                        <h3>${article.title}</h3>
                        <p>${article.description || 'No description available.'} <a href="${article.url}" target="_blank">Read more</a></p>
                        <span>Published on: ${new Date(article.publishedAt).toDateString()}</span>
                    </div>
                `;
                newsContainer.appendChild(newsItem);
            });
        })
        .catch(error => console.error("Error fetching news:", error));
}

// Load trending news (general) on page load
document.addEventListener("DOMContentLoaded", () => {
    fetchNews('general');
});

// Add event listeners to navbar links
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const category = e.target.getAttribute("data-category");
        fetchNews(category);
    });
});