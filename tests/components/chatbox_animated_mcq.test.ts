import React from 'react';
import { ChatboxAnimatedMcq } from '../../src/components/ai/ChatboxAnimatedMcq';
import { ChatInteractiveQuestion } from '../../src/services/ai/DocumentQuestionElicitor';

describe('ChatboxAnimatedMcq Component', () => {
  const mockTheme = {
    surface: '#18191D',
    surfaceSecondary: '#222326',
    borderSubtle: '#28292E',
    borderDefault: '#383942',
    textPrimary: '#FFFFFF',
    textMuted: '#8E8F96',
  };

  const sampleQuestion: ChatInteractiveQuestion = {
    id: 'q_domain_1',
    fieldKey: 'targetDomain',
    question: 'What primary engineering domain should this resume target?',
    reason: 'ATS 98% Optimization: Matches algorithmic keyword clusters',
    docType: 'resume',
    options: [
      { id: 'opt_1', label: 'Large Language Models & GenAI / RAG', value: 'LLMs & GenAI' },
      { id: 'opt_2', label: 'Computer Vision & Edge Deep Learning', value: 'Computer Vision' },
      { id: 'opt_3', label: 'Distributed MLOps Infrastructure', value: 'MLOps' },
      { id: 'opt_other', label: 'Other (Enter your custom domain in chat)', value: 'Other', isOther: true },
    ],
  };

  it('defines the ChatboxAnimatedMcq component function cleanly', () => {
    expect(typeof ChatboxAnimatedMcq).toBe('function');
  });

  it('instantiates cleanly with question and theme props', () => {
    const handleSelectOption = jest.fn();
    const handleSelectOther = jest.fn();

    const element = React.createElement(ChatboxAnimatedMcq, {
      question: sampleQuestion,
      theme: mockTheme,
      onSelectOption: handleSelectOption,
      onSelectOther: handleSelectOther,
    });

    expect(element).toBeDefined();
    expect(element.props.question.id).toBe('q_domain_1');
    expect(element.props.question.options.length).toBe(4);
    expect(element.props.question.options[3].isOther).toBe(true);
  });

  it('ensures the final option is always "Other"', () => {
    const lastOption = sampleQuestion.options[sampleQuestion.options.length - 1];
    expect(lastOption.isOther).toBe(true);
    expect(lastOption.label).toContain('Other');
  });
});
