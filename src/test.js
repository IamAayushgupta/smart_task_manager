import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testCreateTask() {
  const response = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-DEVICE-ID': '63a7f138-2187-4d13-9d72-2f03cec3c662',
    },
    body: JSON.stringify({
      title: 'Node script test task',
      description: 'Testing create task locally using node script',
    }),
  });

  const text = await response.text();
  console.log('STATUS:', response.status);
  console.log('BODY:', text);
}

testCreateTask();
