import os
import base64
import numpy as np
import cv2
import face_recognition
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
import json # Untuk menyimpan embedding sebagai JSON string
import logging # Untuk logging yang lebih baik

# Konfigurasi logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Konfigurasi Aplikasi Flask ---
app = Flask(__name__)

# Konfigurasi database MySQL
# Ganti dengan kredensial MySQL Anda dan nama database yang baru Anda buat.
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@127.0.0.1:3306/face_recognition_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Model Database untuk Menyimpan Embedding Wajah ---
class FaceEmbedding(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nik = db.Column(db.String(20), unique=True, nullable=False) # NIK dari pegawai, harus unik
    name = db.Column(db.String(255), nullable=False) # Nama pegawai
    # Embedding data akan disimpan sebagai TEXT (JSON string dari array float)
    embedding_data = db.Column(db.Text, nullable=False) # Ini akan menyimpan rata-rata embedding

    def __repr__(self):
        return f'<FaceEmbedding {self.nik} - {self.name}>'

# --- Helper Functions for Image and Face Processing ---

def decode_base64_image(base64_string):
    """
    Mengubah string Base64 (dengan atau tanpa prefiks data URI) menjadi gambar OpenCV (numpy array).
    """
    if "base64," in base64_string:
        base64_string = base64_string.split("base64,")[1]
    
    try:
        img_bytes = base64.b64decode(base64_string)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        app.logger.error(f"Error decoding base64 image: {e}")
        return None

def get_face_embedding(image):
    """
    Mendeteksi wajah dalam gambar dan mengembalikan embedding wajah pertama yang ditemukan.
    Mengembalikan None jika tidak ada wajah terdeteksi.
    """
    if image is None:
        return None

    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_image)

    if not face_locations:
        return None # Tidak ada wajah terdeteksi

    face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
    
    if face_encodings:
        return face_encodings[0] # Mengembalikan embedding pertama
    return None

def find_matching_face(new_embedding):
    """
    Mencari embedding yang paling cocok di database.
    Mengembalikan NIK, nama, dan tingkat kepercayaan jika ditemukan, None jika tidak.
    """
    if new_embedding is None:
        return None, None, 0.0

    all_faces = FaceEmbedding.query.all()
    
    known_embeddings = []
    known_niks = []
    known_names = []

    for face in all_faces:
        try:
            embedding_array = np.array(json.loads(face.embedding_data))
            known_embeddings.append(embedding_array)
            known_niks.append(face.nik)
            known_names.append(face.name)
        except json.JSONDecodeError as e:
            app.logger.error(f"Error decoding embedding for NIK {face.nik}: {e}")
            continue # Lewati embedding yang rusak

    if not known_embeddings:
        return None, None, 0.0 # Tidak ada embedding di database

    face_distances = face_recognition.face_distance(known_embeddings, new_embedding)
    
    best_match_index = np.argmin(face_distances)
    
    tolerance = 0.6 # Semakin kecil, semakin ketat kecocokannya
    
    if face_distances[best_match_index] < tolerance:
        confidence = (1 - face_distances[best_match_index]) # Konversi jarak menjadi kepercayaan
        return known_niks[best_match_index], known_names[best_match_index], confidence
    
    return None, None, 0.0 # Tidak ada kecocokan yang cukup kuat

# --- Endpoint API ---

@app.route('/register_face', methods=['POST'])
def register_face():
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.get_json()
    
    # Validasi bahwa 'images' adalah array dan ada
    images_base64 = data.get('images')
    if not images_base64 or not isinstance(images_base64, list) or len(images_base64) == 0:
        return jsonify({"message": "Missing or invalid 'images' array (must be a list of base64 strings)."}), 400

    name = data.get('name')
    nik = data.get('nik')

    if not name or not nik:
        return jsonify({"message": "Missing 'name' or 'nik' field."}), 400

    extracted_embeddings = []
    for i, img_b64 in enumerate(images_base64):
        image = decode_base64_image(img_b64)
        if image is None:
            app.logger.warning(f"Image {i+1} decoding failed.")
            continue # Lanjutkan ke gambar berikutnya jika decoding gagal

        embedding = get_face_embedding(image)
        if embedding is None:
            app.logger.warning(f"No face detected in image {i+1} for NIK: {nik}.")
            continue # Lanjutkan ke gambar berikutnya jika tidak ada wajah terdeteksi

        extracted_embeddings.append(embedding)
    
    if not extracted_embeddings:
        return jsonify({"message": "No valid faces found in any of the provided images. Please try again with clear photos."}), 400

    # Rata-ratakan embeddings yang berhasil diekstrak
    # np.mean akan menghitung rata-rata untuk setiap elemen dari array embeddings
    averaged_embedding = np.mean(extracted_embeddings, axis=0)
    
    # Ubah numpy array embedding menjadi string JSON untuk penyimpanan
    embedding_json_string = json.dumps(averaged_embedding.tolist())

    # Cek apakah NIK sudah terdaftar di database face_recognition_db
    existing_face = FaceEmbedding.query.filter_by(nik=nik).first()
    if existing_face:
        # Jika NIK sudah ada, update embedding dan nama
        existing_face.embedding_data = embedding_json_string
        existing_face.name = name
        db.session.commit()
        app.logger.info(f"Updated face embedding for NIK: {nik}")
        return jsonify({
            "message": "Face embedding updated successfully.",
            "nik": nik,
            "name": name,
            "face_embedding": averaged_embedding.tolist() # Kirim kembali embedding ke Laravel
        }), 200
    else:
        # Jika NIK belum ada, buat entri baru
        new_face_embedding = FaceEmbedding(
            nik=nik,
            name=name,
            embedding_data=embedding_json_string
        )
        db.session.add(new_face_embedding)
        db.session.commit()
        app.logger.info(f"Registered new face for NIK: {nik}")
        return jsonify({
            "message": "Face registered successfully.",
            "nik": nik,
            "name": name,
            "face_embedding": averaged_embedding.tolist() # Kirim kembali embedding ke Laravel
        }), 201 # 201 Created

@app.route('/recognize_face', methods=['POST'])
def recognize_face():
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.get_json()
    if 'image' not in data:
        return jsonify({"message": "Missing field: image"}), 400

    image_base64 = data['image']

    image = decode_base64_image(image_base64)
    if image is None:
        return jsonify({"message": "Invalid image data provided."}), 400

    new_embedding = get_face_embedding(image)
    if new_embedding is None:
        return jsonify({"message": "No face detected in the image. Please try again."}), 400

    recognized_nik, recognized_name, confidence = find_matching_face(new_embedding)

    if recognized_nik:
        return jsonify({
            "status": "success",
            "message": f"Face recognized as {recognized_name} (NIK: {recognized_nik})",
            "nik": recognized_nik,
            "name": recognized_name,
            "confidence": round(confidence * 100, 2)
        }), 200
    else:
        return jsonify({
            "status": "failure",
            "message": "Face not recognized or no strong match found.",
            "nik": "UNKNOWN",
            "name": "UNKNOWN",
            "confidence": 0.0
        }), 404

if __name__ == '__main__':
    with app.app_context():
        # Membuat tabel di database MySQL jika belum ada
        db.create_all()
    
    app.run(debug=True, host='0.0.0.0', port=5000)