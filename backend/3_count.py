import base64
from flask import Flask, jsonify, request
import psycopg2
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

@app.route('/api/seller/<int:seller_id>/product-counts', methods=['GET'])
def get_product_counts(seller_id):
    """
    Fetches the total, accepted, and rejected product counts for a specific seller.
    """
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Count accepted products for the seller
        cur.execute("SELECT COUNT(*) FROM accepted_products AS ap JOIN product AS p ON ap.product_id = p.product_id WHERE p.seller_id = %s;", (seller_id,))
        accepted_products = cur.fetchone()[0]

        # Count rejected products for the seller
        cur.execute("SELECT COUNT(*) FROM rejected_products AS rp JOIN product AS p ON rp.product_id = p.product_id WHERE p.seller_id = %s;", (seller_id,))
        rejected_products = cur.fetchone()[0]
        
        # Calculate total products by summing approved and rejected products
        total_products = accepted_products + rejected_products

        return jsonify({
            "total_products": total_products,
            "accepted_products": accepted_products,
            "rejected_products": rejected_products
        })

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        return jsonify({"error": "Failed to retrieve product counts."}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


if __name__ == '__main__':
    # *** Python backend configured to run on port 5009 ***
    app.run(port=5009, debug=True)