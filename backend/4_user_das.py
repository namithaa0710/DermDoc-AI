# user_das.py
import psycopg2
import base64
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database connection function
def get_db_connection():
    # Use the connection details you provided.
    conn = psycopg2.connect(
        host="",
        database="",
        user="",
        password=""
    )
    return conn

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # SQL query to get accepted products and their details from the product table
        # We join on product_id and select the first image (image[1])
        # Note: PostgreSQL array indices start at 1, so it should be image[1]
        cur.execute("""
            SELECT p.product_id, p.product_name, p.price, p.skin_type, p.image[1] AS image
            FROM product p
            JOIN accepted_products ap ON p.product_id = ap.product_id;
        """)
        
        products = cur.fetchall()
        
        # Prepare the data for JSON response
        products_list = []
        for product in products:
            product_id, product_name, price, skin_type, image_data = product
            
            # Convert binary image data to base64 string
            image_base64 = base64.b64encode(image_data).decode('utf-8') if image_data else None
            
            products_list.append({
                "product_id": product_id,
                "product_name": product_name,
                "price": str(price) if price is not None else None, # Convert Decimal to string
                "skin_type": skin_type,
                "image": image_base64
            })
            
        cur.close()
        conn.close()
        
        return jsonify(products_list)

    except (Exception, psycopg2.Error) as error:
        print("Error while fetching products from PostgreSQL:", error)
        return jsonify({"error": "Failed to retrieve products."}), 500

if __name__ == '__main__':
    # Using a port number after 5007 as requested
    app.run(port=5008, debug=True)