import os
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from models import db, User, Message
from chat_request import send_openai_request

import logging
from flask import Flask, request, jsonify
from chat_request import send_openai_request_with_context
from models import db

# Set up logging
logging.basicConfig(level=logging.INFO)


class Base(DeclarativeBase):
    pass


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
db.init_app(app)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/user", methods=["POST"])
def create_user():
    username = request.json.get("username")
    if not username:
        return jsonify({"error": "Username is required"}), 400

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({
            "id": existing_user.id,
            "username": existing_user.username
        })

    new_user = User(username=username)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"id": new_user.id, "username": new_user.username})


@app.route('/api/messages', methods=['POST'])
def send_message():
    user_id = request.json.get('user_id')
    content = request.json.get('content')

    if not user_id or not content:
        return jsonify({'error': 'User ID and content are required'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Create user message
    user_message = Message(user_id=user_id, content=content, is_ai=False)
    db.session.add(user_message)
    db.session.commit()  # Commit to get the ID and timestamp

    # Generate AI response
    ai_response_content = send_openai_request(content)
    ai_message = Message(user_id=user_id,
                         content=ai_response_content,
                         is_ai=True)
    db.session.add(ai_message)
    db.session.commit()

    response_data = {
        'user_message': user_message.to_dict(),
        'ai_message': ai_message.to_dict()
    }

    app.logger.info(
        f'Response data: {response_data}')  # Log response data for debugging

    return jsonify(response_data), 200


@app.route("/api/messages/<int:user_id>", methods=["GET"])
def get_messages(user_id):
    messages = Message.query.filter_by(user_id=user_id).order_by(
        Message.timestamp).all()
    return jsonify([message.to_dict() for message in messages])


@app.route("/api/messages/<int:user_id>", methods=["DELETE"])
def clear_chat_history(user_id):
    Message.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"message": "Chat history cleared successfully"})


@app.route("/api/conversation_starters", methods=["GET"])
def get_conversation_starters():
    starters = [
        "What is your favorite color?", "Can you tell me about yourself?",
        "Where are you from?", "Do you have a dog?",
        "Who is your favorite person?"
    ]
    return jsonify(starters)


# @app.route("/api/openai_request", methods=["POST"])
# def openai_request():
#     data = request.json
#     prompt = data.get("prompt")
#     context = data.get("context")

#     if not prompt or not context:
#         return jsonify({"error": "Prompt and context are required"}), 400

#     ai_response = send_openai_request_with_context(prompt, context)
#     return jsonify({"response": ai_response})

# import logging

# # Set up logging
# logging.basicConfig(level=logging.INFO)

# @app.route("/api/openai_request", methods=["POST"])
# def openai_request():
#     data = request.json
#     prompt = data.get("prompt")
#     context = data.get("context")

#     # Add logging for debugging
#     app.logger.info(f'Received prompt: {prompt}')
#     app.logger.info(f'Received context: {context}')

#     if not prompt or not context:
#         return jsonify({"error": "Prompt and context are required"}), 400

#     ai_response = send_openai_request_with_context(prompt, context)
#     return jsonify({"response": ai_response})

# @app.route("/api/openai_request", methods=["POST"])
# def openai_request():
#     try:
#         data = request.get_json()
#         if not data:
#             raise ValueError("No JSON payload received")

#         prompt = data.get("prompt")
#         context = data.get("context")

#         # Add logging for debugging
#         app.logger.info(f'Received prompt: {prompt}')
#         app.logger.info(f'Received context: {context}')

#         if not prompt or not context:
#             return jsonify({"error": "Prompt and context are required"}), 400

#         ai_response = send_openai_request_with_context(prompt, context)
#         return jsonify({"response": ai_response})

#     except Exception as e:
#         app.logger.error(f'Error in /api/openai_request: {str(e)}')
#         return jsonify({"error": "Server error"}), 500

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)
