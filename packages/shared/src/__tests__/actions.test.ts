import { describe, it, expect, beforeEach } from 'vitest';
import { supported_actions, compare, execute_actions } from '../actions.js';
import type { Story } from '../types.js';

describe('compare', () => {
  it('should compare equality with =', () => {
    expect(compare('5', '=', '5')).toBe(true);
    expect(compare('hello', '=', 'hello')).toBe(true);
    expect(compare('5', '=', '6')).toBe(false);
  });

  it('should compare inequality with !=', () => {
    expect(compare('5', '!=', '6')).toBe(true);
    expect(compare('hello', '!=', 'world')).toBe(true);
    expect(compare('5', '!=', '5')).toBe(false);
  });

  it('should compare numbers with <', () => {
    expect(compare('3', '<', '5')).toBe(true);
    expect(compare('5', '<', '3')).toBe(false);
    expect(compare('5', '<', '5')).toBe(false);
  });

  it('should compare numbers with >', () => {
    expect(compare('5', '>', '3')).toBe(true);
    expect(compare('3', '>', '5')).toBe(false);
    expect(compare('5', '>', '5')).toBe(false);
  });

  it('should compare numbers with <=', () => {
    expect(compare('3', '<=', '5')).toBe(true);
    expect(compare('5', '<=', '5')).toBe(true);
    expect(compare('5', '<=', '3')).toBe(false);
  });

  it('should compare numbers with >=', () => {
    expect(compare('5', '>=', '3')).toBe(true);
    expect(compare('5', '>=', '5')).toBe(true);
    expect(compare('3', '>=', '5')).toBe(false);
  });
});

describe('SET action', () => {
  it('should set a variable', () => {
    const story: Story = {
      sections: {},
      state: { variables: {} },
    };
    supported_actions.SET.action(story, ['testVar', 'testValue']);
    expect(story.state?.variables?.['testVar']).toBe('testValue');
  });

  it('should create state and variables if missing', () => {
    const story: Story = { sections: {} };
    supported_actions.SET.action(story, ['testVar', 'testValue']);
    expect(story.state?.variables?.['testVar']).toBe('testValue');
  });

  it('should handle missing parameters gracefully', () => {
    const story: Story = { sections: {}, state: {} };
    supported_actions.SET.action(story, []);
    // Should not throw
  });
});

describe('ADD_TO_VARIABLE action', () => {
  it('should add numeric value to existing variable', () => {
    const story: Story = {
      sections: {},
      state: { variables: { count: '5' } },
    };
    supported_actions.ADD_TO_VARIABLE.action(story, ['count', '3']);
    expect(story.state?.variables?.['count']).toBe('8');
  });

  it('should treat missing variable as 0', () => {
    const story: Story = {
      sections: {},
      state: { variables: {} },
    };
    supported_actions.ADD_TO_VARIABLE.action(story, ['count', '5']);
    expect(story.state?.variables?.['count']).toBe('5');
  });
});

describe('COMPARE_DO action', () => {
  it('should execute next action when comparison succeeds', () => {
    const story: Story = {
      sections: {},
      state: { variables: { count: '5' } },
    };
    supported_actions.COMPARE_DO.action(story, [
      'count',
      '>',
      '3',
      'SET',
      'result',
      'success',
    ]);
    expect(story.state?.variables?.['result']).toBe('success');
  });

  it('should not execute next action when comparison fails', () => {
    const story: Story = {
      sections: {},
      state: { variables: { count: '2' } },
    };
    supported_actions.COMPARE_DO.action(story, [
      'count',
      '>',
      '3',
      'SET',
      'result',
      'success',
    ]);
    expect(story.state?.variables?.['result']).toBeUndefined();
  });

  it('should handle missing variable gracefully', () => {
    const story: Story = {
      sections: {},
      state: { variables: {} },
    };
    supported_actions.COMPARE_DO.action(story, [
      'missing',
      '>',
      '3',
      'SET',
      'result',
      'success',
    ]);
    expect(story.state?.variables?.['result']).toBeUndefined();
  });
});

describe('IF_SET_DO action', () => {
  it('should execute action when variable is set', () => {
    const story: Story = {
      sections: {},
      state: { variables: { flag: 'true' } },
    };
    supported_actions.IF_SET_DO.action(story, ['flag', 'SET', 'result', 'done']);
    expect(story.state?.variables?.['result']).toBe('done');
  });

  it('should not execute action when variable is not set', () => {
    const story: Story = {
      sections: {},
      state: { variables: {} },
    };
    supported_actions.IF_SET_DO.action(story, ['flag', 'SET', 'result', 'done']);
    expect(story.state?.variables?.['result']).toBeUndefined();
  });
});

