import os
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from models import db, User, Message
from chat_request import send_openai_request

# Ensure OpenAI API key is set
if not os.environ.get("OPENAI_API_KEY"):
    raise ValueError("OPENAI_API_KEY environment variable is not set")

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
    print("Received POST request to /api/messages")
    user_id = request.json.get('user_id')
    content = request.json.get('content')

    print(f"Received data: user_id={user_id}, content={content}")

    if not user_id or not content:
        print("Error: User ID and content are required")
        return jsonify({'error': 'User ID and content are required'}), 400

    user = User.query.get(user_id)
    if not user:
        print(f"Error: User not found for user_id={user_id}")
        return jsonify({'error': 'User not found'}), 404

    user_message = Message(user_id=user_id, content=content, is_ai=False)
    db.session.add(user_message)
    db.session.commit()

    try:
        ai_response_content = send_openai_request(content)
        ai_message = Message(user_id=user_id, content=ai_response_content, is_ai=True)
        db.session.add(ai_message)
        db.session.commit()

        print("Messages saved successfully")
        return jsonify({
            'user_message': user_message.to_dict(),
            'ai_message': ai_message.to_dict()
        }), 200
    except Exception as e:
        print(f"Error in send_openai_request: {str(e)}")
        return jsonify({'error': 'An error occurred while processing the message'}), 500

@app.route("/api/messages/<int:user_id>", methods=["GET"])
def get_messages(user_id):
    messages = Message.query.filter_by(user_id=user_id).order_by(Message.timestamp).all()
    return jsonify([message.to_dict() for message in messages])

@app.route("/api/messages/<int:user_id>", methods=["DELETE"])
def clear_chat_history(user_id):
    Message.query.filter_by(user_id=user_id).delete()
    db.session.commit()
    return jsonify({"message": "Chat history cleared successfully"})

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000)
