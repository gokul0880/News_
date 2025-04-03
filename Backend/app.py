from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from summarize import generate_summary
import subprocess
import os

app = Flask(__name__)
CORS(app)

# Language and summarization endpoints
@app.route('/api/summarize', methods=['POST'])
def summarize():
    data = request.json
    text = data.get('text')
    mode = data.get('mode', 'short')  # 'short' or 'full'
    
    if mode == 'short':
        summary = generate_summary(text)
        return jsonify({'summary': summary})
    else:
        return jsonify({'full_text': text})

@app.route('/api/set-language', methods=['POST'])
def set_language():
    data = request.json
    language = data.get('language', 'ta')  # 'ta' or 'en'
    # In a real app, store in session/database
    return jsonify({'status': 'success', 'language': language})

if __name__ == '__main__':
    app.run(debug=True, port=5000)