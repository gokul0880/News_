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
                        <p>${article.description || 'No description available.'}</p>
                        <span>Published on: ${new Date(article.publishedAt).toDateString()}</span>
                    </div>
                `;
                newsContainer.appendChild(newsItem);

                // Add click event to open modal
                newsItem.addEventListener("click", () => {
                    openModal(article);
                });
            });
        })
        .catch(error => console.error("Error fetching news:", error));
}

// Function to open modal
function openModal(article) {
    const modal = document.getElementById("news-modal");
    const textOption = document.getElementById("text-option");
    const voiceOption = document.getElementById("voice-option");

    modal.style.display = "flex";

    // Text option
    textOption.onclick = () => {
        alert(`Title: ${article.title}\nDescription: ${article.description}`);
        modal.style.display = "none";
    };

    // Voice option
    voiceOption.onclick = () => {
        const utterance = new SpeechSynthesisUtterance(`${article.title}. ${article.description}`);
        speechSynthesis.speak(utterance);
        modal.style.display = "none";
    };

    // Close modal
    document.querySelector(".close").onclick = () => {
        modal.style.display = "none";
    };
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