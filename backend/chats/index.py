'''
Business: Chat management - create chats, send messages, get chat history
Args: event with httpMethod, body, queryStringParameters
Returns: HTTP response with chat data
'''

import json
import os
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
            
            if action == 'create_chat':
                user1_id = body_data.get('user1_id')
                user2_id = body_data.get('user2_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "SELECT c.id FROM t_p78882132_social_wave_connect.chats c JOIN t_p78882132_social_wave_connect.chat_participants cp1 ON c.id = cp1.chat_id JOIN t_p78882132_social_wave_connect.chat_participants cp2 ON c.id = cp2.chat_id WHERE cp1.user_id = %s AND cp2.user_id = %s AND c.is_group = false",
                        (user1_id, user2_id)
                    )
                    existing_chat = cur.fetchone()
                    
                    if existing_chat:
                        chat_id = existing_chat['id']
                    else:
                        cur.execute(
                            "INSERT INTO t_p78882132_social_wave_connect.chats (is_group) VALUES (false) RETURNING id"
                        )
                        chat_id = cur.fetchone()['id']
                        
                        cur.execute(
                            "INSERT INTO t_p78882132_social_wave_connect.chat_participants (chat_id, user_id) VALUES (%s, %s), (%s, %s)",
                            (chat_id, user1_id, chat_id, user2_id)
                        )
                        conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'chat_id': chat_id})
                }
            
            elif action == 'send_message':
                chat_id = body_data.get('chat_id')
                sender_id = body_data.get('sender_id')
                content = body_data.get('content')
                image_url = body_data.get('image_url')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        "INSERT INTO t_p78882132_social_wave_connect.messages (chat_id, sender_id, content, image_url) VALUES (%s, %s, %s, %s) RETURNING id, chat_id, sender_id, content, image_url, created_at",
                        (chat_id, sender_id, content, image_url)
                    )
                    message = dict(cur.fetchone())
                    conn.commit()
                    
                    if sender_id != 1:
                        cur.execute(
                            "SELECT user_id FROM t_p78882132_social_wave_connect.chat_participants WHERE chat_id = %s AND user_id = 1",
                            (chat_id,)
                        )
                        bot_in_chat = cur.fetchone()
                        
                        if bot_in_chat:
                            cur.execute(
                                "INSERT INTO t_p78882132_social_wave_connect.messages (chat_id, sender_id, content) VALUES (%s, 1, %s)",
                                (chat_id, 'Извините, я не могу отвечать на сообщения.')
                            )
                            conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': message}, default=serialize_datetime)
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action')
            
            if action == 'get_user_chats':
                user_id = params.get('user_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT DISTINCT c.id, c.created_at,
                               u.id as other_user_id, u.username as other_username, 
                               u.avatar_url as other_avatar, u.is_online as other_is_online,
                               (SELECT content FROM t_p78882132_social_wave_connect.messages 
                                WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
                        FROM t_p78882132_social_wave_connect.chats c
                        JOIN t_p78882132_social_wave_connect.chat_participants cp ON c.id = cp.chat_id
                        JOIN t_p78882132_social_wave_connect.chat_participants cp2 ON c.id = cp2.chat_id
                        JOIN t_p78882132_social_wave_connect.users u ON cp2.user_id = u.id
                        WHERE cp.user_id = %s AND cp2.user_id != %s
                        ORDER BY c.created_at DESC
                    """, (user_id, user_id))
                    
                    chats = [dict(row) for row in cur.fetchall()]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'chats': chats}, default=serialize_datetime)
                }
            
            elif action == 'get_messages':
                chat_id = params.get('chat_id')
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT m.id, m.chat_id, m.sender_id, m.content, m.image_url, m.created_at,
                               u.username, u.avatar_url
                        FROM t_p78882132_social_wave_connect.messages m
                        JOIN t_p78882132_social_wave_connect.users u ON m.sender_id = u.id
                        WHERE m.chat_id = %s
                        ORDER BY m.created_at ASC
                    """, (chat_id,))
                    
                    messages = [dict(row) for row in cur.fetchall()]
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'messages': messages}, default=serialize_datetime)
                }
    
    finally:
        conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }