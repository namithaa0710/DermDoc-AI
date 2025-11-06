from flask import Flask, jsonify
from flask_cors import CORS
import psycopg2
import base64
import os

app = Flask(__name__)
CORS(app)

# --- DATABASE CONNECTION ---
# Make sure to replace 'your_password' with your actual database password
def get_db_connection():
    conn = psycopg2.connect(
        host="",
        database="",
        user=os.environ.get('DB_USER', 'your_username'),
        password=os.environ.get('DB_PASSWORD', 'your_password')
    )
    return conn

@app.route('/api/product/details/<int:product_id>', methods=['GET'])
def get_product_details(product_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # The query joins product, accepted_products, and seller tables.
        query = """
            SELECT
                p.product_name, p.description, p.price, p.skin_type, p.image as images,
                s.email as seller_email, -- <<< THIS LINE IS FIXED
                ap.overall_verdict, ap.summary, ap.highly_contributing,
                ap.moderate_ingredients, ap.least_contributing, ap.overall_explanation
            FROM
                product p
            JOIN
                accepted_products ap ON p.product_id = ap.product_id
            JOIN
                seller s ON p.seller_id = s.seller_id
            WHERE
                p.product_id = %s;
        """
        
        cur.execute(query, (product_id,))
        product_data = cur.fetchone()
        
        if not product_data:
            cur.close()
            conn.close()
            return jsonify({"error": "Product not found or not an accepted product"}), 404

        # Get column names from cursor description
        columns = [desc[0] for desc in cur.description]
        product_dict = dict(zip(columns, product_data))

        cur.close()
        conn.close()

        # Process images: bytea[] comes as a list of bytes
        # Encode each image to base64
        encoded_images = []
        if product_dict.get('images'):
            for img_bytes in product_dict['images']:
                encoded_images.append(base64.b64encode(img_bytes).decode('utf-8'))

        # Structure the final JSON response as expected by the frontend
        response = {
            "product_name": product_dict.get('product_name'),
            "description": product_dict.get('description'),
            "price": float(product_dict.get('price', 0.0)),
            "skin_type": product_dict.get('skin_type'),
            "seller_email": product_dict.get('seller_email'),
            "images": encoded_images,
            "analysis": {
                "overall_verdict": product_dict.get('overall_verdict'),
                "summary": product_dict.get('summary'),
                "highly_contributing": product_dict.get('highly_contributing'),
                "moderate_ingredients": product_dict.get('moderate_ingredients'),
                "least_contributing": product_dict.get('least_contributing'),
                "overall_explanation": product_dict.get('overall_explanation')
            }
        }

        return jsonify(response)

    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database error occurred"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5011, debug=True)