describe('IF_NOT_SET_DO action', () => {
  it('should execute action when variable is not set', () => {
    const story: Story = {
      sections: {},
      state: { variables: {} },
    };
    supported_actions.IF_NOT_SET_DO.action(story, ['flag', 'SET', 'result', 'done']);
    expect(story.state?.variables?.['result']).toBe('done');
  });

  it('should not execute action when variable is set', () => {
    const story: Story = {
      sections: {},
      state: { variables: { flag: 'true' } },
    };
    supported_actions.IF_NOT_SET_DO.action(story, ['flag', 'SET', 'result', 'done']);
    expect(story.state?.variables?.['result']).toBeUndefined();
  });
});

describe('ADD_CHOICE action', () => {
  it('should add a choice to current section', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
          next: [],
        },
      },
      state: { current_section: '1' },
    };
    supported_actions.ADD_CHOICE.action(story, ['2', 'Go to section 2']);
    expect(story.sections['1'].next).toHaveLength(1);
    expect(story.sections['1'].next?.[0]?.text).toBe('Go to section 2');
    expect(story.sections['1'].next?.[0]?.next).toBe('2');
  });

  it('should create next array if missing', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
        },
      },
      state: { current_section: '1' },
    };
    supported_actions.ADD_CHOICE.action(story, ['2', 'Go to section 2']);
    expect(story.sections['1'].next).toHaveLength(1);
  });

  it('should not add duplicate choice', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
          next: [{ text: 'Go to section 2', next: '2' }],
        },
      },
      state: { current_section: '1' },
    };
    supported_actions.ADD_CHOICE.action(story, ['2', 'Go to section 2']);
    expect(story.sections['1'].next).toHaveLength(1);
  });
});

describe('REMOVE_CHOICE action', () => {
  it('should remove a choice from current section', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
          next: [
            { text: 'Go to section 2', next: '2' },
            { text: 'Go to section 3', next: '3' },
          ],
        },
      },
      state: { current_section: '1' },
    };
    supported_actions.REMOVE_CHOICE.action(story, ['2']);
    expect(story.sections['1'].next).toHaveLength(1);
    expect(story.sections['1'].next?.[0]?.next).toBe('3');
  });

  it('should handle missing choices gracefully', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
        },
      },
      state: { current_section: '1' },
    };
    supported_actions.REMOVE_CHOICE.action(story, ['2']);
    // Should not throw
  });
});

describe('IF_SET_ADD_CHOICE action', () => {
  it('should add choice when variable is set', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
          next: [],
        },
      },
      state: {
        current_section: '1',
        variables: { flag: 'true' },
      },
    };
    supported_actions.IF_SET_ADD_CHOICE.action(story, ['flag', '2', 'Secret path']);
    expect(story.sections['1'].next).toHaveLength(1);
    expect(story.sections['1'].next?.[0]?.text).toBe('Secret path');
  });

  it('should not add choice when variable is not set', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
          next: [],
        },
      },
      state: {
        current_section: '1',
        variables: {},
      },
    };
    supported_actions.IF_SET_ADD_CHOICE.action(story, ['flag', '2', 'Secret path']);
    expect(story.sections['1'].next).toHaveLength(0);
  });
});

describe('IF_SET_REMOVE_CHOICE action', () => {
  it('should remove choice when variable is set', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
          next: [
            { text: 'Go to section 2', next: '2' },
            { text: 'Go to section 3', next: '3' },
          ],
        },
      },
      state: {
        current_section: '1',
        variables: { flag: 'true' },
      },
    };
    supported_actions.IF_SET_REMOVE_CHOICE.action(story, ['flag', '2']);
    expect(story.sections['1'].next).toHaveLength(1);
    expect(story.sections['1'].next?.[0]?.next).toBe('3');
  });

  it('should not remove choice when variable is not set', () => {
    const story: Story = {
      sections: {
        '1': {
          id: '1',
          text_lines: ['Section 1'],
          next: [{ text: 'Go to section 2', next: '2' }],
        },
      },
      state: {
        current_section: '1',
        variables: {},
      },
    };
    supported_actions.IF_SET_REMOVE_CHOICE.action(story, ['flag', '2']);
    expect(story.sections['1'].next).toHaveLength(1);
  });
});

describe('execute_actions', () => {
  it('should execute multiple actions in sequence', () => {
    const story: Story = {
      sections: {},
      state: { variables: {} },
    };
    execute_actions(story, [
      { action: 'SET', parameters: ['var1', 'value1'] },
      { action: 'SET', parameters: ['var2', 'value2'] },
    ]);
    expect(story.state?.variables?.['var1']).toBe('value1');
    expect(story.state?.variables?.['var2']).toBe('value2');
  });

  it('should handle nested action chains', () => {
    const story: Story = {
      sections: {},
      state: { variables: { flag: 'true' } },
    };
    execute_actions(story, [
      {
        action: 'IF_SET_DO',
        parameters: ['flag', 'SET', 'result', 'success'],
      },
    ]);
    expect(story.state?.variables?.['result']).toBe('success');
  });

  it('should handle empty actions array', () => {
    const story: Story = {
      sections: {},
      state: {},
    };
    execute_actions(story, []);
    // Should not throw
  });
});
