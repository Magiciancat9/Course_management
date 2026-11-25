import React from 'react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MilestoneManager, { MilestoneItem } from './MilestoneManager';

const SAMPLE_COURSES = [
  { id: 1, code: 'CPE334', name: 'Software Engineering', term: '1/2026', maxTeamSize: 3 },
];

function okJson(body: unknown, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

describe('F-04 MilestoneManager Component (S2-F04-T10)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('S2-F04-T10a: prevents duplicate save while pending, preserves typed fields on API error, and shows reload on 409 conflict', async () => {
    const existing: MilestoneItem = {
      id: 10,
      courseId: 1,
      title: 'Existing Draft',
      description: 'Original description for draft milestone.',
      dueDate: '2027-01-15T12:00:00.000Z',
      weightPercent: 20,
      status: 'DRAFT',
      publishedAt: null,
      version: 1,
    };

    let resolveSave!: (value: Response) => void;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (method === 'GET' && url === '/api/courses/1/milestones') {
        return okJson({ milestones: [existing], nextAfterId: null });
      }
      if (method === 'PUT' && url === '/api/milestones/10') {
        return new Promise<Response>((resolve) => {
          resolveSave = resolve;
        });
      }
      return okJson({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MilestoneManager
        token="instr-token"
        userRole="INSTRUCTOR"
        courses={SAMPLE_COURSES}
        sessionGeneration={1}
        getCurrentGeneration={() => 1}
        onUnauthorized={vi.fn()}
      />
    );

    expect(await screen.findByText('Existing Draft')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('milestone-edit-btn-10'));

    const titleInput = screen.getByTestId('milestone-title-input') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Preserved Typed Title' } });

    const saveBtn = screen.getByTestId('milestone-save-btn');
    fireEvent.click(saveBtn);
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveTextContent('Saving…');

    // Attempt second click while pending -> still only 1 PUT
    fireEvent.click(saveBtn);
    const putCalls = fetchMock.mock.calls.filter((c) => c[1]?.method === 'PUT');
    expect(putCalls).toHaveLength(1);

    // Resolve with 409 version conflict -> typed input preserved & reload button shown
    resolveSave(
      await okJson(
        {
          error: 'Milestone has been modified by another request. Reload and retry.',
          code: 'MILESTONE_VERSION_CONFLICT',
        },
        409
      )
    );

    expect(await screen.findByTestId('milestone-form-error')).toHaveTextContent(
      'modified by another request'
    );
    expect((screen.getByTestId('milestone-title-input') as HTMLInputElement).value).toBe(
      'Preserved Typed Title'
    );
    expect(screen.getByTestId('milestone-reload-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('milestone-reload-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('milestone-reload-btn')).not.toBeInTheDocument();
    });
  });

  it('S2-F04-T10b: renders distinct empty state and read-only published view for students', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => okJson({ milestones: [], nextAfterId: null }))
    );

    render(
      <MilestoneManager
        token="student-token"
        userRole="STUDENT"
        courses={SAMPLE_COURSES}
        sessionGeneration={1}
        getCurrentGeneration={() => 1}
        onUnauthorized={vi.fn()}
      />
    );

    expect(await screen.findByTestId('milestones-empty')).toHaveTextContent(
      'No published milestones for this course yet.'
    );
    expect(screen.queryByTestId('milestone-form')).not.toBeInTheDocument();
  });

  it('S2-F04-T10c: validates missing due date client-side without calling API', async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) =>
      okJson({ milestones: [], nextAfterId: null })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MilestoneManager
        token="instr-token"
        userRole="INSTRUCTOR"
        courses={SAMPLE_COURSES}
        sessionGeneration={1}
        getCurrentGeneration={() => 1}
        onUnauthorized={vi.fn()}
      />
    );

    await screen.findByTestId('milestones-empty');
    fireEvent.change(screen.getByTestId('milestone-title-input'), {
      target: { value: 'New Milestone' },
    });
    fireEvent.change(screen.getByTestId('milestone-desc-input'), {
      target: { value: 'Valid description for testing.' },
    });
    fireEvent.click(screen.getByTestId('milestone-save-btn'));

    expect(await screen.findByTestId('milestone-form-error')).toHaveTextContent(
      'valid due date'
    );
    const postCalls = fetchMock.mock.calls.filter((c) => c[1]?.method === 'POST');
    expect(postCalls).toHaveLength(0);
  });
});
