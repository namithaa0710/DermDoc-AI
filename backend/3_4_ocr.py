from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS to allow cross-origin requests
import easyocr
import numpy as np
import cv2
from werkzeug.utils import secure_filename
import os

# .\venv\Scripts\Activate.ps1
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize EasyOCR reader once when the app starts
# Set gpu=False if you don't have a compatible GPU or want to run on CPU only
try:
    reader = easyocr.Reader(['en'], gpu=False) # Use 'en' for English
    print("EasyOCR reader initialized successfully.")
except Exception as e:
    print(f"Error initializing EasyOCR reader: {e}")
    print("Please ensure EasyOCR and its its dependencies (like PyTorch) are correctly installed.")
    reader = None # Set reader to None if initialization fails

@app.route('/api/ocr', methods=['POST'])
def perform_ocr_api():
    if reader is None:
        return jsonify({'error': 'OCR engine not initialized on backend. Check server logs.'}), 500

    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided in the request.'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file.'}), 400
    
    # Save the file temporarily
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    extracted_text = ""
    try:
        # EasyOCR processing
        # detail=0 returns only the detected text strings
        results = reader.readtext(filepath, detail=0) 
        extracted_text = "\n".join(results) # Join results with newlines
        
        # Print the extracted text to the backend terminal
        print("\n--- Extracted Text from Image ---")
        print(extracted_text)
        print("---------------------------------\n")

        return jsonify({'text': extracted_text})
    except Exception as e:
        print(f"Error during OCR processing: {e}")
        return jsonify({'error': f'Failed to process image: {str(e)}'}), 500
    finally:
        # Clean up the uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

# This block ensures the Flask app runs only when the script is executed directly
if __name__ == '__main__':
    # Start the Flask development server
    app.run(host='0.0.0.0', port=5001)
