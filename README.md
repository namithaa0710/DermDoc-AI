# 🌿 DermDoc-AI  
**Smart Skincare Ingredient Validator & Seller Approval System**

<p align="center">
  <img src="images/1_splash.png" alt="DermDoc-AI Logo" width="400" style="border-radius:20px; box-shadow: 0px 8px 20px rgba(0,0,0,0.3); transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"/>
  <br>
  <i style="font-size:18px; color:#555;">Discover the truth behind skincare products with DermDoc-AI</i>
</p>


## 🎬 Demo Video

[![Watch Demo Video](https://img.icons8.com/ios-filled/50/000000/video.png)](https://drive.google.com/file/d/1bv3t99bTWJkV76nUm-NkvesFGWMzpOZW/view?usp=sharing)  
Click above to watch the full demo of DermDoc-AI in action.

---

## ✨ Introduction

Even if a skincare product claims to be **pure and organic**, the truth lies in its ingredients. Users cannot check every ingredient manually, and most products sold online contain hidden inorganic chemicals. DermDoc-AI was born to **empower users**, **validate ingredients**, and **ensure only safe products reach consumers**.  

---

## 🌟 Key Features

### 🔍 Ingredient Validation for Users
* Scan any skincare product image or upload ingredient lists.  
* Get **safety status** (Green/Red/Yellow) for each product.  
* Check **skin-type compatibility** (Oily, Normal, Combination).  

### 🛒 Seller Product Validation
* Sellers can **register and upload products** with ingredient lists.  
* System **automatically approves safe products** and **rejects unsafe ones**.  
* Only **approved and safe products** are shown in the **user dashboard**; rejected products are hidden to maintain **user trust**.  
* Both approved and rejected products receive **detailed AI explanations** for ingredient safety assessment.  

### 🧠 AI-Powered Evaluation
* **Hermes-2 Pro** evaluates ingredient lists contextually and decides overall product safety.  
* **Groq AI** provides **explanations using web scraping data**, helping users and sellers understand ingredient risks.  
* Generates **rejection reasons or suggestions for product improvement** for unsafe products.  

### 💾 Database & Product Management
* **PostgreSQL/MySQL** stores ingredients, products, and seller information.  
* Structured tables include ingredient info, skin-type tables, alternatives, seller info, and product submissions.  
* Ensures **fast lookup**, **secure storage**, and transparent product listing.  

### 🌐 Web Scraping & Knowledge Base
* **BeautifulSoup + ScraperAPI** extract ingredient data from multiple sources.  
* Build a comprehensive **ingredient and alternative knowledge base**.  

### 🚀 User & Seller Experience
* Users get **instant validation and compatibility checks**.  
* Sellers get **automatic approval or rejection** with **clear AI-generated feedback**.  
* Maintains **trustworthy and safe product listings** on the platform.






## 📱 App Screenshots & Demos



### Initial App Flow

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell" colspan="2">
      <img src="images/2_user_seller.png" alt="2_user_seller.png" class="screenshot-img"/><br>
      <i>Choose to login as user or seller</i>
    </td>
  </tr>
</table>



---

### 📝 Seller Onboarding & Login

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/3_seller_signup.png" alt="3_seller_signup.png" class="screenshot-img"/><br>
      <i>Seller signup</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/4_seller_login.png" alt="4_seller_login.png" class="screenshot-img"/><br>
      <i>Seller login</i>
    </td>
  </tr>
</table>

---

### 📤 Product Upload & Overview

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/5_overview.png" alt="5_overview.png" class="screenshot-img"/><br>
      <i>Product counts overview</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/6.1_uppload_prod.png" alt="6.1_uppload_prod.png" class="screenshot-img"/><br>
      <i>Seller upload product </i>
    </td>
  </tr>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/6.2_uppload_prod.png" alt="6.2_uppload_prod.png" class="screenshot-img"/><br>
      <i>Seller upload product</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/10_edit_acc.png" alt="10_edit_acc.png" class="screenshot-img"/><br>
      <i>Edit seller account</i>
    </td>
  </tr>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/11_user_dashboard.png" alt="11_user_dashboard.png" class="screenshot-img"/><br>
      <i>User dashboard</i>
    </td>
    <td class="screenshot-cell">
      <!-- You can leave this empty if no image -->
    </td>
  </tr>
</table>

---

### 🤖 Product Evaluation & AI Explanation

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/7.1_verdict.png" alt="7.1_verdict.png" class="screenshot-img"/><br>
      <i>Product verdict & ingredient classification</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/7.2_ai_exp.png" alt="7.2_a_exp.png" class="screenshot-img"/><br>
      <i>AI explanation of ingredients</i>
    </td>
  </tr>
</table>

---

### ✅ Product Approval Status

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/8_accepted_products.png" alt="8_accepted_products.png" class="screenshot-img"/><br>
      <i>Accepted products</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/9_rejected_products.png" alt="9_rejected_products.png" class="screenshot-img"/><br>
      <i>Rejected products</i>
    </td>
  </tr>
</table>

---

###🔍  User Dashboard & Product Search

<table>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/12_user_dashboard_product.png" alt="12_user_dashboard_product.png" class="screenshot-img"/><br>
      <i>User dashboard product overview</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/13_prod_explanation.png" alt="13_prod_explanation.png" class="screenshot-img"/><br>
      <i>Product verdict in user dashboard</i>
    </td>
  </tr>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/14_user_check_product.png" alt="14_user_check_product.png" class="screenshot-img"/><br>
      <i>User check product</i>
    </td>
    <td class="screenshot-cell">
      <img src="images/15_filter.png" alt="15_filter.png" class="screenshot-img"/><br>
      <i>Filter products</i>
    </td>
  </tr>
  <tr class="screenshot-row">
    <td class="screenshot-cell">
      <img src="images/16_search_products.png" alt="16_search_products.png" class="screenshot-img"/><br>
      <i>Search products</i>
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


