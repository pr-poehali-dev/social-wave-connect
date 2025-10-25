'''
Business: User registration, login, and profile management
Args: event with httpMethod, body, queryStringParameters
Returns: HTTP response with user data or error
'''

import json
import os
import hashlib
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'register':
                username = body_data.get('username')
                email = body_data.get('email')
                password = body_data.get('password')
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "INSERT INTO t_p78882132_social_wave_connect.users (username, email, password, is_online) VALUES (%s, %s, %s, true) RETURNING id, username, email, avatar_url, is_online",
                        (username, email, password_hash)
                    )
                    user = dict(cur.fetchone())
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'user': user})
                }
            
            elif action == 'login':
                email = body_data.get('email')
                password = body_data.get('password')
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT id, username, email, avatar_url, is_online FROM t_p78882132_social_wave_connect.users WHERE email = %s AND password = %s",
                        (email, password_hash)
                    )
                    user = cur.fetchone()
                    
                    if user:
                        user_dict = dict(user)
                        cur.execute(
                            "UPDATE t_p78882132_social_wave_connect.users SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE id = %s",
                            (user_dict['id'],)
                        )
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'success': True, 'user': user_dict})
                        }
                    else:
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'success': False, 'error': 'Invalid credentials'})
                        }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            avatar_url = body_data.get('avatar_url')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "UPDATE t_p78882132_social_wave_connect.users SET avatar_url = %s WHERE id = %s RETURNING id, username, email, avatar_url, is_online",
                    (avatar_url, user_id)
                )
                user = dict(cur.fetchone())
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'user': user}, default=serialize_datetime)
            }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            user_id = params.get('user_id')
            
            if user_id:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT id, username, email, avatar_url, is_online, last_seen FROM t_p78882132_social_wave_connect.users WHERE id = %s",
                        (user_id,)
                    )
                    user = cur.fetchone()
                    
                    if user:
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'success': True, 'user': dict(user)}, default=serialize_datetime)
                        }
            
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'User not found'})
            }
    
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }