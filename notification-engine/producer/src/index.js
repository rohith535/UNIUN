const express = require('express');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const port = 3000;
const DYNAMODB_TABLE = 'notifications';

// Configure AWS SDK for LocalStack
AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localstack:4566',
  accessKeyId: 'test',
  secretAccessKey: 'test',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

app.post('/notifications', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const newId = uuidv4();
  const params = {
    TableName: DYNAMODB_TABLE,
    Item: {
      id: newId,
      message,
      createdAt: new Date().toISOString(),
    },
  };

  console.log('Attempting to create notification with params:', JSON.stringify(params, null, 2));

  try {
    await dynamodb.put(params).promise();
    console.log('Successfully created notification with ID:', newId);
    res.status(201).json({ id: newId, message: 'Notification created' });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Could not create notification' });
  }
});

app.listen(port, () => {
  console.log(`Producer service running at http://localhost:${port}`);
});
