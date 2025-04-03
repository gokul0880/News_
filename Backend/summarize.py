from transformers import pipeline
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize

nltk.download('punkt')
nltk.download('stopwords')

def generate_summary(text):
    # First try transformer model
    try:
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
        return summarizer(text, max_length=150, min_length=30)[0]['summary_text']
    except:
        # Fallback to NLTK
        sentences = sent_tokenize(text)
        if len(sentences) > 3:
            return ' '.join(sentences[:3])  # First 3 sentences
        return text