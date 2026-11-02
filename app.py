import sqlite3
import math
from flask import Flask, request, jsonify

app = Flask(__name__, static_folder='.', static_url_path='')
DB_PATH = 'patients_pk.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER,
                weight_kg REAL,
                creatinine_clearance REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS regimens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER,
                drug_name TEXT NOT NULL,
                route TEXT NOT NULL,
                dose_mg REAL NOT NULL,
                interval_hours REAL NOT NULL,
                num_doses INTEGER NOT NULL,
                half_life_hours REAL NOT NULL,
                vd_liters REAL NOT NULL,
                ka REAL,
                bioavail_pct REAL,
                mec REAL,
                mtc REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients (id)
            )
        ''')
    print("Database initialized successfully.")

init_db()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/patients', methods=['GET', 'POST'])
def handle_patients():
    if request.method == 'POST':
        data = request.json or {}
        name = data.get('name', 'Anonymous Patient')
        age = int(data.get('age', 45))
        weight = float(data.get('weight', 70.0))
        crcl = float(data.get('crcl', 100.0)) # mL/min

        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO patients (name, age, weight_kg, creatinine_clearance) VALUES (?, ?, ?, ?)',
                (name, age, weight, crcl)
            )
            patient_id = cursor.lastrowid
        return jsonify({"status": "created", "patient_id": patient_id, "name": name})

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        rows = cursor.execute('SELECT * FROM patients ORDER BY id DESC').fetchall()
        patients = [dict(r) for r in rows]
    return jsonify(patients)

@app.route('/api/regimens', methods=['POST'])
def save_regimen():
    data = request.json or {}
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO regimens (patient_id, drug_name, route, dose_mg, interval_hours, num_doses, half_life_hours, vd_liters, ka, bioavail_pct, mec, mtc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('patient_id', 1),
            data.get('drug_name', 'Amoxicillin'),
            data.get('route', 'oral'),
            data.get('dose', 500),
            data.get('interval', 8),
            data.get('num_doses', 6),
            data.get('half_life', 1.2),
            data.get('vd', 20),
            data.get('ka', 1.5),
            data.get('bioavail', 90),
            data.get('mec', 4.0),
            data.get('mtc', 25.0)
        ))
        regimen_id = cursor.lastrowid
    return jsonify({"status": "saved", "regimen_id": regimen_id})

@app.route('/api/regimens/history', methods=['GET'])
def get_history():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute('''
            SELECT r.*, p.name as patient_name, p.weight_kg 
            FROM regimens r 
            LEFT JOIN patients p ON r.patient_id = p.id 
            ORDER BY r.id DESC LIMIT 15
        ''').fetchall()
    return jsonify([dict(r) for r in rows])

if __name__ == '__main__':
    print("Starting Pharmacokinetics Flask + SQLite Server on http://localhost:5001 ...")
    app.run(host='0.0.0.0', port=5001, debug=False)
