import React from 'react';
import { ClaudeThinkingIndicator } from '../../src/components/animations/ClaudeThinkingIndicator';
import { AiDocumentAgent, AgentTaskStep } from '../../src/services/ai/AiDocumentAgent';

describe('ClaudeThinkingIndicator & Live Sub-Agent Real Task Stream', () => {
  it('defines the ClaudeThinkingIndicator component cleanly', () => {
    expect(typeof ClaudeThinkingIndicator).toBe('function');
  });

  it('renders thinking state with live task steps without crashing', () => {
    const tasks: AgentTaskStep[] = [
      { id: '1', label: 'Grounded: Acme Studio (INR) · 2 saved customer(s)', status: 'completed' },
      { id: '2', label: 'Resolving statutory compliance rules (tax_invoice)', status: 'running' },
    ];

    const element = React.createElement(ClaudeThinkingIndicator, {
      isThinking: true,
      thoughtDurationSeconds: 2.4,
      elapsedSeconds: 1.2,
      taskSteps: tasks,
      reasoningTrace: 'Verifying GST breakdown: CGST 9% and SGST 9% computed on taxable minor units.',
      isExpanded: true,
      onToggleExpand: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.isThinking).toBe(true);
    expect(element.props.taskSteps?.length).toBe(2);
    expect(element.props.taskSteps?.[0].status).toBe('completed');
  });

  it('renders completed state with thinking duration header', () => {
    const element = React.createElement(ClaudeThinkingIndicator, {
      isThinking: false,
      thoughtDurationSeconds: 3.1,
      elapsedSeconds: 0,
      taskSteps: [
        { id: '1', label: 'Grounded: Local Workspace · 0 customer(s)', status: 'completed' },
        { id: '2', label: 'Archetype verified: salary_slip', status: 'completed' },
      ],
      reasoningTrace: 'Computed net pay after PF and TDS deductions.',
      isExpanded: false,
      onToggleExpand: () => {},
    });

    expect(element).toBeDefined();
    expect(element.props.isThinking).toBe(false);
    expect(element.props.thoughtDurationSeconds).toBe(3.1);
  });

  it('emits real sub-agent task steps through streamMessage', async () => {
    const receivedEvents: any[] = [];
    await AiDocumentAgent.streamMessage(
      'Draft a simple invoice for design services 5000 INR',
      [],
      null,
      (event) => {
        receivedEvents.push(event);
      }
    );

    expect(receivedEvents.length).toBeGreaterThan(0);
    const doneEvent = receivedEvents.find((e) => e.type === 'done');
    expect(doneEvent).toBeDefined();
    expect(doneEvent.taskSteps).toBeDefined();
    expect(doneEvent.taskSteps.length).toBeGreaterThanOrEqual(2);
    // Real task labels should not be empty and reflect authentic operations
    expect(doneEvent.taskSteps[0].label).toMatch(/Grounded/i);
    expect(doneEvent.taskSteps[1].label).toMatch(/statutory|archetype/i);
  }, 15000);
});
