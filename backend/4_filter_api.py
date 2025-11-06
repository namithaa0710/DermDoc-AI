import psycopg2
import base64
from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2.extras # Add this import

app = Flask(__name__)
CORS(app)

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host="",
            database="",
            user="",
            password=""
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        return None

@app.route('/api/products/filter', methods=['GET'])
def get_filtered_products():
    skin_types_str = request.args.get('skin_types')
    print(f"--- Received request for skin types: {skin_types_str} ---") # DEBUG

    if not skin_types_str:
        return jsonify({"error": "skin_types query parameter is required"}), 400

    skin_types_list = [st.strip() for st in skin_types_str.split(',')]
    skin_types_tuple = tuple(skin_types_list)
    print(f"--- Parsed skin types tuple: {skin_types_tuple} ---") # DEBUG

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    
    # Use DictCursor to access columns by name
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    products = []
    try:
        sql_query = """
            SELECT 
                p.product_id, p.product_name, p.price, 
                p.skin_type, p.image[1] AS image 
            FROM product p
            INNER JOIN accepted_products ap ON p.product_id = ap.product_id
            WHERE p.skin_type IN %s;
        """
        
        cursor.execute(sql_query, (skin_types_tuple,))
        fetched_products = cursor.fetchall()

        print(f"--- SQL query executed. Found {len(fetched_products)} products. ---") # DEBUG

        for row in fetched_products:
            image_base64 = None
            if row['image']:
                image_base64 = base64.b64encode(row['image']).decode('utf-8')

            products.append({
                "product_id": row['product_id'],
                "product_name": row['product_name'],
                "price": float(row['price']) if row['price'] is not None else 0.0,
                "skin_type": row['skin_type'],
                "image": image_base64,
            })

    except psycopg2.Error as e:
        print(f"!!! Database query error: {e} !!!") # DEBUG
        return jsonify({"error": "Failed to fetch filtered products"}), 500
    finally:
        cursor.close()
        conn.close()

    print(f"--- Sending back {len(products)} products in response. ---") # DEBUG
    return jsonify(products)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5010, debug=True)