
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


@app.route('/api/seller/<int:seller_id>/accepted-products', methods=['GET'])
def get_accepted_products(seller_id):
    """
    Fetches accepted products for a specific seller, now including price and skin type.
    """
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        
        query = """
        SELECT
            p.product_id,
            p.product_name,
            p.price,
            p.skin_type,
            p.image,
            ap.overall_explanation,
            ap.highly_contributing,
            ap.moderate_ingredients,
            ap.least_contributing,
            ap.summary,
            ap.overall_verdict
        FROM
            product AS p
        JOIN
            accepted_products AS ap ON p.product_id = ap.product_id
        WHERE
            p.seller_id = %s;
        """
        cur.execute(query, (seller_id,))
        products = cur.fetchall()

        columns = [desc[0] for desc in cur.description]
        
        product_list = []
        for row in products:
            product_dict = dict(zip(columns, row))
            
            if product_dict.get('image') and len(product_dict['image']) > 0:
                product_dict['image_base64'] = base64.b64encode(product_dict['image'][0]).decode('utf-8')
            
            del product_dict['image']
            
            for key in ['highly_contributing', 'moderate_ingredients', 'least_contributing', 'summary']:
                if product_dict.get(key) is None:
                    product_dict[key] = {}
            
            product_list.append(product_dict)

        return jsonify(product_list)

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        return jsonify({"error": "Failed to retrieve accepted products."}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@app.route('/api/seller/<int:seller_id>/rejected-products', methods=['GET'])
def get_rejected_products(seller_id):
    """
    Fetches rejected products for a specific seller, now including price and skin type.
    """
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # MODIFIED QUERY: Added p.price and p.skin_type to the SELECT statement
        query = """
        SELECT
            p.product_id,
            p.product_name,
            p.price,
            p.skin_type,
            p.image,
            rp.overall_explanation,
            rp.highly_contributing,
            rp.moderate_ingredients,
            rp.least_contributing,
            rp.summary,
            rp.overall_verdict
        FROM
            product AS p
        JOIN
            rejected_products AS rp ON p.product_id = rp.product_id
        WHERE
            p.seller_id = %s;
        """
        cur.execute(query, (seller_id,))
        products = cur.fetchall()

        columns = [desc[0] for desc in cur.description]
        
        product_list = []
        for row in products:
            product_dict = dict(zip(columns, row))
            
            if product_dict.get('image') and len(product_dict['image']) > 0:
                product_dict['image_base64'] = base64.b64encode(product_dict['image'][0]).decode('utf-8')
            
            del product_dict['image']
            
            for key in ['highly_contributing', 'moderate_ingredients', 'least_contributing', 'summary']:
                if product_dict.get(key) is None:
                    product_dict[key] = {}
            
            product_list.append(product_dict)

        return jsonify(product_list)

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        return jsonify({"error": "Failed to retrieve rejected products."}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(port=5002, debug=True)