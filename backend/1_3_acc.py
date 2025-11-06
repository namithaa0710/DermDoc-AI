
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash
import os
import psycopg2.extras # Import psycopg2.extras for DictCursor
import math
import logging
import json
from groq import Groq
import base64

# Configure basic logging
logging.basicConfig(level=logging.INFO)

# Initialize the Flask application
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Database Connection Setup ---
def get_db_connection():
    conn = psycopg2.connect(
        host="",
        database="",
        user="",
        password=""
    )
    return conn

# --- Ingredient Search Function ---
def find_ingredient_in_db(ingredient_name, skin_type, cur):
    ing_lower = ingredient_name.lower()
    skin_type_lower = skin_type.lower()
    #Exact match + specific skin type:
    cur.execute(
        "SELECT * FROM ingredients WHERE LOWER(ingredient_name) = %s AND %s = ANY(skin_type)",
        (ing_lower, skin_type_lower)
    )
    result = cur.fetchone()
    if result:
        return dict(result)
    #Partial match (ILIKE) + specific skin type:
    cur.execute(
        "SELECT * FROM ingredients WHERE LOWER(ingredient_name) ILIKE %s AND %s = ANY(skin_type)",
        (f'%{ing_lower}%', skin_type_lower)
    )
    result = cur.fetchone()
    if result:
        return dict(result)
    #Exact match + 'all' skin type:
    cur.execute(
        "SELECT * FROM ingredients WHERE LOWER(ingredient_name) = %s AND 'all' = ANY(skin_type)",
        (ing_lower,)
    )
    result = cur.fetchone()
    if result:
        return dict(result)
    #Partial match + 'all' skin type:
    cur.execute(
        "SELECT * FROM ingredients WHERE LOWER(ingredient_name) ILIKE %s AND 'all' = ANY(skin_type)",
        (f'%{ing_lower}%',)
    )
    result = cur.fetchone()
    if result:
        return dict(result)
    #Exact match + 'general' skin type:
    cur.execute(
        "SELECT * FROM ingredients WHERE LOWER(ingredient_name) = %s AND 'general' = ANY(skin_type)",
        (ing_lower,)
    )
    result = cur.fetchone()
    if result:
        return dict(result)
    #Partial match + 'general' skin type:
    cur.execute(
        "SELECT * FROM ingredients WHERE LOWER(ingredient_name) ILIKE %s AND 'general' = ANY(skin_type)",
        (f'%{ing_lower}%',)
    )
    result = cur.fetchone()
    if result:
        return dict(result)
    # --- ADD THIS NEW PART AT THE END OF THE FUNCTION ---

    # Fallback: Exact match for ingredient name, ignoring skin type completely
    cur.execute(
        "SELECT * FROM ingredients WHERE LOWER(ingredient_name) = %s",
        (ing_lower,)
    )
    result = cur.fetchone()
    if result:
        return dict(result)

    # Final Fallback: Similar (ILIKE) match for ingredient name, ignoring skin type
    cur.execute(
        "SELECT * FROM ingredients WHERE LOWER(ingredient_name) ILIKE %s",
        (f'%{ing_lower}%',)
    )
    result = cur.fetchone()
    # --- ADD THIS NEW PART AT THE VERY END OF THE FUNCTION ---

    # Final, most powerful fallback: Find the top similar match using trigram similarity.
    # This can handle different word orders, typos, and other similarities.
    cur.execute(
        """
        SELECT *, similarity(LOWER(ingredient_name), %s) AS score
        FROM ingredients
        ORDER BY LOWER(ingredient_name) <-> %s
        LIMIT 1
        """,
        (ing_lower, ing_lower)
    )
    result = cur.fetchone()

    # Only return the result if it's a reasonably good match (similarity score > 0.3).
    # You can adjust this 0.3 value (from 0.0 to 1.0) to be more or less strict.
    if result and result['score'] > 0.6:
        return dict(result)

    # --- END OF THE NEW PART ---
    if result:
        return dict(result)
    # --- ADD THIS NEW PART FOR FLEXIBLE MATCHING ---

    # Normalize the input by removing spaces and hyphens for a more flexible search
    normalized_ing_lower = ing_lower.replace('-', '').replace(' ', '')

    # Query the database by also removing spaces and hyphens from the stored ingredient name before comparing
    cur.execute(
        "SELECT * FROM ingredients WHERE REPLACE(REPLACE(REPLACE(REPLACE(LOWER(ingredient_name), '-', ''), ' ', ''), '.', ''), '_', '') = %s",
        (normalized_ing_lower,)
    )
    result = cur.fetchone()
    if result:
        return dict(result)

    # --- END OF THE NEW PART ---

    # --- END OF THE NEW PART ---
    return None


