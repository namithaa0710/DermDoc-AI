# DermDoc-AI: Smart Skincare Ingredient Validator & Seller Approval System

<p align="center">
  <img src="images/1_splash.png" alt="DermDoc-AI Logo" width="250"/>
  <br>
  <i>Discover the truth behind skincare products with DermDoc-AI.</i>
</p>

---

## 🎬 Demo Video

[![Watch Demo Video](https://img.icons8.com/ios-filled/50/000000/video.png)](https://drive.google.com/file/d/1bv3t99bTWJkV76nUm-NkvesFGWMzpOZW/view?usp=sharing)  
Click above to watch the full demo of DermDoc-AI in action.

---

## ✨ Introduction

Even if a skincare product claims to be **pure and organic**, the truth lies in its ingredients. Users cannot check every ingredient manually, and most products sold online contain hidden inorganic chemicals. DermDoc-AI was born to **empower users**, **validate ingredients**, and **ensure only safe products reach consumers**.  

---

## 🌟 Key Features

### 🔍 Ingredient Validation for Users
* Scan any skincare product image and get a **complete ingredient analysis**.  
* Identify unsafe or chemically harmful ingredients instantly.  
* Receive **personalized alternatives** for safer usage.

### 🛒 Seller Product Validation
* Sellers can register and upload products with ingredient lists.  
* System automatically **approves safe products** and **rejects unsafe ones**.  
* Detailed rejection reasons are provided using **Hermes-2 Pro AI explanations**.

### 🧠 AI-Powered Insights
* **Hermes-2 Pro** evaluates ingredients contextually.  
* **Groq AI** provides explanations for safety decisions.  
* EasyOCR extracts ingredient text from product images.  
* BeautifulSoup + ScraperAPI gather ingredient data from multiple sources.  

### 💾 Database Management
* PostgreSQL stores ingredients, products, and seller info.  
* Structured tables ensure **fast lookups** and **secure storage**.  





## 📱 App Screenshots & Demos

<style>
  .screenshot-img {
    transition: transform 0.3s ease;
    border-radius: 10px;
    box-shadow: 0px 4px 12px rgba(0,0,0,0.25);
    width: 300px;  /* Increased size */
  }
  .screenshot-img:hover {
    transform: scale(1.15); /* Slight zoom on hover */
    cursor: pointer;
  }
  .screenshot-row:nth-child(even) {
    background-color: #f9f9f9;
  }
  .screenshot-row:nth-child(odd) {
    background-color: #ffffff;
  }
  .screenshot-cell {
    padding: 15px;
    text-align: center;
  }
</style>

### Initial App Flow

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/1_splash.png" alt="1_splash.png" class="screenshot-img"/><br>
      <i>1_splash.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/2_user_seller.png" alt="2_user_seller.png" class="screenshot-img"/><br>
      <i>2_user_seller.png</i>
    </td>
  </tr>
</table>

---

### Seller Onboarding & Login

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/3_seller_signup.png" alt="3_seller_signup.png" class="screenshot-img"/><br>
      <i>3_seller_signup.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/4_seller_login.png" alt="4_seller_login.png" class="screenshot-img"/><br>
      <i>4_seller_login.png</i>
    </td>
  </tr>
</table>

---

### Product Upload & Overview

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/5_overview.png" alt="5_overview.png" class="screenshot-img"/><br>
      <i>5_overview.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/6.1_uppload_prod.png" alt="6.1_uppload_prod.png" class="screenshot-img"/><br>
      <i>6.1_uppload_prod.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/6.2_uppload_prod.png" alt="6.2_uppload_prod.png" class="screenshot-img"/><br>
      <i>6.2_uppload_prod.png</i>
    </td>
  </tr>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/10_edit_acc.png" alt="10_edit_acc.png" class="screenshot-img"/><br>
      <i>10_edit_acc.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/11_user_dashboard.png" alt="11_user_dashboard.png" class="screenshot-img"/><br>
      <i>11_user_dashboard.png</i>
    </td>
  </tr>
</table>

---

### Product Evaluation & AI Explanation

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/7.1_verdict.png" alt="7.1_verdict.png" class="screenshot-img"/><br>
      <i>7.1_verdict.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/7.2_ai_exp.png" alt="7.2_a_exp.png" class="screenshot-img"/><br>
      <i>7.2_a_exp.png</i>
    </td>
  </tr>
</table>

---

### Product Approval Status

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/8_accepted_products.png" alt="8_accepted_products.png" class="screenshot-img"/><br>
      <i>8_accepted_products.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/9_rejected_products.png" alt="9_rejected_products.png" class="screenshot-img"/><br>
      <i>9_rejected_products.png</i>
    </td>
  </tr>
</table>

---

### User Dashboard & Product Search

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/12_user_dashboard_product.png" alt="12_user_dashboard_product.png" class="screenshot-img"/><br>
      <i>12_user_dashboard_product.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/13_prod_explanation.png" alt="13_prod_explanation.png" class="screenshot-img"/><br>
      <i>13_prod_explanation.png</i>
    </td>
  </tr>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/14_user_check_product.png" alt="14_user_check_product.png" class="screenshot-img"/><br>
      <i>14_user_check_product.png</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/15_filter.png" alt="15_filter.png" class="screenshot-img"/><br>
      <i>15_filter.png</i>
    </td>
  </tr>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/16_search_products.png" alt="16_search_products.png" class="screenshot-img"/><br>
      <i>16_search_products.png</i>
    </td>
  </tr>
</table>




## 🧰 Technology Stack

**Frontend:** React, Tailwind CSS  
**Backend:** Python (Flask/FastAPI)  
**Database:** PostgreSQL  
**OCR & AI Tools:** EasyOCR, Hermes-2 Pro, Groq AI  
**Web Scraping:** BeautifulSoup + ScraperAPI  

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
  <img src="https://img.shields.io/badge/EasyOCR-FF6F00?style=for-the-badge&logoColor=white"/>
  <img src="https://img.shields.io/badge/Hermes2Pro-008080?style=for-the-badge&logoColor=white"/>
  <img src="https://img.shields.io/badge/GroqAI-6C6C6C?style=for-the-badge&logoColor=white"/>
  <img src="https://img.shields.io/badge/BeautifulSoup-0288D1?style=for-the-badge&logo=python&logoColor=white"/>
  <img src="https://img.shields.io/badge/ScraperAPI-3D96D2?style=for-the-badge&logoColor=white"/>
</p>

---

## 🚀 Setup and Installation

### Clone the Repository

```bash
git clone https://github.com/namithaa0710/DermDoc-AI.git
cd DermDoc-AI


