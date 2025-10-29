import json
import os
import requests

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:4000")

def handler(event, context):
    for record in event['Records']:
        if record['eventName'] == 'INSERT':
            new_image = record['dynamodb']['NewImage']
            notification = {
                'userId': new_image['userId']['S'],
                'createdAt': new_image['createdAt']['N'],
                'notificationId': new_image['notificationId']['S'],
                'type': new_image['type']['S'],
                'fromUserId': new_image['fromUserId']['S'],
                'postId': new_image.get('postId', {}).get('S'),
                'likeCount': new_image.get('likeCount', {}).get('N'),
                'read': new_image['read']['BOOL']
            }

            try:
                requests.post(f"{BACKEND_URL}/api/internal/broadcast", json=notification)
            except Exception as e:
                print(f"Error sending notification to backend: {e}")

    return {
        'statusCode': 200,
        'body': json.dumps('Success')
    }
