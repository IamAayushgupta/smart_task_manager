// ==============================
// Keyword Maps
// ==============================

const CATEGORY_KEYWORDS = {
  scheduling: ['meeting', 'schedule', 'call', 'appointment', 'deadline'],
  finance: ['payment', 'invoice', 'bill', 'budget', 'cost', 'expense'],
  technical: ['bug', 'fix', 'error', 'install', 'repair', 'maintain'],
  safety: ['safety', 'hazard', 'inspection', 'compliance', 'ppe'],
};

const PRIORITY_KEYWORDS = {
  high: ['urgent', 'asap', 'immediately', 'today', 'critical', 'emergency'],
  medium: ['soon', 'this week', 'important'],
};

const SUGGESTED_ACTIONS = {
  scheduling: ['Block calendar', 'Send invite', 'Prepare agenda', 'Set reminder'],
  finance: ['Check budget', 'Get approval', 'Generate invoice', 'Update records'],
  technical: ['Diagnose issue', 'Check resources', 'Assign technician', 'Document fix'],
  safety: ['Conduct inspection', 'File report', 'Notify supervisor', 'Update checklist'],
  general: ['Review task', 'Assign owner', 'Set deadline'],
};

// ==============================
// Category Detection
// ==============================

function detectCategory(text) {
  const lowerText = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

// ==============================
// Priority Detection
// ==============================

function detectPriority(text) {
  const lowerText = text.toLowerCase();

  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return priority;
    }
  }

  return 'low';
}

// ==============================
// Entity Extraction
// ==============================

function extractEntities(text) {
  const entities = {
    people: [],
    date: null,
    topics: [],
  };

  const lowerText = text.toLowerCase();

  // Date detection
  if (lowerText.includes('today')) entities.date = 'today';
  else if (lowerText.includes('tomorrow')) entities.date = 'tomorrow';

  // People detection (simple regex)
  const peopleMatch = text.match(/with\s+(\w+)/i);
  if (peopleMatch) {
    entities.people.push(peopleMatch[1].trim());
  }

  // Topic detection
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

function generateSuggestedActions(category) {
  return SUGGESTED_ACTIONS[category] || SUGGESTED_ACTIONS.general;
}

// ==============================
// Main Classification Function
// ==============================

export function classifyTask(description) {
  const category = detectCategory(description);
  const priority = detectPriority(description);
  const extracted_entities = extractEntities(description);
  const suggested_actions = generateSuggestedActions(category);

  return {
    category,
    priority,
    extracted_entities,
    suggested_actions,
  };
}

