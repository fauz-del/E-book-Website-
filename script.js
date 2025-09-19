document.addEventListener("DOMContentLoaded", () => {
  
    // Toggle sidebar
    const menuToggle = document.getElementById("menutoggle");
    const navLinks = document.getElementById("navlinks");

    menuToggle.addEventListener("click", () => {
      menuToggle.classList.toggle("active");
    navLinks.classList.toggle("active");
    });

    // Show/Hide sections
    function showSection(id) {
      document.querySelectorAll(".content section")
        .forEach(sec => sec.classList.remove("active"));
      document.getElementById(id).classList.add("active");
      // close menu after click
      menuToggle.classList.remove("active");
      navLinks.classList.remove("active");
    }
  
  const API_URL = "https://www.googleapis.com/books/v1/volumes?q=";
  const PROXY = "https://api.allorigins.win/get?url="; // note 'get' not 'raw'

  // Containers
  const featuredContainer = document.getElementById("featured-books");
  const popularContainer = document.getElementById("popular-books");
  const genresContainer = document.getElementById("genre-books");
  const collectionContainer = document.getElementById("collection-books");
  const searchResults = document.getElementById("search-results");

  const loaderHTML = `<div class="loader"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:#8b5e3c;"></i></div>`;

  // Fetch books
  async function fetchBooks(query, container) {
    container.innerHTML = loaderHTML;
    try {
      const targetURL = `${API_URL}${encodeURIComponent(query)}&maxResults=12`;
      const res = await fetch(`${PROXY}${encodeURIComponent(targetURL)}`);
      if (!res.ok) throw new Error("Network error");

      const proxyData = await res.json();
      const data = JSON.parse(proxyData.contents); // Important: parse 'contents' from AllOrigins
      container.innerHTML = "";

      if (data.items) {
        data.items.forEach(book => container.appendChild(createBookCard(book)));
      } else {
        container.innerHTML = "<p>No books found.</p>";
      }
    } catch (err) {
      console.error("Fetch error:", err);
      container.innerHTML = "<p>⚠️ Failed to fetch books. Check your internet.</p>";
    }
  }

  // Create book card
  function createBookCard(book) {
    const title = book.volumeInfo.title || "No Title";
    const authors = book.volumeInfo.authors ? book.volumeInfo.authors.join(", ") : "Unknown Author";
    const year = book.volumeInfo.publishedDate ? book.volumeInfo.publishedDate.split("-")[0] : "Unknown Year";
    const thumbnail = book.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://") || "https://via.placeholder.com/150x220?text=No+Image";
    const rating = book.volumeInfo.averageRating ? "⭐".repeat(Math.round(book.volumeInfo.averageRating)) : "No Rating";
    const desc = book.volumeInfo.description || "No description available.";

    const collection = JSON.parse(localStorage.getItem("myCollection")) || [];
    const isLiked = collection.some(b => b.title === title);

    const card = document.createElement("div");
    card.classList.add("book-card");
    card.innerHTML = `
      <img src="${thumbnail}" alt="${title}">
      <h4>${title}</h4>
      <p>${authors}</p>
      <p>${year}</p>
      <p>${rating}</p>
      <i class="like-btn ${isLiked ? "fa-solid liked" : "fa-regular"} fa-heart"></i>
    `;

    const likeBtn = card.querySelector(".like-btn");
    likeBtn.addEventListener("click", e => {
      e.stopPropagation();
      if (likeBtn.classList.contains("liked")) {
        removeFromCollection(title);
        likeBtn.classList.remove("liked","fa-solid");
        likeBtn.classList.add("fa-regular");
      } else {
        saveToCollection({ title, authors, year, thumbnail, rating, desc });
        likeBtn.classList.add("liked","fa-solid");
        likeBtn.classList.remove("fa-regular");
      }
    });

    card.addEventListener("click", e => {
      if (!e.target.classList.contains("like-btn")) {
        openModal({ title, authors, year, thumbnail, rating, desc });
      }
    });

    return card;
  }

  // Collection
  function saveToCollection(book) {
    let collection = JSON.parse(localStorage.getItem("myCollection")) || [];
    if (!collection.some(b => b.title === book.title)) {
      collection.push(book);
      localStorage.setItem("myCollection", JSON.stringify(collection));
      loadCollection();
    }
  }

  function removeFromCollection(title) {
    let collection = JSON.parse(localStorage.getItem("myCollection")) || [];
    collection = collection.filter(b => b.title !== title);
    localStorage.setItem("myCollection", JSON.stringify(collection));
    loadCollection();
  }

  function loadCollection() {
    collectionContainer.innerHTML = "";
    const collection = JSON.parse(localStorage.getItem("myCollection")) || [];
    if (collection.length === 0) {
      collectionContainer.innerHTML = "<p>No books in collection.</p>";
    } else {
      collection.forEach(book => {
        const card = document.createElement("div");
        card.classList.add("book-card");
        card.innerHTML = `
          <img src="${book.thumbnail}" alt="${book.title}">
          <h4>${book.title}</h4>
          <p>${book.authors}</p>
          <p>${book.year}</p>
          <p>${book.rating}</p>
          <i class="fa-solid fa-heart like-btn liked"></i>
        `;
        card.querySelector(".like-btn").addEventListener("click", () => removeFromCollection(book.title));
        collectionContainer.appendChild(card);
      });
    }
  }

  // Modal
  const modal = document.getElementById("bookModal");
  const closeBtn = document.querySelector(".close-btn");
  function openModal(book) {
    document.getElementById("modal-title").innerText = book.title;
    document.getElementById("modal-authors").innerText = book.authors;
    document.getElementById("modal-year").innerText = book.year;
    document.getElementById("modal-rating").innerText = book.rating;
    document.getElementById("modal-description").innerText = book.desc;
    document.getElementById("modal-thumbnail").src = book.thumbnail;
    modal.style.display = "flex";
  }
  closeBtn.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", e => { if (e.target == modal) modal.style.display = "none"; });

  // Search
  document.getElementById("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    const query = document.getElementById("searchInput").value.trim();
    if (query) fetchBooks(query, searchResults);
  });

  // Initial load
  fetchBooks("harry potter", featuredContainer);
  fetchBooks("psychology", popularContainer);
  fetchBooks("mystery", genresContainer);
  loadCollection();

});