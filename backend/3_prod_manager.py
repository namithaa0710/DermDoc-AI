# File: product_manager.py
# Run on port 5014

import base64
from flask import Flask, jsonify, request
import psycopg2
import psycopg2.extras # Needed for dictionary cursor
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- Database Connection Setup ---
def get_db_connection():
    conn = psycopg2.connect(
        host="",
        database="",
        user="",
        password=""
    )
    return conn

# --- API Endpoints ---

@app.route('/api/product/<int:product_id>', methods=['GET'])
def get_full_product_details(product_id):
    """
    Fetches all details for a single product, including its analysis data.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        query = """
        SELECT
            p.product_id, p.seller_id, p.product_name, p.description, p.price,
            p.product_type, p.brand_name, p.skin_type, p.ingredients_list, p.image,
            COALESCE(ap.overall_verdict, rp.overall_verdict) as overall_verdict,
            COALESCE(ap.overall_explanation, rp.overall_explanation) as overall_explanation,
            COALESCE(ap.highly_contributing, rp.highly_contributing) as highly_contributing,
            COALESCE(ap.moderate_ingredients, rp.moderate_ingredients) as moderate_ingredients,
            COALESCE(ap.least_contributing, rp.least_contributing) as least_contributing,
            COALESCE(ap.summary, rp.summary) as summary
        FROM product p
        LEFT JOIN accepted_products ap ON p.product_id = ap.product_id
        LEFT JOIN rejected_products rp ON p.product_id = rp.product_id
        WHERE p.product_id = %s;
        """
        cur.execute(query, (product_id,))
        product = cur.fetchone()
        cur.close()

        if not product:
            return jsonify({"error": "Product not found"}), 404

        product_dict = dict(product)

        if product_dict.get('image'):
            product_dict['images_base64'] = [base64.b64encode(img_data).decode('utf-8') for img_data in product_dict['image']]
        del product_dict['image']

        return jsonify(product_dict)

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/product/update/<int:product_id>', methods=['PUT'])
def update_product_details(product_id):
    """
    Updates editable details of a product. Skin type is no longer editable.
    """
    conn = None
    try:
        data = request.json
        product_name = data.get('product_name')
        description = data.get('description')
        price = data.get('price')
        product_type = data.get('product_type')
        brand_name = data.get('brand_name')
        # skin_type is intentionally omitted as per the new requirement

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            UPDATE product
            SET
                product_name = %s,
                description = %s,
                price = %s,
                product_type = %s,
                brand_name = %s
            WHERE product_id = %s
            RETURNING product_id;
            """,
            # skin_type removed from the tuple below
            (product_name, description, price, product_type, brand_name, product_id)
        )

        if cur.fetchone() is None:
            return jsonify({"error": "Product not found"}), 404

        conn.commit()
        cur.close()
        return jsonify({"message": "Product updated successfully"}), 200

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Internal server error", "details": str(error)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/product/delete/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """
    Deletes a product and its associated records from accepted/rejected tables.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("DELETE FROM accepted_products WHERE product_id = %s;", (product_id,))
        cur.execute("DELETE FROM rejected_products WHERE product_id = %s;", (product_id,))
        cur.execute("DELETE FROM product WHERE product_id = %s RETURNING product_id;", (product_id,))
        
        if cur.fetchone() is None:
            conn.rollback()
            return jsonify({"error": "Product not found"}), 404
        
        conn.commit()
        cur.close()

        return jsonify({"message": "Product deleted successfully."}), 200

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        if conn:
            conn.rollback()
        return jsonify({"error": "Internal server error", "details": str(error)}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(port=5014, debug=True)