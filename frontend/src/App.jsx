import { useState, useEffect, useCallback, useRef } from 'react';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hasNext, setHasNext] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [loading, setLoading] = useState(false);
  const [perfTime, setPerfTime] = useState(0);


  // Cursor history: index 0 = null (page 1), index 1 = cursor for page 2, etc.
  // Stored in a ref because it never needs to trigger a re-render on its own.
  const cursorHistoryRef = useRef([null]);

  // The nextCursor from the last API response — used to advance forward.
  const nextCursorRef = useRef(null);

  const hasPrev = pageNum > 1;


  // Fetch a single page using an explicit cursor and category.
  // Never appends — always replaces the current page's products.
  const fetchPage = useCallback(
    async (cursor, category) => {
      setLoading(true);
      const startTime = performance.now();

      try {
        const url = new URL(window.location.origin + '/api/products');
        url.searchParams.set('limit', '20');
        if (category) url.searchParams.set('category', category);
        if (cursor) url.searchParams.set('cursor', cursor);

        const res = await fetch(url);
        const result = await res.json();
        const endTime = performance.now();

        setPerfTime(Math.round(endTime - startTime));
        setProducts(result.data);
        nextCursorRef.current = result.pagination.nextCursor;
        setHasNext(result.pagination.hasNext);

        // Scroll to top of product grid on every page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Error fetching products', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch categories on mount only.
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/products/categories');
        const { data } = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    fetchCategories();
  }, []);

  // Load page 1 on mount.
  const hasFetchedInitial = useRef(false);
  useEffect(() => {
    if (hasFetchedInitial.current) return;
    hasFetchedInitial.current = true;
    fetchPage(null, '');
  }, [fetchPage]);

  // --- Pagination handlers ---

  const handleNext = () => {
    if (!hasNext || loading) return;
    const nextPage = pageNum + 1;
    // Only store the cursor the first time we advance to this page.
    // This lets us navigate back and then forward again correctly.
    if (cursorHistoryRef.current.length < nextPage) {
      cursorHistoryRef.current.push(nextCursorRef.current);
    }
    setPageNum(nextPage);
    fetchPage(cursorHistoryRef.current[nextPage - 1], selectedCategory);
  };

  const handlePrev = () => {
    if (pageNum <= 1 || loading) return;
    const prevPage = pageNum - 1;
    setPageNum(prevPage);
    fetchPage(cursorHistoryRef.current[prevPage - 1], selectedCategory);
  };

  // Reset to page 1 whenever the category filter changes.
  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setSelectedCategory(cat);
    // Reset the cursor history for the new category.
    cursorHistoryRef.current = [null];
    nextCursorRef.current = null;
    setPageNum(1);
    fetchPage(null, cat);
  };

  return (
    <div className="container">
      <header>
        <div className="logo-container">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">AeroBrowse</div>
        </div>
        <div className="db-stats">
          <span className="pulse-dot"></span>
          <span>Connected to Cluster (200,000 Products)</span>
        </div>
      </header>

      <main>
        <div className="controls-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="category-select">Category</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="performance-badge">
              <span>Query Time:</span>
              <span className="perf-time">{perfTime}ms</span>
            </div>
          </div>
        </div>

        <div className="products-grid" id="products-grid">
          {loading ? (
            Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line skeleton-category"></div>
                <div className="skeleton-line skeleton-title"></div>
                <div className="product-footer">
                  <div className="skeleton-line skeleton-price"></div>
                  <div className="skeleton-line skeleton-date"></div>
                </div>
              </div>
            ))
          ) : products.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                color: 'var(--text-secondary)',
              }}
            >
              No products found.
            </div>
          ) : (
            products.map((prod) => {
              const dateObj = new Date(prod.created_at);
              const formattedDate =
                dateObj.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }) +
                ' ' +
                dateObj.toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

              return (
                <div key={prod._id} className="product-card">
                  <div>
                    <div className="product-category">{prod.category}</div>
                    <h3 className="product-name">{prod.name}</h3>
                  </div>
                  <div className="product-footer">
                    <span className="product-price">${prod.price.toFixed(2)}</span>
                    <span className="product-date">{formattedDate}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Page-based pagination controls */}
        <div className="pagination-actions">
          <div className="page-controls">
            <button
              className="btn-page"
              id="btn-prev"
              onClick={handlePrev}
              disabled={!hasPrev || loading}
            >
              ← Previous
            </button>

            <span className="page-indicator">Page {pageNum}</span>

            <button
              className="btn-page btn-page--next"
              id="btn-next"
              onClick={handleNext}
              disabled={!hasNext || loading}
            >
              Next →
            </button>
          </div>

          <div
            style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}
            id="items-count"
          >
            {loading ? 'Loading…' : `Showing ${products.length} products on page ${pageNum}`}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
