from flask import Flask, request, jsonify
from transformers import pipeline
from bs4 import BeautifulSoup
import requests
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize
import heapq
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Initialize summarization pipeline
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

# Download NLTK data
nltk.download('punkt')
nltk.download('stopwords')

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    for script in soup(["script", "style"]):
        script.decompose()
    text = soup.get_text()
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = ' '.join(chunk for chunk in chunks if chunk)
    return text

def nltk_summarize(text, num_sentences=3):
    stop_words = set(stopwords.words("english"))
    words = word_tokenize(text)
    freq_table = {}
    
    for word in words:
        word = word.lower()
        if word not in stop_words and word.isalpha():
            if word in freq_table:
                freq_table[word] += 1
            else:
                freq_table[word] = 1
    
    sentences = sent_tokenize(text)
    sentence_scores = {}
    
    for sentence in sentences:
        for word in word_tokenize(sentence.lower()):
            if word in freq_table:
                if sentence not in sentence_scores:
                    sentence_scores[sentence] = freq_table[word]
                else:
                    sentence_scores[sentence] += freq_table[word]
    
    summary_sentences = heapq.nlargest(num_sentences, sentence_scores, key=sentence_scores.get)
    return ' '.join(summary_sentences)

@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        data = request.json
        title = data.get('title', '')
        content = data.get('content', '')
        image_url = data.get('image', '')
        
        # Use BART for summarization
        summary = summarizer(content, max_length=130, min_length=30, do_sample=False)[0]['summary_text']
        
        # Alternatively use NLTK
        # summary = nltk_summarize(content)
        
        return jsonify({
            'status': 'success',
            'title': title,
            'summary': summary,
            'image': image_url
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(host='0.0.0.0', port=5000)