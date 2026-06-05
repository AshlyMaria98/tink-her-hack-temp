import json
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)
# Initialize Flask
app = Flask(__name__)
@app.route('/')
def health_check():
    return jsonify({"status": "ok"}), 200
CORS(app, origins=[
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://tink-her-hack-temp-phi.vercel.app"
])

# Gemini Model
model = genai.GenerativeModel("gemini-2.5-flash")

def get_fallback_response(description):

    desc = description.lower()

    if any(word in desc for word in ["chat", "messaging", "whatsapp"]):
        filename = "fallback_data/chat_app.txt"

    elif any(word in desc for word in ["shop", "ecommerce", "store", "shopping"]):
        filename = "fallback_data/ecommerce_app.txt"
    elif any(word in desc for word in ["portfolio", "resume", "personal", "developer"]):
        filename = "fallback_data/portfolio_app.txt"
    elif any(word in desc for word in ["colour", "color", "drawing", "kids", "painting"]):
        filename = "fallback_data/colouring_app.txt"

    else:
        filename = "fallback_data/generic_app.txt"

    with open(filename, "r", encoding="utf-8") as file:
        content = file.read()

    return {
        "success": True,
        "fallback": True,
        "response": content
    }
@app.route('/fallback', methods=['POST'])
def fallback():

    data = request.json

    description = data.get("description", "")

    return jsonify(
        get_fallback_response(description)
    )
@app.route('/generate', methods=['POST'])
def generate_architecture():

    try:

        data = request.json

        description = data.get("description")
        scale = data.get("scale")

        # Validation
        if not description:
            return jsonify({
                "success": False,
                "error": "Project description is required"
            }), 400

        prompt = f'''
Act as a Master System Architect.

Project Description: {description}

Expected Scale: {scale}

IMPORTANT SCALING RULES:
- If scale is "Small (MVP, < 1000 users)", recommend SIMPLE and CHEAP architecture only.
- DO NOT suggest Kubernetes, Microservices, Redis, AWS ECS, Load Balancers, RabbitMQ, or Enterprise DevOps for small projects.
- For small projects prefer:
    - Monolithic backend
    - Firebase or Supabase
    - SQLite or PostgreSQL
    - Vercel or Netlify hosting
    - Simple REST APIs
    - Minimal infrastructure
- Only recommend advanced cloud architecture for Medium or Large scale.

CRITICAL OVERRIDE RULE:
If the project is identified as:
- Portfolio
- Resume site
- Landing page
- Personal blog
- Church website
- Community website
- Static informational website

IGNORE all advanced architecture recommendations.

DO NOT recommend:
- Backend frameworks (No Node, No Python, etc.)
- Databases (No SQL, No NoSQL, No Firebase/Supabase)
- Authentication
- Cloud Storage
- Microservices
- Containers
- Kubernetes
- REST APIs
- API Endpoints

Preferred stack:
- HTML/CSS/JavaScript OR React
- Netlify/Vercel/GitHub Pages

Architecture should be static hosting only. For Mermaid diagrams, keep it extremely simple (e.g., Client --> Hosting Platform).

CRITICAL GUARDRAIL INSTRUCTION:
If the description is not a valid software/app/system idea,
return ONLY:
ERROR_OUT_OF_CONTEXT

Otherwise generate STRICT MARKDOWN with these sections:

### Executive Summary

### Architecture Diagram

Provide a VALID Mermaid.js diagram.

STRICT MERMAID RULES:
- Use ONLY graph TD
- Use ONLY simple node names
- Do NOT use round brackets ()
- Do NOT use square brackets []
- Do NOT use curly braces {{}}
- Do NOT use quotes
- Do NOT use special characters
- Keep node names one word if possible
- Use extremely simple Mermaid syntax

VALID EXAMPLES:

MERMAID_START
graph TD
Client --> Vercel
MERMAID_END

If unsure, generate a VERY SIMPLE Mermaid diagram.

### 1. Architecture Style

### 2. Recommended Tech Stack

Format EXACTLY like this:

- Frontend:
  - Framework:
  - Hosting:

- Backend:
  - Platform:
  - Runtime:

- Database:
  - Type:

- AI Services:
  - Provider:

- Storage:
  - Platform:

### 3. Database Schema

### 4. Core API Endpoints

### 5. Scalability Strategy

### 6. Deployment Strategy
'''

        # Generate response from Gemini
        response = model.generate_content(prompt)

        ai_text = response.text

        # Convert fake mermaid tags into real mermaid block
        ai_text = ai_text.replace(
            "MERMAID_START",
            "```mermaid"
        ).replace(
            "MERMAID_END",
            "```"
        )

        return jsonify({
            "success": True,
            "response": ai_text
        })

    except Exception as e:

        print("ERROR:", str(e))

        # SMART FALLBACK RESPONSE
        fallback_response = get_fallback_response(description)

        return jsonify(fallback_response)

# Run Flask Server
if __name__ == '__main__':
    app.run(debug=True)