def groq_analyze_skincare(product_name, ingredients_list, skin_type):
    if not ingredients_list:
        return {
            "overall_verdict": "Moderate",
            "overall_explanation": "No ingredients were provided for analysis.",
            "highly_contributing": [],
            "moderate_ingredients": [],
            "least_contributing": [],
            "summary": {"good": 0, "moderate": 0, "bad": 0}
        }

    total_ingredients = len(ingredients_list)
    highly_contributing_count = max(1, math.ceil(total_ingredients * 0.1))
    least_contributing_count = max(1, math.ceil(total_ingredients * 0.3))

    highly_contributing_list = ingredients_list[:highly_contributing_count]
    moderate_ingredients_list = ingredients_list[highly_contributing_count:total_ingredients - least_contributing_count]
    least_contributing_list = ingredients_list[total_ingredients - least_contributing_count:]

    def format_ingredients(ing_list):
        return [
            {
                "ingredient_name": ing['ingredient_name'],
                "verdict": ing['verdict'],
                "side_effects": ing['side_effect']
            }
            for ing in ing_list
        ]

    # --- Keyword-based verdict mapping ---
    BAD_KEYWORDS = ["bad", "danger", "harmful", "toxic"]
    GOOD_KEYWORDS = ["good", "beneficial", "safe"]

    def map_verdict(verdict):
        v = verdict.lower()
        if any(k in v for k in BAD_KEYWORDS):
            return "bad"
        elif any(k in v for k in GOOD_KEYWORDS):
            return "good"
        else:
            return "moderate"

    # --- Weighted scoring ---
    weight_mapping = {"high": 3, "moderate": 2, "least": 1}
    good_score = 0
    bad_score = 0

    for ing in highly_contributing_list:
        verdict = map_verdict(ing.get('verdict', 'unknown'))
        if verdict == "good":
            good_score += weight_mapping["high"]
        elif verdict == "bad":
            bad_score += weight_mapping["high"]
        ing['verdict'] = verdict  # normalize for output

    for ing in moderate_ingredients_list:
        verdict = map_verdict(ing.get('verdict', 'unknown'))
        if verdict == "good":
            good_score += weight_mapping["moderate"]
        elif verdict == "bad":
            bad_score += weight_mapping["moderate"]
        ing['verdict'] = verdict

    for ing in least_contributing_list:
        verdict = map_verdict(ing.get('verdict', 'unknown'))
        if verdict == "good":
            good_score += weight_mapping["least"]
        elif verdict == "bad":
            bad_score += weight_mapping["least"]
        ing['verdict'] = verdict

    # --- Determine overall verdict ---
    
        if bad_score > good_score:
            overall_verdict = "Bad"
        elif any(ing['verdict'] == 'bad' for ing in highly_contributing_list):
             overall_verdict = "Moderate"
        elif good_score > bad_score:
            overall_verdict = "Good"
        else:
            overall_verdict = "Moderate"

    # --- Prepare prompt ---
    highly_contrib_details = " , ".join([f"Name: {ing['ingredient_name']}, Verdict: {ing['verdict']}, Side Effect: {ing['side_effect']}" for ing in highly_contributing_list])
    moderate_details = " , ".join([f"Name: {ing['ingredient_name']}, Verdict: {ing['verdict']}, Side Effect: {ing['side_effect']}" for ing in moderate_ingredients_list])
    least_contrib_details = " , ".join([f"Name: {ing['ingredient_name']}, Verdict: {ing['verdict']}, Side Effect: {ing['side_effect']}" for ing in least_contributing_list])

    prompt = f"""
You are a professional skincare product analyst. Your task is to analyze a list of skincare ingredients and provide a concise, accurate verdict and explanation. The ingredients are categorized based on their position, which correlates to their concentration.

Product Name: {product_name if product_name else 'N/A'}
Skin Type: {skin_type}

Ingredients categorized by position/concentration:
- Highly Contributing (Top 10%): {highly_contrib_details}
- Moderate Ingredients (Next 60%): {moderate_details}
- Least Contributing (Last 30%): {least_contrib_details}

Based on this information, provide a single JSON object with the following structure:
1. **overall_verdict**: A single word verdict from "Good", "Moderate", or "Bad". The verdict has already been determined as "{overall_verdict}".
2. **overall_explanation**: A brief, single-paragraph explanation for the verdict, considering the ingredients and their effects.
3. **highly_contributing**: An array of objects for the highly contributing ingredients. The verdict for each ingredient must be a single word: "Good", "Moderate", "Bad", or "Unknown".
4. **moderate_ingredients**: An array of objects for the moderate ingredients. The verdict for each ingredient must be a single word: "Good", "Moderate", "Bad", or "Unknown".
5. **least_contributing**: An array of objects for the least contributing ingredients. The verdict for each ingredient must be a single word: "Good", "Moderate", "Bad", or "Unknown".
6. **summary**: An object with counts of 'good', 'moderate', and 'bad' verdicts from the entire ingredient list.
EXPLANATION SHOULD BE IN DETAIL SO THAT THE USER CAN UNDERSTAND WHY THE VERDICT IS GIVEN.
Respond with a single JSON object. Do NOT include any other text, prefaces, or explanations outside of the JSON.
Example JSON response:
{{
  "overall_verdict": "Good",
  "overall_explanation": "This product contains powerful antioxidants like Vitamin C and beneficial humectants such as hyaluronic acid. While it contains a common fragrance, its concentration is likely low. Overall, it is highly beneficial for hydration and protection.",
  "highly_contributing": [
    {{ "ingredient_name": "Vitamin C", "verdict": "Good", "side_effects": "N/A" }},
    {{ "ingredient_name": "Hyaluronic Acid", "verdict": "Good", "side_effects": "N/A" }}
  ],
  "moderate_ingredients": [],
  "least_contributing": [
    {{ "ingredient_name": "Fragrance", "verdict": "Bad", "side_effects": "Potential irritant" }}
  ],
  "summary": {{"good": 2,"moderate": 0,"bad": 1}}
}}
"""

    # --- Groq API call ---
    try:
        client = Groq(
             api_key = os.environ.get("GROQ_API_KEY", "REMOVED")

        )
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="qwen/qwen3-32b",
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        response_content = chat_completion.choices[0].message.content
        analysis_data = json.loads(response_content)

        verdict_counts = {"good": 0, "moderate": 0, "bad": 0}

        def count_verdicts(ing_list):
            for ing in ing_list:
                v = ing.get('verdict', 'unknown').lower()
                if v == "good": verdict_counts['good'] += 1
                elif v == "moderate": verdict_counts['moderate'] += 1
                elif v == "bad": verdict_counts['bad'] += 1
            return ing_list

        final_result = {
            "overall_verdict": overall_verdict,
            "overall_explanation": analysis_data.get("overall_explanation", "Analysis complete."),
            "highly_contributing": count_verdicts(analysis_data.get("highly_contributing", [])),
            "moderate_ingredients": count_verdicts(analysis_data.get("moderate_ingredients", [])),
            "least_contributing": count_verdicts(analysis_data.get("least_contributing", [])),
            "summary": verdict_counts
        }
        return final_result

    except Exception as e:
        logging.error(f"An unexpected error occurred during Groq analysis: {e}")
        return {
            "overall_verdict": "Bad",
            "overall_explanation": "An unexpected error occurred during analysis.",
            "highly_contributing": format_ingredients(highly_contributing_list),
            "moderate_ingredients": format_ingredients(moderate_ingredients_list),
            "least_contributing": format_ingredients(least_contributing_list),
            "summary": {
                "good": sum(1 for ing in ingredients_list if map_verdict(ing['verdict']) == 'good'),
                "moderate": sum(1 for ing in ingredients_list if map_verdict(ing['verdict']) == 'moderate'),
                "bad": sum(1 for ing in ingredients_list if map_verdict(ing['verdict']) == 'bad')
            }
        }


