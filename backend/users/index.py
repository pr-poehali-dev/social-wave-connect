'''
Business: Get list of all users with online/offline status
Args: event with httpMethod, queryStringParameters
Returns: HTTP response with users list
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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'GET':
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        
        try:
            params = event.get('queryStringParameters', {}) or {}
            search = params.get('search', '')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if search:
                    cur.execute(
                        "SELECT id, username, email, avatar_url, is_online, last_seen FROM t_p78882132_social_wave_connect.users WHERE username ILIKE %s OR email ILIKE %s ORDER BY is_online DESC, username ASC",
                        (f'%{search}%', f'%{search}%')
                    )
                else:
                    cur.execute(
                        "SELECT id, username, email, avatar_url, is_online, last_seen FROM t_p78882132_social_wave_connect.users ORDER BY is_online DESC, username ASC"
                    )
                
                users = [dict(row) for row in cur.fetchall()]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'users': users}, default=serialize_datetime)
            }
        
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }