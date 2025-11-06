
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2 import sql

app = Flask(__name__)
CORS(app)



def get_db_connection():
    """Establishes a connection to the PostgreSQL database."""
    conn = psycopg2.connect(
        dbname="",
        host="",
        user="",
        password=""
    )
    return conn



@app.route('/api/seller/<int:seller_id>', methods=['GET'])
def get_seller_details(seller_id):
    """Fetches a single seller's details by their ID."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT name, email, business_license_id, seller_phno FROM seller WHERE seller_id = %s",
            (seller_id,)
        )
        seller = cur.fetchone()
        cur.close()

        if seller:
            return jsonify({
                "name": seller[0],
                "email": seller[1],
                "business_license_id": seller[2],
                "seller_phno": str(seller[3]) if seller[3] else None
            })
        else:
            return jsonify({"error": "Seller not found"}), 404

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/api/seller/update/<int:seller_id>', methods=['PUT'])
def update_seller_details(seller_id):
    """Updates a seller's details, excluding the password hash."""
    conn = None
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        business_license_id = data.get('business_license_id')
        seller_phno = data.get('seller_phno')

        # Simple validation
        if not all([name, email, business_license_id]):
            return jsonify({"error": "Name, email, and business license ID are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            UPDATE seller
            SET name = %s, email = %s, business_license_id = %s, seller_phno = %s
            WHERE seller_id = %s
            RETURNING name, email, business_license_id, seller_phno;
            """,
            (name, email, business_license_id, seller_phno, seller_id)
        )
        updated_seller = cur.fetchone()
        conn.commit()
        cur.close()

        if updated_seller:
            return jsonify({
                "name": updated_seller[0],
                "email": updated_seller[1],
                "business_license_id": updated_seller[2],
                "seller_phno": str(updated_seller[3]) if updated_seller[3] else None
            })
        else:
            return jsonify({"error": "Seller not found"}), 404

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        return jsonify({"error": "Internal server error", "details": str(error)}), 500
    finally:
        if conn:
            conn.close()

# --- The DELETE route needs a fix to handle the foreign key constraint. ---

@app.route('/api/seller/delete/<int:seller_id>', methods=['DELETE'])
def delete_seller_account(seller_id):
    """
    Deletes a seller and their associated products.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get the product IDs associated with the seller
        cur.execute("SELECT product_id FROM product WHERE seller_id = %s;", (seller_id,))
        product_ids = [row[0] for row in cur.fetchall()]
        
        # If there are products to delete, proceed
        if product_ids:
            # Step 1: Manually delete from tables that reference `product`
            cur.execute(
                "DELETE FROM accepted_products WHERE product_id = ANY(%s);",
                (product_ids,)
            )
            cur.execute(
                "DELETE FROM rejected_products WHERE product_id = ANY(%s);",
                (product_ids,)
            )

            # Step 2: Now delete from the `product` table
            cur.execute(
                "DELETE FROM product WHERE seller_id = %s;",
                (seller_id,)
            )

        # Step 3: Delete the seller record
        cur.execute("DELETE FROM seller WHERE seller_id = %s RETURNING seller_id;", (seller_id,))
        deleted_count = cur.rowcount
        
        conn.commit()
        cur.close()

        if deleted_count > 0:
            return jsonify({"message": "Seller account and all associated products have been deleted successfully."}), 200
        else:
            conn.rollback()
            return jsonify({"error": "Seller not found"}), 404

    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Database error: {error}")
        conn.rollback() # Ensure rollback on failure
        return jsonify({"error": "Internal server error", "details": str(error)}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(port=5003)