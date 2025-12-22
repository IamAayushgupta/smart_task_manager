// ==============================
// Feature Weights (ML-like)
// ==============================

const CATEGORY_FEATURES = {
  scheduling: {
    meeting: 2,
    schedule: 2,
    call: 1.5,
    appointment: 2,
    deadline: 1.5,
  },
  finance: {
    payment: 2,
    invoice: 2,
    bill: 1.5,
    budget: 2,
    cost: 1.5,
    expense: 1.5,
  },
  technical: {
    bug: 2,
    fix: 1.5,
    error: 2,
    install: 1.5,
    repair: 1.5,
    maintain: 1,
  },
  safety: {
    safety: 2,
    hazard: 2,
    inspection: 1.5,
    compliance: 1.5,
    ppe: 1,
  },
};

const PRIORITY_FEATURES = {
  high: {
    urgent: 2.5,
    asap: 2.5,
    immediately: 2,
    today: 2,
    critical: 2.5,
    emergency: 3,
  },
  medium: {
    soon: 1.5,
    'this week': 1.5,
    important: 1.2,
  },
};

// ==============================
// Text Preprocessing (ML-style)
// ==============================

function preprocessText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);
}

// ==============================
// Generic Scoring Engine
// ==============================

function scoreText(tokens, featureMap) {
  const scores = {};

  for (const label of Object.keys(featureMap)) {
    scores[label] = 0;

    for (const [keyword, weight] of Object.entries(featureMap[label])) {
      if (tokens.includes(keyword)) {
        scores[label] += weight;
      }
    }
  }

  return scores;
}

// ==============================
// Softmax-like Normalization
// ==============================

function normalizeScores(scores) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

  const normalized = {};
  for (const key in scores) {
    normalized[key] = +(scores[key] / total).toFixed(2);
  }

  return normalized;
}

// ==============================
// Category Prediction
// ==============================

function predictCategory(text) {
  const tokens = preprocessText(text);
  const rawScores = scoreText(tokens, CATEGORY_FEATURES);
  const probabilities = normalizeScores(rawScores);

  const bestCategory = Object.entries(rawScores).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  return {
    label: rawScores[bestCategory] > 0 ? bestCategory : 'general',
    confidence: probabilities[bestCategory] || 0,
    probabilities,
  };
}

// ==============================
// Priority Prediction
// ==============================

function predictPriority(text) {
  const tokens = preprocessText(text);
  const rawScores = scoreText(tokens, PRIORITY_FEATURES);
  const probabilities = normalizeScores(rawScores);

  const bestPriority = Object.entries(rawScores).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  return {
    label: rawScores[bestPriority] > 0 ? bestPriority : 'low',
    confidence: probabilities[bestPriority] || 0,
    probabilities,
  };
}

// ==============================
// Entity Extraction (Rule-based NLP)
// ==============================

function extractEntities(text) {
  const entities = {
    people: [],
    date: null,
    topics: [],
  };

  const lowerText = text.toLowerCase();

  if (lowerText.includes('today')) entities.date = 'today';
  else if (lowerText.includes('tomorrow')) entities.date = 'tomorrow';

  const peopleMatch = text.match(/with\s+([a-zA-Z]+)/i);
  if (peopleMatch) {
    entities.people.push(peopleMatch[1]);
  }

  const knownTopics = ['budget', 'invoice', 'report', 'deployment'];
  knownTopics.forEach(topic => {
    if (lowerText.includes(topic)) {
      entities.topics.push(topic);
    }
  });

  return entities;
}

// ==============================
// Suggested Actions
// ==============================

const SUGGESTED_ACTIONS = {
  scheduling: ['Block calendar', 'Send invite', 'Prepare agenda', 'Set reminder'],
  finance: ['Check budget', 'Get approval', 'Generate invoice', 'Update records'],
  technical: ['Diagnose issue', 'Check resources', 'Assign technician', 'Document fix'],
  safety: ['Conduct inspection', 'File report', 'Notify supervisor', 'Update checklist'],
  general: ['Review task', 'Assign owner', 'Set deadline'],
};

// ==============================
// Main ML-like Classification Function
// ==============================

export function classifyTask(description) {
  const categoryResult = predictCategory(description);
  const priorityResult = predictPriority(description);
  const extracted_entities = extractEntities(description);

  return {
    category: categoryResult.label,
    category_confidence: categoryResult.confidence,
    priority: priorityResult.label,
    priority_confidence: priorityResult.confidence,
    extracted_entities,
    suggested_actions:
      SUGGESTED_ACTIONS[categoryResult.label] || SUGGESTED_ACTIONS.general,
    explainability: {
      category_probabilities: categoryResult.probabilities,
      priority_probabilities: priorityResult.probabilities,
    },
  };
}
