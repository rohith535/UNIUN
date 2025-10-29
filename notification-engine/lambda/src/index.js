const AWS = require('aws-sdk');

// Configure AWS SDK for LocalStack
AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localstack:4566',
  accessKeyId: 'test',
  secretAccessKey: 'test',
});

const sns = new AWS.SNS();
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event) => {
  console.log('Lambda invoked with event:', JSON.stringify(event, null, 2));

  if (!SNS_TOPIC_ARN) {
    console.error('SNS_TOPIC_ARN environment variable not set.');
    return;
  }
  console.log('SNS_TOPIC_ARN:', SNS_TOPIC_ARN);

  for (const record of event.Records) {
    console.log('Processing record:', JSON.stringify(record, null, 2));
    if (record.eventName === 'INSERT') {
      const { id, message } = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
      console.log(`Extracted message with ID: ${id} and message: ${message}`);

      const params = {
        Message: JSON.stringify({ id, message }),
        TopicArn: SNS_TOPIC_ARN,
      };

      console.log('Attempting to publish to SNS with params:', JSON.stringify(params, null, 2));

      try {
        await sns.publish(params).promise();
        console.log(`Successfully published message to SNS topic: ${params.Message}`);
      } catch (error) {
        console.error('Error publishing to SNS:', error);
      }
    }
  }
};