# --- Other Routes ---

@app.route('/register', methods=['POST'])
def register_seller():
    conn = None
    cur = None
    try:
        data = request.json
        name, email, password = data.get('name'), data.get('email'), data.get('password')
        business_license_id, seller_phno = data.get('business_license_id'), data.get('seller_phno')

        if not all([name, email, password, business_license_id, seller_phno]):
            return jsonify({'error': 'All fields are required'}), 400

        hashed_password = generate_password_hash(password)
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT email FROM Seller WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'error': 'Email already registered'}), 409

        cur.execute(
            "INSERT INTO Seller (name, email, password_hash, business_license_id, seller_phno) VALUES (%s, %s, %s, %s, %s) RETURNING seller_id",
            (name, email, hashed_password, business_license_id, seller_phno)
        )
        seller_id = cur.fetchone()[0]
        conn.commit()
        return jsonify({'message': 'Seller registered successfully', 'seller_id': seller_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/login', methods=['POST'])
def login_seller():
    conn = None
    cur = None
    try:
        data = request.json
        email, password = data.get('email'), data.get('password')

        if not all([email, password]):
            return jsonify({'message': 'Email and password are required'}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT seller_id, name, email, password_hash FROM Seller WHERE email = %s", (email,))
        seller_data = cur.fetchone()

        if seller_data and check_password_hash(seller_data[3], password):
            seller_id, name, email, _ = seller_data
            return jsonify({'message': 'Login successful', 'seller': {'seller_id': seller_id, 'name': name, 'email': email}}), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'message': 'Server error.', 'error': str(e)}), 500
    finally:
        if cur: cur.close()
        if conn: conn.close()

@app.route('/api/upload-product', methods=['POST'])
def upload_product():
    conn = None
    cur = None
    try:
        seller_id = request.form.get('sellerId')
        product_name = request.form.get('productName')
        description = request.form.get('description')
        price = request.form.get('price')
        product_type = request.form.get('productType')
        brand_name = request.form.get('brandName')
        skin_type = request.form.get('skinType')
        ingredients_string = request.form.get('ingredients')
        # category = request.form.get('category') # <-- REMOVED

        # Validation check reverted to original
        if not all([seller_id, product_name, price, product_type, brand_name, ingredients_string]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if 'images' not in request.files:
            return jsonify({'error': 'No image files provided'}), 400
        
        image_files = request.files.getlist('images')
        
        if len(image_files) > 5:
            return jsonify({'error': 'Maximum of 5 images allowed'}), 400

        image_data_list = [img_file.read() for img_file in image_files]

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        ingredients = [ing.strip() for ing in ingredients_string.split(',') if ing.strip()]
        
        db_ingredients_data = []
        for ingredient in ingredients:
            found_ingredient = find_ingredient_in_db(ingredient, skin_type, cur)
            db_ingredients_data.append(found_ingredient or {
                'ingredient_name': ingredient, 'verdict': 'Unknown',
                'effect': 'N/A', 'side_effect': 'N/A', 'usage_notes': 'N/A'
            })
        
        analysis_result = groq_analyze_skincare(product_name, db_ingredients_data, skin_type)

        # INSERT statement reverted to original
        cur.execute(
            """
            INSERT INTO product
            (seller_id, product_name, description, price, product_type, brand_name, skin_type, ingredients_list, image)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING product_id
            """,
            (seller_id, product_name, description, price, product_type, brand_name, skin_type, ingredients, image_data_list)
        )
        product_id = cur.fetchone()[0]

        overall_verdict = analysis_result.get('overall_verdict')
        overall_explanation = analysis_result.get('overall_explanation')
        highly_contributing = json.dumps(analysis_result.get('highly_contributing'))
        moderate_ingredients = json.dumps(analysis_result.get('moderate_ingredients'))
        least_contributing = json.dumps(analysis_result.get('least_contributing'))
        summary = json.dumps(analysis_result.get('summary'))
        
        table_to_insert = "accepted_products" if overall_verdict.lower() in ['good', 'moderate'] else "rejected_products"
        
        cur.execute(
            f"""
            INSERT INTO {table_to_insert} (product_id, overall_verdict, overall_explanation, highly_contributing, moderate_ingredients, least_contributing, summary) 
            VALUES (%s, %s, %s, %s, %s, %s, %s);
            """,
            (product_id, overall_verdict, overall_explanation, highly_contributing, moderate_ingredients, least_contributing, summary)
        )
        
        # No longer adding category to the response
        
        conn.commit()
        
        return jsonify(analysis_result), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error during product upload: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
