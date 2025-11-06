from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import base64

app = Flask(__name__)
CORS(app)

# --- IMPORTANT: UPDATE WITH YOUR DATABASE DETAILS ---
DB_CONFIG = {
    "dbname": "",
    "user": "",  
    "password": "", 
    "host": "",
    "port": "5432"
}


def get_db_connection():
    """Establishes a connection to the database."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except psycopg2.OperationalError as e:
        print(f"Error connecting to the database: {e}")
        return None

@app.route('/api/search/suggestions', methods=['GET'])
def get_search_suggestions():
    """Provides product name suggestions for the dropdown as the user types."""
    search_query = request.args.get('q', '').strip()

    if not search_query:
        return jsonify([])

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # Join product and accepted_products to search only within accepted items
            sql_query = """
                SELECT p.product_id, p.product_name
                FROM product p
                JOIN accepted_products ap ON p.product_id = ap.product_id
                WHERE p.product_name ILIKE %s
                ORDER BY p.product_name
                LIMIT 10;
            """
            # ILIKE is case-insensitive. %...% finds matches anywhere in the name.
            cur.execute(sql_query, (f'%{search_query}%',))
            products = cur.fetchall()

            suggestions = [dict(row) for row in products]
            return jsonify(suggestions)

    except Exception as e:
        print(f"Error during suggestion search: {e}")
        return jsonify({"error": "An error occurred during search"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/search/filter-products', methods=['GET'])
def filter_products_by_search():
    """Filters the main product grid based on a search term."""
    search_term = request.args.get('search', '').strip()

    if not search_term:
        return jsonify([])

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # ----This code is to filter the products displayed in dropdown---
            sql_query = """
                SELECT
                    p.product_id,
                    p.product_name,
                    p.price,
                    p.skin_type,
                    encode(p.image[1], 'base64') AS image
                FROM product p
                JOIN accepted_products ap ON p.product_id = ap.product_id
                WHERE p.product_name ILIKE %s
                ORDER BY
                    CASE
                        WHEN p.product_name ILIKE %s THEN 1 -- Exact match start has highest priority
                        WHEN p.product_name ILIKE %s THEN 2 -- Contained anywhere has second priority
                        ELSE 3
                    END,
                    p.product_name;
            """
            # Different patterns for relevance sorting
            search_pattern_anywhere = f'%{search_term}%'
            search_pattern_starts_with = f'{search_term}%'

            cur.execute(sql_query, (search_pattern_anywhere, search_pattern_starts_with, search_pattern_anywhere))
            products = cur.fetchall()
            
            # Convert fetched rows to a list of dictionaries
            product_list = [dict(row) for row in products]
            return jsonify(product_list)
    
    except Exception as e:
        print(f"Error during product filtering: {e}")
        return jsonify({"error": "An error occurred while filtering products"}), 500
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    # Runs on the requested port 5004
    app.run(debug=True, port=5004)