import { Router } from 'express';
import { authMiddleware } from '../utils/auth';
import AWS from 'aws-sdk';

const router = Router();

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

router.get('/', authMiddleware, async (req: any, res) => {
  const userId = String(req.user.sub);

  const params = {
    TableName: 'Notifications',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId,
    },
    ScanIndexForward: false, // Sort by createdAt descending
  };

  try {
    const data = await dynamodb.query(params).promise();
    res.json(data.Items);
  } catch (error) {
    console.error('Error fetching notifications from DynamoDB:', error);
    res.status(500).json({ error: 'Could not fetch notifications' });
  }
});

export default router;
