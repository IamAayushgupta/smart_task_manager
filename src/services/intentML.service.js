const INTENT_ML_URL = process.env.INTENT_ML_URL;

export async function extractIntentML(text) {
  const response = await fetch(`${INTENT_ML_URL}/extract-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('ML service failed');
  }

  return response.json();
}
