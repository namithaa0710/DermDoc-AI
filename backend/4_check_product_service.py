
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras # For dictionary cursors
import math
import logging
import json
import re
from groq import Groq

# Configure basic logging
logging.basicConfig(level=logging.INFO)

# Initialize the Flask application
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Database Connection Setup (Exactly as you provided) ---
def get_db_connection():
    # Connects to your PostgreSQL database
    conn = psycopg2.connect(
        host="",
        database="",
        user="",
        password=""
    )
    return conn

# --- Ingredient Search Function (Exactly as you provided) ---
def find_ingredient_in_db(ingredient_name, skin_type, cur):
    """
    Searches for an ingredient in the database with a fallback logic.
    """
    ing_lower = ingredient_name.lower()
    skin_type_lower = skin_type.lower()
    
    search_queries = [
        ("SELECT * FROM ingredients WHERE LOWER(ingredient_name) = %s AND %s = ANY(skin_type)", (ing_lower, skin_type_lower)),
        ("SELECT * FROM ingredients WHERE LOWER(ingredient_name) ILIKE %s AND %s = ANY(skin_type)", (f'%{ing_lower}%', skin_type_lower)),
        ("SELECT * FROM ingredients WHERE LOWER(ingredient_name) = %s AND 'all' = ANY(skin_type)", (ing_lower,)),
        ("SELECT * FROM ingredients WHERE LOWER(ingredient_name) ILIKE %s AND 'all' = ANY(skin_type)", (f'%{ing_lower}%',)),
        ("SELECT * FROM ingredients WHERE LOWER(ingredient_name) = %s AND 'general' = ANY(skin_type)", (ing_lower,)),
        ("SELECT * FROM ingredients WHERE LOWER(ingredient_name) ILIKE %s AND 'general' = ANY(skin_type)", (f'%{ing_lower}%',))
    ]
    
    for query, params in search_queries:
        cur.execute(query, params)
        result = cur.fetchone()
        if result:
            return dict(result)

    return None

# --- Groq-based Ingredient Analysis Function (No changes here) ---
def groq_analyze_skincare(product_name, ingredients_list, skin_type):
    """
    Analyzes ingredients using Groq.
    """
    if not ingredients_list:
        return {
            "overall_verdict": "Moderate",
            "overall_explanation": "No ingredients were provided for analysis.",
            "highly_contributing": [], "moderate_ingredients": [], "least_contributing": [],
            "summary": {"good": 0, "moderate": 0, "bad": 0, "unknown": 0}
        }

    total_ingredients = len(ingredients_list)
    highly_contributing_count = math.ceil(total_ingredients * 0.1)
    least_contributing_count = math.ceil(total_ingredients * 0.3)
    highly_contributing_list = ingredients_list[:highly_contributing_count]
    moderate_ingredients_list = ingredients_list[highly_contributing_count:total_ingredients - least_contributing_count]
    least_contributing_list = ingredients_list[total_ingredients - least_contributing_count:]

    has_bad_in_high_contrib = any(ing['verdict'].lower() == 'bad' for ing in highly_contributing_list)
    if has_bad_in_high_contrib:
        overall_verdict = "Bad"
    else:
        good_count = sum(1 for ing in ingredients_list if ing['verdict'].lower() == 'good')
        bad_count = sum(1 for ing in ingredients_list if ing['verdict'].lower() == 'bad')
        if bad_count > good_count:
            overall_verdict = "Bad"
        elif good_count > bad_count:
            overall_verdict = "Good"
        else:
            overall_verdict = "Moderate"

    highly_contrib_details = " , ".join([f"Name: {ing['ingredient_name']}, Verdict: {ing['verdict']}, Side Effect: {ing.get('side_effect', 'N/A')}" for ing in highly_contributing_list])
    moderate_details = " , ".join([f"Name: {ing['ingredient_name']}, Verdict: {ing['verdict']}, Side Effect: {ing.get('side_effect', 'N/A')}" for ing in moderate_ingredients_list])
    least_contrib_details = " , ".join([f"Name: {ing['ingredient_name']}, Verdict: {ing['verdict']}, Side Effect: {ing.get('side_effect', 'N/A')}" for ing in least_contributing_list])
    
    # This is your EXACT prompt, with no changes.
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
GIVE THE EXPLANATION IN DETAIL SO THAT THE USER CAN UNDERSTAND WHY THE VERDICT IS GIVEN.
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
   "summary": {{
     "good": 2,
     "moderate": 0,
     "bad": 1
   }}
}}
"""
    
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

        if "summary" not in analysis_data or not analysis_data["summary"]:
            verdict_counts = {"good": 0, "moderate": 0, "bad": 0, "unknown": 0}
            def count_verdicts(ing_list):
                for ing in ing_list:
                    verdict = ing.get('verdict', 'unknown').lower()
                    if 'good' in verdict: verdict_counts['good'] += 1
                    elif 'moderate' in verdict: verdict_counts['moderate'] += 1
                    elif 'bad' in verdict: verdict_counts['bad'] += 1
                    else: verdict_counts['unknown'] += 1
            
            count_verdicts(analysis_data.get("highly_contributing", []))
            count_verdicts(analysis_data.get("moderate_ingredients", []))
            count_verdicts(analysis_data.get("least_contributing", []))
            analysis_data["summary"] = verdict_counts

        return analysis_data

    except Exception as e:
        logging.error(f"Error during Groq analysis: {e}")
        return {
            "overall_verdict": "Bad",
            "overall_explanation": "An internal error occurred during AI analysis. Please check the backend logs.",
            "highly_contributing": [], "moderate_ingredients": [], "least_contributing": [],
            "summary": {"good": 0, "moderate": 0, "bad": 0, "unknown": 0}
        }

# --- Main API Route for User Product Analysis ---
@app.route('/api/check-product', methods=['POST'])
def check_product():
    conn = None
    cur = None
    try:
        data = request.json
        ingredients_string = data.get('ingredients')
        skin_type = data.get('skin_type')
        prod_type = data.get('prod_type')

        if not all([ingredients_string, skin_type, prod_type]):
            return jsonify({"error": "Missing required fields: ingredients, skin_type, prod_type"}), 400

        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # --- THIS IS THE ONLY PART THAT HAS BEEN CHANGED (AS REQUESTED) ---
        # It now ONLY splits by comma and treats newlines/semicolons as spaces.
        
        # Step 1: Replace newlines and semicolons with a single space.
        # This joins multi-line ingredients (e.g., "Hydro-\ngenated Oil") into one line.
        processed_string = re.sub(r'[\n;]+', ' ', ingredients_string)
        
        # Step 2: Split the cleaned string ONLY by commas.
        ingredients = [ing.strip() for ing in processed_string.split(',') if ing.strip()]

        db_ingredients_data = []
        # This loop now iterates over the correctly separated list of ALL ingredients.
        for ingredient in ingredients:
            found_ingredient = find_ingredient_in_db(ingredient, skin_type, cur)
            if found_ingredient:
                db_ingredients_data.append(found_ingredient)
            else:
                db_ingredients_data.append({
                    'ingredient_name': ingredient,
                    'verdict': 'Unknown',
                    'side_effect': 'No information found in our database.'
                })
        
        # The full, correct list is sent for analysis.
        analysis_result = groq_analyze_skincare(prod_type, db_ingredients_data, skin_type)
        
        return jsonify(analysis_result)

    except Exception as e:
        logging.error(f"An error occurred in /api/check-product: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# --- Main execution ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5012, debug=True)