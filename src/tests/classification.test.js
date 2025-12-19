import { classifyTask } from '../services/classification.service.js';

describe('Task Classification Engine', () => {

  test('detects scheduling category correctly', () => {
    const result = classifyTask('Schedule a meeting with client');
    expect(result.category).toBe('scheduling');
  });

  test('detects high priority correctly', () => {
    const result = classifyTask('Urgent bug fix needed today');
    expect(result.priority).toBe('high');
  });

  test('extracts people and date entities correctly', () => {
    const result = classifyTask('Meeting with team tomorrow about budget');
    expect(result.extracted_entities.people).toContain('team');
    expect(result.extracted_entities.date).toBe('tomorrow');
  });

});
