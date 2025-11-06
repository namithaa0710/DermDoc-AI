
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SellerDashboard.css";
import logo from "./assets/logo_cut.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faUser, faCamera, faUpload, faArrowLeft, faSave, faEdit, faTrash, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { faCheckCircle, faTimesCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// HELPER COMPONENT for a single draggable image
function SortableImage({ image, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.name + index });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="seller-product-thumbnail-container">
      <img src={URL.createObjectURL(image)} alt={`Product ${index + 1}`} className="seller-product-thumbnail" />
      <button type="button" className="seller-remove-image-btn" onClick={(e) => { e.stopPropagation(); onRemove(index); }}>
        &times;
      </button>
    </div>
  );
}

function SellerDashboard() {
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sellerInfo, setSellerInfo] = useState({ seller_id: null, name: "", email: "" });
  const [currentDashboardView, setCurrentDashboardView] = useState("overview");
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productType, setProductType] = useState("");
  const [brandName, setBrandName] = useState("");
  const [skinType, setSkinType] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [ingredientImage, setIngredientImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [acceptedProducts, setAcceptedProducts] = useState([]);
  const [rejectedProducts, setRejectedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [sellerDetails, setSellerDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});
  const [productCounts, setProductCounts] = useState({ total_products: 0, accepted_products: 0, rejected_products: 0 });

  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setProductImages((items) => {
        const oldIndex = items.findIndex((item, index) => item.name + index === active.id);
        const newIndex = items.findIndex((item, index) => item.name + index === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => { window.history.pushState(null, '', window.location.href); };
    window.addEventListener('popstate', handlePopState);
    return () => { window.removeEventListener('popstate', handlePopState); };
  }, []);

  useEffect(() => {
    const storedSellerId = localStorage.getItem("sellerId");
    const storedSellerName = localStorage.getItem("sellerName");
    const storedSellerEmail = localStorage.getItem("sellerEmail");

    if (storedSellerId) {
      setSellerInfo({ seller_id: parseInt(storedSellerId, 10), name: storedSellerName || "", email: storedSellerEmail || "" });
      if (currentDashboardView === "accepted") fetchAcceptedProducts(storedSellerId);
      else if (currentDashboardView === "rejected") fetchRejectedProducts(storedSellerId);
      else if (currentDashboardView === "overview") fetchProductCounts(storedSellerId);
    } else {
      navigate("/seller-login");
    }
  }, [currentDashboardView, navigate]);

  const fetchProductCounts = async (sellerId) => {
    try {
      const response = await fetch(`http://localhost:5009/api/seller/${sellerId}/product-counts`);
      if (!response.ok) throw new Error("Failed to fetch product counts.");
      const data = await response.json();
      setProductCounts(data);
    } catch (error) { console.error("Error fetching product counts:", error); }
  };

  const fetchAcceptedProducts = async (sellerId) => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`http://localhost:5002/api/seller/${sellerId}/accepted-products`);
      if (!response.ok) throw new Error("Failed to fetch accepted products.");
      const data = await response.json();
      setAcceptedProducts(data);
    } catch (error) { console.error("Error fetching accepted products:", error); setAcceptedProducts([]); }
    finally { setLoadingProducts(false); }
  };

  const fetchRejectedProducts = async (sellerId) => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`http://localhost:5002/api/seller/${sellerId}/rejected-products`);
      if (!response.ok) throw new Error("Failed to fetch rejected products.");
      const data = await response.json();
      setRejectedProducts(data);
    } catch (error) { console.error("Error fetching rejected products:", error); setRejectedProducts([]); }
    finally { setLoadingProducts(false); }
  };
  
  const handleViewProductDetails = async (productId) => {
    try {
      const response = await fetch(`http://localhost:5014/api/product/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product details.");
      const data = await response.json();
      setSelectedProductDetails(data);
      setCurrentDashboardView("product-detail");
    } catch (error) {
      console.error("Error fetching product details:", error);
      alert("Could not load product details. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId, status) => {
    if (!window.confirm("Are you sure you want to permanently delete this product? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5014/api/product/delete/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product.");
      }
      alert("Product deleted successfully.");
      if (status === 'accepted') {
        fetchAcceptedProducts(sellerInfo.seller_id);
      } else if (status === 'rejected') {
        fetchRejectedProducts(sellerInfo.seller_id);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sellerId");
    localStorage.removeItem("sellerName");
    localStorage.removeItem("sellerEmail");
    localStorage.removeItem("sellerLoggedIn");
    navigate("/");
  };

  const fetchSellerDetails = async (sellerId) => {
    try {
      const response = await fetch(`http://localhost:5003/api/seller/${sellerId}`);
      if (!response.ok) throw new Error("Failed to fetch seller details.");
      const data = await response.json();
      setSellerDetails(data);
      setEditedDetails(data);
    } catch (error) {
      console.error("Error fetching seller details:", error);
      alert("Failed to load account details. Please try again.");
    }
  };

  const handleEditAccount = () => {
    setIsEditing(true);
  };

  const handleSaveAccount = async () => {
    try {
      const response = await fetch(`http://localhost:5003/api/seller/update/${sellerInfo.seller_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedDetails),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update details.");
      }
      const updatedData = await response.json();
      setSellerDetails(updatedData);
      setIsEditing(false);
      localStorage.setItem("sellerName", updatedData.name);
      localStorage.setItem("sellerEmail", updatedData.email);
      setSellerInfo({ ...sellerInfo, name: updatedData.name, email: updatedData.email });
      alert("Account details updated successfully!");
    } catch (error) {
      console.error("Error saving details:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and all your products will be deleted.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5003/api/seller/delete/${sellerInfo.seller_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete account.");
      }
      alert("Your account and all associated data have been successfully deleted.");
      handleLogout();
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(`Error: ${error.message}`);
    }
  };
  
  const handleIngredientImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setIngredientImage(event.target.files[0]);
      setExtractedText("");
    }
  };

  const handleProductImagesChange = (event) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setProductImages(prevImages => [...prevImages, ...filesArray]);
    }
  };

  const performOcr = async () => {
    if (!ingredientImage) {
      alert("Please select an ingredient image first!");
      return;
    }
    setIsOcrProcessing(true);
    setExtractedText("");
    const formData = new FormData();
    formData.append("image", ingredientImage);
    try {
      const response = await fetch("http://localhost:5001/api/ocr", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setExtractedText(data.text);
    } catch (error) {
      console.error("OCR API call failed:", error);
      alert("Failed to extract text. Please ensure your backend is running and try another image.");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const storedSellerId = localStorage.getItem("sellerId");
    if (!storedSellerId) {
      alert("Seller information is not loaded. Please log in again.");
      navigate("/seller-login");
      return;
    }
    if (productImages.length === 0) {
      alert("Please upload at least one product image.");
      return;
    }
    if (!extractedText.trim()) {
      alert("Please provide ingredients for analysis (use OCR or type manually).");
      return;
    }
    const validationErrors = [];
    if (!productName.trim()) validationErrors.push("Product Name");
    if (!description.trim()) validationErrors.push("Product Description");
    if (!price.trim()) validationErrors.push("Price");
    if (!productType.trim()) validationErrors.push("Product Type");
    if (!brandName.trim()) validationErrors.push("Brand Name");
    if (!skinType.trim()) validationErrors.push("Recommended Skin Type");
    if (validationErrors.length > 0) {
      alert(`Please fill out the following required fields: ${validationErrors.join(', ')}`);
      return;
    }
    setIsAnalysisLoading(true);
    setAnalysisResult(null);
    setSelectedProductDetails(null);
    setShowExplanation(false);
    setCurrentDashboardView("analysis");
    const formData = new FormData();
    formData.append("sellerId", storedSellerId);
    formData.append("productName", productName);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("productType", productType);
    formData.append("brandName", brandName);
    formData.append("skinType", skinType);
    formData.append("ingredients", extractedText);
    productImages.forEach((image) => {
        formData.append(`images`, image);
    });
    try {
      const response = await fetch("http://localhost:5000/api/upload-product", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload product.");
      }
      const result = await response.json();
      setAnalysisResult(result);
      fetchProductCounts(storedSellerId);
    } catch (error) {
      console.error("Error uploading product:", error);
      alert(`Error: ${error.message}`);
      setCurrentDashboardView("upload");
    } finally {
      setIsAnalysisLoading(false);
    }
  };
  
  const handleSaveProductDetails = async () => {
    if (!selectedProductDetails) return;
    try {
      const response = await fetch(`http://localhost:5014/api/product/update/${selectedProductDetails.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedDetails),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update details.");
      }
      setSelectedProductDetails(prevDetails => ({ ...prevDetails, ...editedDetails }));
      setIsEditing(false);
      alert("Product details updated successfully!");
    } catch (error) {
      console.error("Error saving product details:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const changeDashboardView = (view) => {
    setCurrentDashboardView(view);
    setMobileMenuOpen(false);
    setAccountOpen(false);
    setSelectedProductDetails(null);
    setAnalysisResult(null);
    setIsEditing(false);
    if (view === "account-details" && sellerInfo.seller_id) {
      fetchSellerDetails(sellerInfo.seller_id);
    } else if (view === 'overview') {
      if (sellerInfo.seller_id) fetchProductCounts(sellerInfo.seller_id);
    }
  };

  const renderAnalysisResult = (analysisData) => {
    if (!analysisData || !analysisData.summary) {
        return <div className="seller-analysis-card"><p>No analysis data available for this product.</p></div>;
    }
    const verdictColors = { Good: "#4CAF50", Moderate: "#FFC107", Bad: "#F44336", Harmful: "#F44336" };
    const getVerdictIcon = (verdict) => {
        switch (verdict) {
            case "Good": return faCheckCircle;
            case "Moderate": return faExclamationCircle;
            case "Bad": case "Harmful": return faTimesCircle;
            default: return faExclamationCircle;
        }
    };
    const getIngredientColor = (verdict = "") => {
        switch (verdict.toLowerCase()) {
            case "good": return "seller-green-pill";
            case "moderate": return "seller-yellow-pill";
            case "bad": case "harmful": return "seller-red-pill";
            default: return "seller-gray-pill";
        }
    };
    const pieData = [
        { name: "Good", value: analysisData.summary.good || 0 },
        { name: "Moderate", value: analysisData.summary.moderate || 0 },
        { name: "Bad", value: analysisData.summary.bad || 0 },
        { name: "Unknown", value: analysisData.summary.unknown || 0 },
    ].filter((data) => data.value > 0);
    const COLOR_MAP = { Good: "#4CAF50", Moderate: "#FFC107", Bad: "#F44336", Unknown: "#9E9E9E" };
    const allIngredients = [
        ...(analysisData.highly_contributing || []),
        ...(analysisData.moderate_ingredients || []),
        ...(analysisData.least_contributing || [])
    ];
    return (
        <div className="seller-analysis-container">
            <div className="seller-analysis-card">
                <h2>Analysis Status & Verdict</h2>
                <div className="seller-verdict-display" style={{ backgroundColor: verdictColors[analysisData.overall_verdict] || "#9E9E9E" }}>
                    <span><FontAwesomeIcon icon={getVerdictIcon(analysisData.overall_verdict)} /> Verdict: {analysisData.overall_verdict}</span>
                </div>
            </div>
            <div className="seller-analysis-card">
                <h2>Ingredient Classification Breakdown</h2>
                <div className="seller-pie-chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                                {pieData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={COLOR_MAP[entry.name]} />))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="seller-analysis-card">
                <h2>Recognized Ingredients</h2>
                <div className="seller-ingredients-grid">
                    {allIngredients.map((ing, index) => (<span key={`ing-${index}`} className={`seller-ingredient-pill ${getIngredientColor(ing.verdict)}`}>{ing.ingredient_name}</span>))}
                </div>
            </div>
            <button className="seller-overall-verdict-btn" onClick={() => setShowExplanation(!showExplanation)}>
                {showExplanation ? "Hide Detailed Explanation" : "View Detailed Explanation"}
            </button>
            {showExplanation && (
                <div className="seller-analysis-card seller-explanation-card">
                    <h2>Detailed Explanation</h2>
                    <p className="seller-explanation-text">{analysisData.overall_explanation}</p>
                </div>
            )}
        </div>
    );
  };
  
  const renderAccountDetails = () => {
    if (!sellerDetails) return <p>Loading account details...</p>;
    return (
      <div className="seller-account-details-container">
        <div className="seller-account-details-centered-box">
          <h2>Your Account Details</h2>
          <div className="seller-account-details-card">
            {isEditing ? (
              <div className="seller-edit-form">
                <div className="seller-form-group"><label>Name:</label><input type="text" value={editedDetails.name} onChange={(e) => setEditedDetails({ ...editedDetails, name: e.target.value })} /></div>
                <div className="seller-form-group"><label>Email:</label><input type="email" value={editedDetails.email} onChange={(e) => setEditedDetails({ ...editedDetails, email: e.target.value })} /></div>
                <div className="seller-form-group"><label>Business License ID:</label><input type="text" value={editedDetails.business_license_id} onChange={(e) => setEditedDetails({ ...editedDetails, business_license_id: e.target.value })} /></div>
                <div className="seller-form-group"><label>Phone Number:</label><input type="tel" value={editedDetails.seller_phno} onChange={(e) => setEditedDetails({ ...editedDetails, seller_phno: e.target.value })} /></div>
              </div>
            ) : (
              <div className="seller-details-display">
                <p><strong>Name:</strong> {sellerDetails.name}</p><p><strong>Email:</strong> {sellerDetails.email}</p><p><strong>Business License ID:</strong> {sellerDetails.business_license_id}</p><p><strong>Phone Number:</strong> {sellerDetails.seller_phno}</p>
              </div>
            )}
            <div className="seller-account-actions">
              {isEditing ? <button className="seller-action-button seller-save-button" onClick={handleSaveAccount}><FontAwesomeIcon icon={faSave} /> Save</button> : <button className="seller-action-button seller-edit-button" onClick={handleEditAccount}><FontAwesomeIcon icon={faEdit} /> Edit</button>}
              <button className="seller-action-button seller-delete-button" onClick={handleDeleteAccount}><FontAwesomeIcon icon={faTrash} /> Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProductDetails = () => {
    if (!selectedProductDetails) return <div>Loading product details...</div>;

    const handleEditChange = (e) => {
      const { name, value } = e.target;
      setEditedDetails(prev => ({ ...prev, [name]: value }));
    };

    const enterEditMode = () => {
      setEditedDetails({
        product_name: selectedProductDetails.product_name,
        description: selectedProductDetails.description,
        price: selectedProductDetails.price,
        product_type: selectedProductDetails.product_type,
        brand_name: selectedProductDetails.brand_name,
      });
      setIsEditing(true);
    };
    
    const detailBoxStyle = {
        background: '#fff',
        padding: '2rem 3rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '2rem auto'
    };
    const detailItemStyle = {
        display: 'grid',
        gridTemplateColumns: '150px 1fr',
        gap: '1rem',
        marginBottom: '1rem',
        alignItems: 'start',
        fontSize: '1rem',
        lineHeight: '1.5'
    };
    const detailLabelStyle = {
        fontWeight: 'bold',
        color: '#555'
    };

    return (
      <div className="seller-product-detail-container">
        <button className="seller-back-button" onClick={() => changeDashboardView('overview')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
        </button>
        
        {isEditing ? (
            <div style={detailBoxStyle}>
                <h2 style={{ textAlign: 'center', color: '#884D69', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2rem' }}>Edit Product Details</h2>
                <div className="seller-edit-form">
                    <div className="seller-form-group"><label>Product Name:</label><input type="text" name="product_name" value={editedDetails.product_name} onChange={handleEditChange} /></div>
                    <div className="seller-form-group"><label>Brand Name:</label><input type="text" name="brand_name" value={editedDetails.brand_name} onChange={handleEditChange} /></div>
                    <div className="seller-form-group"><label>Product Type:</label><input type="text" name="product_type" value={editedDetails.product_type} onChange={handleEditChange} /></div>
                    <div className="seller-form-group"><label>Price (₹):</label><input type="number" name="price" value={editedDetails.price} onChange={handleEditChange} /></div>
                    <div className="seller-form-group"><label>Product Description:</label><textarea name="description" value={editedDetails.description} onChange={handleEditChange} rows="6"></textarea></div>
                </div>
                <div className="seller-account-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
                    <button className="seller-action-button seller-save-button" onClick={handleSaveProductDetails}><FontAwesomeIcon icon={faSave} /> Save Changes</button>
                    <button className="seller-action-button seller-secondary-button" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
            </div>
        ) : (
            <div style={detailBoxStyle}>
                <h2 style={{ textAlign: 'center', color: '#884D69', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2rem' }}>Product Details</h2>
                <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>Product Name:</span>
                    <span>{selectedProductDetails.product_name}</span>
                </div>
                <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>Brand:</span>
                    <span>{selectedProductDetails.brand_name}</span>
                </div>
                <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>Type:</span>
                    <span>{selectedProductDetails.product_type}</span>
                </div>
                <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>Price:</span>
                    <span>₹{selectedProductDetails.price}</span>
                </div>
                <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>For Skin Type:</span>
                    <span>{selectedProductDetails.skin_type}</span>
                </div>
                <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>Description:</span>
                    <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                        {selectedProductDetails.description && selectedProductDetails.description.split('||').map((paragraph, index) => (
                            <p key={index} style={{ margin: 0, marginBottom: '1em' }}>
                                {paragraph.trim()}
                            </p>
                        ))}
                    </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                    <button 
                        style={{ background: '#f0c040', color: '#111', border: '1px solid #a88734', borderRadius: '3px', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={enterEditMode}
                    >
                        <FontAwesomeIcon icon={faEdit} style={{ marginRight: '8px' }}/> EDIT DETAILS
                    </button>
                </div>
            </div>
        )}
        
        <hr className="seller-form-separator" />
        
        <div className="seller-detail-analysis">
          {renderAnalysisResult(selectedProductDetails)}
        </div>
      </div>
    );
  };

  const renderDashboardContent = () => {
    switch (currentDashboardView) {
      case "product-detail":
        return renderProductDetails();
      
      case "rejected":
        return (
          <div className="seller-rejected-products-section">
            <h2>Rejected Products</h2>
            <p>These products were rejected. Click on a product to see the full details.</p>
            {loadingProducts ? <p>Loading...</p> : rejectedProducts.length > 0 ? (
              <div className="seller-product-grid">
                {rejectedProducts.map((product) => (
                  <div key={product.product_id} className="seller-product-card" style={{ position: 'relative' }} onClick={() => handleViewProductDetails(product.product_id)}>
                    <div className="seller-product-image-container">
                      {product.image_base64 && <img src={`data:image/jpeg;base64,${product.image_base64}`} alt={product.product_name} className="seller-product-image" />}
                    </div>
                    <div className="seller-product-info">
                      <h3 className="seller-product-name">{product.product_name}</h3>
                      <p className="seller-product-price">₹{product.price}</p>
                    </div>
                    <button 
                      style={{ 
                        position: 'absolute', 
                        bottom: '8px', 
                        right: '8px', 
                        background: 'none', 
                        border: 'none', 
                        color: '#CB7A9A', 
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.product_id, 'rejected'); }}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                ))}
              </div>
            ) : <p>No rejected products found.</p>}
          </div>
        );
      case "accepted":
        return (
          <div className="seller-accepted-products-section">
            <h2>Accepted Products</h2>
            <p>These products are approved. Click on a product to see its full details.</p>
            {loadingProducts ? <p>Loading...</p> : acceptedProducts.length > 0 ? (
              <div className="seller-product-grid">
                {acceptedProducts.map((product) => (
                  <div key={product.product_id} className="seller-product-card" style={{ position: 'relative' }} onClick={() => handleViewProductDetails(product.product_id)}>
                     <div className="seller-product-image-container">
                      {product.image_base64 && <img src={`data:image/jpeg;base64,${product.image_base64}`} alt={product.product_name} className="seller-product-image" />}
                    </div>
                    <div className="seller-product-info">
                      <h3 className="seller-product-name">{product.product_name}</h3>
                      <p className="seller-product-price">₹{product.price}</p>
                    </div>
                    <button 
                      style={{ 
                        position: 'absolute', 
                        bottom: '8px', 
                        right: '8px', 
                        background: 'none', 
                        border: 'none', 
                        color: '#CB7A9A', 
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.product_id, 'accepted'); }}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                  </div>
                ))}
              </div>
            ) : <p>No accepted products found.</p>}
          </div>
        );
      case "overview":
        return (
          <div className="seller-dashboard-overview">
            <h2>Welcome, Seller!</h2>
            <p>This is your central hub to manage all your products and business operations.</p>
            <div className="seller-dashboard-metrics">
              <div className="seller-metric-card"><h3>Total Products</h3><p>{productCounts.total_products}</p></div>
              <div className="seller-metric-card"><h3>Approved Products</h3><p>{productCounts.accepted_products}</p></div>
              <div className="seller-metric-card"><h3>Rejected Products</h3><p>{productCounts.rejected_products}</p></div>
            </div>
          </div>
        );
      case "upload":
        return (
          <div className="seller-upload-section">
            <h2>Upload New Skincare Product</h2>
            <p>Enter comprehensive product details and leverage our smart ingredient extraction.</p>
            {analysisResult && (
              <div className="seller-analysis-summary-section">
                <p>An analysis report from a previous upload is available.</p>
                <button onClick={() => setCurrentDashboardView("analysis")} className="seller-show-analysis-btn">Show Last Analysis</button>
              </div>
            )}
            <form className="seller-upload-form" onSubmit={handleProductSubmit}>
              <div className="seller-form-group"><label>Product Name:</label><input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} required /></div>
              
              <div className="seller-form-group">
                <label>Product Images (drag to reorder first image):</label>
                <div className="seller-file-input-group">
                  <input type="file" id="productImages" accept="image/*" multiple onChange={handleProductImagesChange} className="seller-hidden-file-input" />
                  <label htmlFor="productImages" className="seller-custom-file-upload"><FontAwesomeIcon icon={faUpload} /> Upload Images</label>
                </div>
                {productImages.length > 0 && (
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={productImages.map((img, index) => img.name + index)} strategy={horizontalListSortingStrategy}>
                      <div className="seller-product-images-preview">
                        {productImages.map((image, index) => (
                          <SortableImage 
                            key={image.name + index} 
                            image={image} 
                            index={index}
                            onRemove={(idx) => setProductImages(currentImages => currentImages.filter((_, i) => i !== idx))}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
              
              <hr className="seller-form-separator" />
              <h3>Ingredient List Extraction</h3>
              <p className="seller-sub-description">Upload an image of the ingredients to auto-fill the list, or type them in manually.</p>
              <div className="seller-ingredient-ocr-section">
                <div className="seller-image-upload-zone">
                  {ingredientImage ? <img src={URL.createObjectURL(ingredientImage)} alt="Ingredient Preview" className="seller-ingredient-main-preview" /> : <div className="seller-image-placeholder"><FontAwesomeIcon icon={faUpload} size="2x" /><p>Upload Ingredient Photo</p></div>}
                  <input type="file" accept="image/*" onChange={handleIngredientImageChange} className="seller-full-overlay-input" />
                </div>
                <div className="seller-ocr-controls-and-text">
                  <div className="seller-ocr-buttons-container">
                    <button type="button" onClick={performOcr} disabled={isOcrProcessing || !ingredientImage} className="seller-action-button"><FontAwesomeIcon icon={faCamera} /> {isOcrProcessing ? `Processing...` : `Extract from Image`}</button>
                    <button type="button" onClick={() => { setIngredientImage(null); setExtractedText(""); }} className="seller-action-button seller-secondary-button">Clear</button>
                  </div>
                  <div className="seller-extracted-text-container"><label>Ingredients:</label><textarea value={extractedText} onChange={(e) => setExtractedText(e.target.value)} rows="8" placeholder="Extracted text will appear here, or type ingredients separated by commas." className="seller-editable-textarea"></textarea></div>
                </div>
              </div>
              <hr className="seller-form-separator" />
              <div className="seller-form-group"><label>Product Type:</label><input type="text" value={productType} onChange={(e) => setProductType(e.target.value)} required /></div>
              <div className="seller-form-group"><label>Brand Name:</label><input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} required /></div>
              <div className="seller-form-group"><label>Recommended Skin Type:</label><select value={skinType} onChange={(e) => setSkinType(e.target.value)} required><option value="">-- Select --</option><option value="oily">Oily</option><option value="dry">Dry</option><option value="combination">Combination</option><option value="normal">Normal</option><option value="sensitive">Sensitive</option><option value="acne-prone">Acne-Prone</option><option value="All">All</option></select></div>
              <div className="seller-form-group"><label>Product Description:</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required></textarea></div>
              <div className="seller-form-group"><label>Price (₹):</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} step="1" min="0" required /></div>
              <button type="submit" className="seller-submit-product-btn" disabled={isAnalysisLoading}>Submit Product</button>
            </form>
          </div>
        );
      case "analysis": 
        if (isAnalysisLoading) {
            return (
              <div className="seller-analysis-container seller-loading-state">
                <div className="seller-loader"></div>
                <h2>Analyzing Ingredients...</h2>
                <p>This may take a moment. Please wait.</p>
              </div>
            );
        }
        return renderAnalysisResult(analysisResult);
      case "account-details":
        return renderAccountDetails();
      default:
        return <div><h2>Overview</h2><p>Select an option to get started.</p></div>;
    }
  };

  return (
    <div className="seller-dashboard-container">
      <div className="seller-taskbar">
        <button className="seller-mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}><FontAwesomeIcon icon={faBars} /></button>
        <img src={logo} alt="Logo" className="seller-taskbar-logo" />
        <div className="seller-nav-icons">
          <span className={currentDashboardView === "upload" ? "seller-nav-active" : ""} onClick={() => changeDashboardView("upload")}>Upload Product</span>
          <span className={currentDashboardView === "rejected" ? "seller-nav-active" : ""} onClick={() => changeDashboardView("rejected")}>Rejected</span>
          <span className={currentDashboardView === "accepted" ? "seller-nav-active" : ""} onClick={() => changeDashboardView("accepted")}>Accepted</span>
          <span className={currentDashboardView === "overview" ? "seller-nav-active" : ""} onClick={() => changeDashboardView("overview")}>Overview</span>
        </div>
        <div className="seller-account-container">
          <button className={`seller-account-btn ${accountOpen ? 'seller-active' : ''}`} onClick={() => setAccountOpen(!accountOpen)}><FontAwesomeIcon icon={faUser} /></button>
        </div>
      </div>
      {accountOpen && (
        <div className="seller-account-dropdown">
          <p><strong>{sellerInfo.name}</strong></p><p>{sellerInfo.email}</p>
          <button onClick={() => { changeDashboardView("account-details"); setAccountOpen(false); }}>Account Details</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      )}
      <div className={`seller-mobile-nav-menu ${mobileMenuOpen ? "open" : ""}`}>
        <button className="seller-close-btn" onClick={() => setMobileMenuOpen(false)}><FontAwesomeIcon icon={faTimes} /></button>
        <div className="seller-menu-item-group">
          <span className={currentDashboardView === "upload" ? "seller-nav-active" : ""} onClick={() => changeDashboardView("upload")}>Upload Product</span>
          <span className={currentDashboardView === "rejected" ? "seller-nav-active" : ""} onClick={() => changeDashboardView("rejected")}>Rejected Product</span>
          <span className={currentDashboardView === "accepted" ? "seller-nav-active" : ""} onClick={() => changeDashboardView("accepted")}>Accepted Product</span>
          <span className={currentDashboardView === "overview" ? "seller-nav-active" : ""} onClick={() => changeDashboardView("overview")}>Dashboard Overview</span>
        </div>
        <div className="seller-menu-item-group seller-account-details-box">
          <p><strong>{sellerInfo.name}</strong></p><p>{sellerInfo.email}</p>
          <button onClick={() => { changeDashboardView("account-details"); setMobileMenuOpen(false); }}>Account Details</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </div>
      <div className="seller-dashboard-content">{renderDashboardContent()}</div>
    </div>
  );
}

export default SellerDashboard;