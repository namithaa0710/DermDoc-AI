import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./User.css";
import logo from "./assets/logo_cut.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faArrowLeft, faSearch, faCamera, faUpload, faCheckCircle, faTimesCircle, faExclamationCircle, faFilter, faAngleDown } from "@fortawesome/free-solid-svg-icons";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Function to handle custom dialogs
const showCustomDialog = (message) => {
  const dialogElement = document.getElementById('custom-dialog-message');
  if (dialogElement) {
    dialogElement.textContent = message;
    const dialogContainer = document.getElementById('custom-dialog-container');
    if (dialogContainer) {
      dialogContainer.style.display = 'flex';
    }
  }
};

const hideCustomDialog = () => {
  const dialogContainer = document.getElementById('custom-dialog-container');
  if (dialogContainer) {
      dialogContainer.style.display = 'none';
  }
};

const SKIN_TYPE_OPTIONS = ["oily", "normal", "dry", "combination", "acne-prone", "sensitive"];

function User() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentDashboardView, setCurrentDashboardView] = useState("dashboard");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchDropdownVisible, setIsSearchDropdownVisible] = useState(false);
  const searchTimeoutRef = useRef(null);

  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState([]);
  const [skinTypeDropdownOpen, setSkinTypeDropdownOpen] = useState(false);

  // "Check Products" page states
  const [prodType, setProdType] = useState("");
  const [skinType, setSkinType] = useState("");
  const [ingredientImage, setIngredientImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const fetchProducts = async (filters = {}) => {
    setProductsLoading(true);
    let url;
    
    if (filters.searchTerm) {
      const params = new URLSearchParams({ search: filters.searchTerm });
      url = `http://localhost:5004/api/search/filter-products?${params.toString()}`;
    } else if (filters.skinTypes && filters.skinTypes.length > 0) {
      const params = new URLSearchParams();
      params.append('skin_types', filters.skinTypes.join(','));
      url = `http://localhost:5010/api/products/filter?${params.toString()}`;
    } else {
      url = "http://localhost:5008/api/products";
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProducts(data);
    } catch (error) {
        console.error("Error fetching products:", error);
        showCustomDialog("Failed to load products.");
        setProducts([]);
    } finally {
        setProductsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim() !== '') {
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const response = await fetch(`http://localhost:5004/api/search/suggestions?q=${searchQuery}`);
                if (!response.ok) throw new Error('Failed to fetch suggestions');
                const data = await response.json();
                setSearchResults(data);
                setIsSearchDropdownVisible(true);
            } catch (error) {
                console.error("Error fetching search suggestions:", error);
                setSearchResults([]);
            }
        }, 300);
    } else {
        setSearchResults([]);
        setIsSearchDropdownVisible(false);
    }

    return () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    };
  }, [searchQuery]);


  const fetchProductDetails = async (productId) => {
    setIsAnalysisLoading(true);
    setSelectedProductDetails(null);
    setCurrentImageIndex(0);
    
    try {
      const response = await fetch(`http://localhost:5011/api/product/details/${productId}`); 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSelectedProductDetails(data);
      setCurrentDashboardView("product-detail");
    } catch (error) {
      console.error("Error fetching product details:", error);
      showCustomDialog(`Failed to load product details: ${error.message}`);
      setCurrentDashboardView("dashboard"); 
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const changeDashboardView = (view) => {
    setCurrentDashboardView(view);
    setMobileMenuOpen(false);
    setFilterSidebarOpen(false); 
    if (view !== "analysis" && view !== "product-detail") {
        setAnalysisResult(null);
        setSelectedProductDetails(null);
        setIsAnalysisLoading(false);
        setShowExplanation(false);
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        fetchProducts({ searchTerm: searchQuery });
        setIsSearchDropdownVisible(false);
    }
  };

  const handleSuggestionClick = (product) => {
    setSearchQuery(product.product_name);
    setIsSearchDropdownVisible(false);
    fetchProducts({ searchTerm: product.product_name });
  };
  
  const handleFilterChange = (type, value) => {
    setSelectedSkinTypes(prev => 
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };
  
  const handleApplyFilters = () => {
    fetchProducts({ skinTypes: selectedSkinTypes });
    setFilterSidebarOpen(false);
  };
  
  const handleClearFilters = () => {
    setSelectedSkinTypes([]);
    fetchProducts();
  };

  const handleIngredientImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setIngredientImage(event.target.files[0]);
      setExtractedText("");
    }
  };

  const performOcr = async () => {
    if (!ingredientImage) {
      showCustomDialog("Please select an image first!");
      return;
    }
    setIsOcrProcessing(true);
    const formData = new FormData();
    formData.append("image", ingredientImage);
    try {
      const response = await fetch("http://localhost:5001/api/ocr", { method: "POST", body: formData });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setExtractedText(data.text);
    } catch (error) {
      console.error("Error during OCR:", error);
      showCustomDialog("Failed to extract ingredients.");
    } finally {
      setIsOcrProcessing(false);
    }
  };
  
  const handleProductCheck = async (event) => {
    event.preventDefault();
    if (!prodType.trim() || !skinType.trim() || !extractedText.trim()) {
        showCustomDialog("Please fill in Product Type, Your Skin Type, and provide ingredients before checking.");
        return;
    }

    setIsAnalysisLoading(true);
    setAnalysisResult(null);
    setShowExplanation(false);
    setCurrentDashboardView("analysis");

    try {
        const response = await fetch("http://localhost:5012/api/check-product", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prod_type: prodType,
                skin_type: skinType,
                ingredients: extractedText,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to analyze product.");
        }

        const result = await response.json();
        setAnalysisResult(result);
    } catch (error) {
        console.error("Error during product analysis:", error);
        showCustomDialog(`Analysis failed: ${error.message}`);
        setCurrentDashboardView("products");
    } finally {
        setIsAnalysisLoading(false);
    }
  };

  // <<<< NEW RENDER ANALYSIS FUNCTION >>>>
  const renderAnalysisResult = () => {
    if (isAnalysisLoading) {
      return (
        <div className="user-analysis-container user-loading-state">
          <div className="user-loader"></div>
          <h2>Analyzing Ingredients...</h2>
          <p>This may take a moment. Please wait.</p>
        </div>
      );
    }

    if (!analysisResult) {
       return (
        <div className="user-dashboard-content" style={{ textAlign: 'center', marginTop: '100px' }}>
          <h2>Analysis Not Available</h2>
          <p>The analysis could not be completed. Please go back and try again.</p>
          <button className="user-pink-button" onClick={() => changeDashboardView("products")}>
            Back to Product Check
          </button>
        </div>
      );
    }

    const { overall_verdict, summary, highly_contributing, moderate_ingredients, least_contributing, overall_explanation } = analysisResult;
    
    const verdictColors = { Good: "#4CAF50", Moderate: "#FFC107", Bad: "#F44336", Harmful: "#F44336" };

    const getVerdictIcon = (verdict) => {
      switch (verdict) {
        case "Good": return faCheckCircle;
        case "Moderate": return faExclamationCircle;
        case "Bad": case "Harmful": return faTimesCircle;
        default: return faExclamationCircle;
      }
    };

    const getIngredientColor = (verdict) => {
      switch (verdict?.toLowerCase()) {
        case "good": return "user-green-pill";
        case "moderate": return "user-yellow-pill";
        case "bad": case "harmful": return "user-red-pill";
        default: return "user-gray-pill";
      }
    };

    const pieData = [
      { name: "Good", value: summary.good },
      { name: "Moderate", value: summary.moderate },
      { name: "Bad", value: summary.bad },
      { name: "Unknown", value: summary.unknown || 0 },
    ].filter((data) => data.value > 0);

    const COLORS = ["#4CAF50", "#FFC107", "#F44336", "#9E9E9E"];

    const allIngredients = [
      ...(highly_contributing || []),
      ...(moderate_ingredients || []),
      ...(least_contributing || [])
    ];

    const highlightExplanation = (text) => {
        if (!text) return null;
        const parts = text.split(/(Good|positive|beneficial|Moderate|Bad|danger|not safe|Harmful|Accepted|Rejected)/gi);
        return parts.map((part, index) => {
          const lowerPart = part.toLowerCase();
          if (["good", "positive", "beneficial", "accepted"].includes(lowerPart)) {
            return <span key={index} style={{ color: "var(--primary-pink-dark)", fontWeight: "bold" }}>{part}</span>;
          }
          if (["moderate"].includes(lowerPart)) {
            return <span key={index} style={{ color: '#FFC107', fontWeight: "bold" }}>{part}</span>;
          }
          if (["bad", "danger", "not safe", "harmful", "rejected"].includes(lowerPart)) {
            return <span key={index} style={{ color: '#F44336', fontWeight: "bold" }}>{part}</span>;
          }
          return part;
        });
    };

    return (
      <div className="user-analysis-container">
        <button className="user-back-button user-pink-button" onClick={() => changeDashboardView("products")}>
          <FontAwesomeIcon icon={faArrowLeft} /> Check Another Product
        </button>

        <div className="user-analysis-card">
          <h2>Analysis Status & Verdict</h2>
          <div className="user-verdict-display" style={{ backgroundColor: verdictColors[overall_verdict] || "#9E9E9E" }}>
            <span className="verdict-text">
              <FontAwesomeIcon icon={getVerdictIcon(overall_verdict)} />
              Verdict: {overall_verdict}
            </span>
          </div>
        </div>

        <div className="user-analysis-card">
          <h2>Ingredient Classification Breakdown</h2>
          <div className="user-pie-chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="user-analysis-card">
          <h2>Recognized Ingredients</h2>
          <div className="user-ingredients-grid">
            {allIngredients.map((ing, index) => (
              <span key={`ing-${index}`} className={`user-ingredient-pill ${getIngredientColor(ing.verdict)}`}>
                {ing.ingredient_name}
              </span>
            ))}
          </div>
        </div>

        <button className="user-overall-verdict-btn user-pink-button" onClick={() => setShowExplanation(!showExplanation)}>
          {showExplanation ? "Hide Detailed Explanation" : "View Detailed Explanation"}
        </button>

        {showExplanation && (
          <div className="user-analysis-card user-explanation-card">
            <h2>Detailed Explanation</h2>
            <p className="user-explanation-text">{highlightExplanation(overall_explanation)}</p>
          </div>
        )}
      </div>
    );
  };

  const renderProductDetailView = () => {
    if (isAnalysisLoading) {
        return (
            <div className="user-analysis-container user-loading-state">
                <div className="user-loader"></div>
                <h2>Loading Product Details...</h2>
                <p>Please wait a moment.</p>
            </div>
        );
    }
    
    if (!selectedProductDetails) {
        return (
            <div className="user-dashboard-content" style={{ textAlign: 'center', marginTop: '100px' }}>
                <h2>Error</h2>
                <p>Product details could not be loaded. Please go back and try again.</p>
                <button className="user-pink-button" onClick={() => changeDashboardView("dashboard")}>
                    Back to Products
                </button>
            </div>
        );
    }
    
    const { product_name, description, price, skin_type, seller_email, images, analysis } = selectedProductDetails;
    const { overall_verdict, summary, highly_contributing, moderate_ingredients, least_contributing, overall_explanation } = analysis;

    const allIngredients = [...(highly_contributing || []), ...(moderate_ingredients || []), ...(least_contributing || [])];
    
    const pieData = [
      { name: "Good", value: summary?.good || 0 },
      { name: "Moderate", value: summary?.moderate || 0 },
      { name: "Bad", value: summary?.bad || 0 },
      { name: "Unknown", value: summary?.unknown || 0 },
    ].filter((data) => data.value > 0);

    const COLORS = ["#4CAF50", "#FFC107", "#F44336", "#9E9E9E"];
    
    const getIngredientColor = (verdict) => {
      switch (verdict?.toLowerCase()) {
        case "good": return "user-green-pill";
        case "moderate": return "user-yellow-pill";
        case "bad":
        case "harmful": return "user-red-pill";
        default: return "user-gray-pill";
      }
    };
    
    const highlightExplanation = (text) => {
      if (!text) return null;
      const parts = text.split(/(Good|positive|beneficial|Moderate|Bad|danger|not safe|Harmful|Accepted|Rejected)/gi);
      return parts.map((part, index) => {
        const lowerPart = part.toLowerCase();
        if (["good", "positive", "beneficial", "accepted"].includes(lowerPart)) {
          return <span key={index} style={{ color: '#4CAF50', fontWeight: "bold" }}>{part}</span>;
        }
        if (["moderate"].includes(lowerPart)) {
          return <span key={index} style={{ color: '#FFC107', fontWeight: "bold" }}>{part}</span>;
        }
        if (["bad", "danger", "not safe", "harmful", "rejected"].includes(lowerPart)) {
          return <span key={index} style={{ color: '#F44336', fontWeight: "bold" }}>{part}</span>;
        }
        return part;
      });
    };

    return (
        <div className="product-detail-page">
            <button className="user-back-button user-pink-button" onClick={() => changeDashboardView("dashboard")}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back to Products
            </button>
            <div className="product-detail-header">
                <div className="image-gallery">
                    <div className="main-image-view">
                        {images && images.length > 0 && (
                            <img src={`data:image/jpeg;base64,${images[currentImageIndex]}`} alt={product_name} />
                        )}
                    </div>
                    <div className="thumbnail-list">
                        {images && images.map((img, index) => (
                            <div 
                                key={index} 
                                className={`thumbnail-item ${index === currentImageIndex ? 'active' : ''}`}
                                onClick={() => setCurrentImageIndex(index)}
                            >
                                <img src={`data:image/jpeg;base64,${img}`} alt={`Product thumbnail ${index + 1}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="product-info-details">
                    <h1>{product_name ? product_name.toUpperCase() : 'Product Name'}</h1>
                    <p className="product-description">{description}</p>
                    <p className="product-price-detail">₹{price}</p>
                    <p className="product-skin-type-detail">
                        <strong>Suitable for:</strong> {skin_type}
                    </p>
                    <p className="product-contact-detail">
                        <strong>Contact for queries:</strong> {seller_email || 'Not available'}
                    </p>
                </div>
            </div>
            <div className="product-detail-analysis-section">
                <h2>PRODUCT ANALYSIS</h2>
                <div className="analysis-content-grid">
                    <div className="analysis-pie-chart">
                         <h3>Ingredient Breakdown</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="analysis-text-content">
                        <div className="analysis-ingredients">
                            <h3>Recognized Ingredients ({overall_verdict})</h3>
                            <div className="user-ingredients-grid">
                                {allIngredients.length > 0 ? allIngredients.map((ing, index) => (
                                    <span key={`ing-${index}`} className={`user-ingredient-pill ${getIngredientColor(ing.verdict)}`}>
                                        {ing.ingredient_name}
                                    </span>
                                )) : <p>No specific ingredients were classified.</p>}
                            </div>
                        </div>
                        <div className="analysis-explanation">
                            <h3>AI Explanation</h3>
                            <p>{highlightExplanation(overall_explanation)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  };
  
  const renderProductsGrid = () => {
    return (
        <div className="user-dashboard-content">
            <h2 className="product-grid-title">Explore Our Curated Products</h2>
            <p className="product-grid-subtitle">Discover products verified for your skin's safety and needs.</p>
            <div className="product-grid">
                {productsLoading ? (
                    <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>Loading products...</p>
                ) : products.length > 0 ? (
                    products.map((product) => (
                        <div 
                            key={product.product_id} 
                            className="product-card"
                            onClick={() => fetchProductDetails(product.product_id)}
                        >
                            <div className="product-image-container">
                                {product.image && (
                                    <img 
                                        src={`data:image/jpeg;base64,${product.image}`}
                                        alt={product.product_name} 
                                        className="product-image"
                                    />
                                )}
                            </div>
                            <div className="product-info">
                                <h3 className="product-name">{product.product_name}</h3>
                                <p className="product-price">₹{product.price}</p>
                                <p className="product-skin-type">For: {product.skin_type}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>No products match the selected filters.</p>
                )}
            </div>
        </div>
    );
  };
  
  const FilterSidebar = () => (
    <div className={`filter-sidebar ${filterSidebarOpen ? 'open' : ''}`}>
        <div className="filter-header">
          <h2>Apply Filters</h2>
          <button className="filter-close-btn" onClick={() => setFilterSidebarOpen(false)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="filter-actions-top">
          <button className="filter-apply-btn" onClick={handleApplyFilters}>Apply</button>
          <button className="filter-clear-btn" onClick={handleClearFilters}>Clear</button>
        </div>
        <div className="filter-content">
          <div className="filter-accordion-group">
            <button className="filter-accordion-header" onClick={() => setSkinTypeDropdownOpen(!skinTypeDropdownOpen)}>
              Skin type 
              <FontAwesomeIcon icon={faAngleDown} className={skinTypeDropdownOpen ? 'rotated' : ''} />
            </button>
            {skinTypeDropdownOpen && (
              <div className="filter-checkbox-list">
                {SKIN_TYPE_OPTIONS.map(type => (
                  <label key={type} className="filter-checkbox-item">
                    <input type="checkbox" value={type} checked={selectedSkinTypes.includes(type)} onChange={() => handleFilterChange('skin', type)} />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
    </div>
  );

  const renderDashboardContent = () => {
    switch (currentDashboardView) {
        case "dashboard":
            return renderProductsGrid();
        case "products":
            return (
                <div className="user-upload-section">
                    <h2>Check Product Ingredients</h2>
                    <p>Upload a photo of your product's ingredient list to get an instant analysis.</p>

                    <form className="user-upload-form" onSubmit={handleProductCheck}>
                        <div className="user-form-group">
                            <label htmlFor="prodType">Product Type:</label>
                            <input
                                type="text"
                                id="prodType"
                                placeholder="e.g., Moisturizer, Serum, Cleanser"
                                value={prodType}
                                onChange={(e) => setProdType(e.target.value)}
                                required
                            />
                        </div>
                        <div className="user-form-group">
                            <label htmlFor="skinType">Your Skin Type:</label>
                            <select id="skinType" value={skinType} onChange={(e) => setSkinType(e.target.value)} required>
                                <option value="">-- Select Your Skin Type --</option>
                                {SKIN_TYPE_OPTIONS.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
                            </select>
                        </div>
                        <hr className="user-form-separator" />
                        <h3>Ingredient List Extraction</h3>
                        <p className="user-sub-description">
                            Snap a photo of the ingredients list or upload from your gallery. Our system will extract the text for you.
                        </p>
                        <div className="user-ingredient-ocr-section">
                            <div className="user-image-upload-zone">
                                {ingredientImage ? (
                                    <img
                                        src={URL.createObjectURL(ingredientImage)}
                                        alt="Ingredient Preview"
                                        className="user-ingredient-main-preview"
                                    />
                                ) : (
                                    <div className="user-image-placeholder">
                                        <FontAwesomeIcon icon={faUpload} size="2x" />
                                        <p>Tap to upload or take a photo</p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="ingredientImage"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleIngredientImageChange}
                                    className="user-full-overlay-input"
                                />
                            </div>
                            <div className="user-ocr-controls-and-text">
                                <div className="user-ocr-buttons-container">
                                    <button type="button" onClick={performOcr} disabled={!ingredientImage || isOcrProcessing} className="user-action-button">
                                        {isOcrProcessing ? `Processing...` : <>
                                            <FontAwesomeIcon icon={faCamera} /> Extract from Image
                                        </>}
                                    </button>
                                    <button type="button" onClick={() => { setIngredientImage(null); setExtractedText(""); }} className="user-action-button user-secondary-button">
                                        Clear
                                    </button>
                                </div>
                                <div className="user-extracted-text-container">
                                    <label htmlFor="extractedIngredients">Ingredients (Editable):</label>
                                    <textarea
                                        id="extractedIngredients"
                                        value={extractedText}
                                        onChange={(e) => setExtractedText(e.target.value)}
                                        rows="8"
                                        placeholder="Extracted text will appear here, or you can type ingredients manually."
                                        className="user-editable-textarea"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="user-submit-product-btn" disabled={isAnalysisLoading}>
                            {isAnalysisLoading ? 'Analyzing...' : 'Check My Product'}
                        </button>
                    </form>
                </div>
            );
        case "analysis":
            return renderAnalysisResult();
        case "product-detail":
            return renderProductDetailView();
        default:
            return <h2 style={{ textAlign: 'center', marginTop: '100px' }}>Dashboard Content</h2>;
    }
  };

  return (
    <>
    <div className="user-dashboard-container">
      <div className="user-taskbar">
         <button className="user-mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
           <FontAwesomeIcon icon={faBars} />
         </button>
         <img src={logo} alt="Logo" className="user-taskbar-logo" />
         <form onSubmit={handleSearchSubmit} className="user-search-container">
           <span className="user-search-icon"><FontAwesomeIcon icon={faSearch} /></span>
           <input 
                type="text" 
                placeholder="Search products" 
                className="user-search-input" 
                value={searchQuery} 
                onChange={handleSearchInputChange}
                onBlur={() => setTimeout(() => setIsSearchDropdownVisible(false), 200)}
                onFocus={() => { if (searchResults.length > 0) setIsSearchDropdownVisible(true) }}
            />
             {isSearchDropdownVisible && searchResults.length > 0 && (
                <div className="user-search-dropdown">
                    {searchResults.map(product => (
                        <div 
                            key={product.product_id} 
                            className="user-search-dropdown-item"
                            onMouseDown={() => handleSuggestionClick(product)}
                        >
                            {product.product_name}
                        </div>
                    ))}
                </div>
             )}
         </form>
         <div className="user-nav-and-icon-container">
           <div className="user-nav-icons">
             <span className={currentDashboardView === "dashboard" || currentDashboardView === "product-detail" ? "user-nav-active" : ""} onClick={() => changeDashboardView("dashboard")}>Dashboard</span>
             <span className={currentDashboardView === "products" || currentDashboardView === "analysis" ? "user-nav-active" : ""} onClick={() => changeDashboardView("products")}>Check Products</span>
           </div>
           <div className="user-account-container">
             <button className={`user-account-btn ${filterSidebarOpen ? 'active' : ''}`} onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}>
               <FontAwesomeIcon icon={faFilter} />
             </button>
           </div>
         </div>
       </div>
      
       <FilterSidebar />
      
       <div className="user-main-content-area">
         {renderDashboardContent()}
       </div>
     </div>
     <div id="custom-dialog-container">
       <div id="custom-dialog-box">
         <p id="custom-dialog-message"></p>
         <button id="custom-dialog-ok" onClick={hideCustomDialog}>OK</button>
       </div>
     </div>
     </>
  );
}

export default User;