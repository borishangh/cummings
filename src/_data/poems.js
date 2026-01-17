// src/_data/poems.js
// Flatten all book.poems into a single array for Eleventy pagination of poem pages.

module.exports = async function() {
  const getBooks = require("./books.js");
  const books = await getBooks();

  const poems = [];
  (books || []).forEach(book => {
    (book.poems || []).forEach(p => {
      if (!p || !p.slug) return; // skip if no slug
      poems.push({
        title: p.title,
        slug: p.slug,
        bookSlug: book.slug,
        bookTitle: book.title,
        html_url: p.html_url || null,
        json_url: p.json_url || null,
        text: p.text || null
      });
    });
  });

  return poems;
};
