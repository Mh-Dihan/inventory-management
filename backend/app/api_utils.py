from flask import jsonify
from sqlalchemy.exc import IntegrityError


def error_response(message, status_code):
    return jsonify({"message": message}), status_code


def commit_or_409(message):
    from .database import db

    try:
        db.session.commit()
        return None
    except IntegrityError:
        db.session.rollback()
        return error_response(message, 409)
