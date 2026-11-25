import React from 'react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MilestoneManager, {
  MilestoneItem,
  formatDateWithTimezone,
} from './MilestoneManager';

const SAMPLE_COURSES = [
  { id: 1, code: 'CPE334', name: 'Software Engineering', term: '1/2026', maxTeamSize: 3 },
];

const TWO_COURSES = [
  { id: 1, code: 'CPE334', name: 'Software Engineering', term: '1/2026', maxTeamSize: 3 },
  { id: 2, code: 'CPE335', name: 'Software Architecture', term: '1/2026', maxTeamSize: 3 },
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

  it('S2-F04-T10a: prevents duplicate save while pending, preserves typed fields on 409, and updates expectedVersion on Reload latest', async () => {
    const v1: MilestoneItem = {
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
    const v2: MilestoneItem = { ...v1, version: 2, title: 'Server Updated Title' };

    let getCount = 0;
    let putCount = 0;
    let resolveFirstSave!: (value: Response) => void;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (method === 'GET' && url === '/api/courses/1/milestones') {
        getCount += 1;
        return okJson({
          milestones: [getCount === 1 ? v1 : v2],
          nextAfterId: null,
        });
      }
      if (method === 'PUT' && url === '/api/milestones/10') {
        putCount += 1;
        if (putCount === 1) {
          return new Promise<Response>((resolve) => {
            resolveFirstSave = resolve;
          });
        }
        const parsedBody = JSON.parse(String(init?.body || '{}'));
        expect(parsedBody.expectedVersion).toBe(2);
        expect(parsedBody.title).toBe('Preserved Typed Title');
        return okJson({ milestone: { ...v2, title: 'Preserved Typed Title', version: 3 } });
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

    fireEvent.click(saveBtn);
    expect(putCount).toBe(1);

    resolveFirstSave(
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

    fireEvent.click(screen.getByTestId('milestone-reload-btn'));
    expect(await screen.findByTestId('milestone-form-success')).toHaveTextContent(
      'Reloaded latest version (v2)'
    );
    expect((screen.getByTestId('milestone-title-input') as HTMLInputElement).value).toBe(
      'Preserved Typed Title'
    );
    expect(screen.getByText('Edit Milestone (v2)')).toBeInTheDocument();

    // Resaving now uses expectedVersion=2 and succeeds
    fireEvent.click(screen.getByTestId('milestone-save-btn'));
    expect(await screen.findByTestId('milestone-form-success')).toHaveTextContent(
      'Milestone updated.'
    );
    expect(putCount).toBe(2);
  });

  it('S2-F04-T10b: renders distinct empty state and read-only published view for students', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, _init?: RequestInit) =>
        okJson({ milestones: [], nextAfterId: null })
      )
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

  it('S2-F04-T10d: disables course switching while a mutation is pending', async () => {
    let resolvePost!: (value: Response) => void;
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if ((init?.method || 'GET') === 'GET') {
        return okJson({ milestones: [], nextAfterId: null });
      }
      if (init?.method === 'POST' && url === '/api/courses/1/milestones') {
        return new Promise<Response>((resolve) => {
          resolvePost = resolve;
        });
      }
      return okJson({});
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <MilestoneManager
        token="instr-token"
        userRole="INSTRUCTOR"
        courses={TWO_COURSES}
        sessionGeneration={1}
        getCurrentGeneration={() => 1}
        onUnauthorized={vi.fn()}
      />
    );

    await screen.findByTestId('milestones-empty');
    const courseSelect = screen.getByTestId('milestone-course-select');
    expect(courseSelect).not.toBeDisabled();

    fireEvent.change(screen.getByTestId('milestone-title-input'), {
      target: { value: 'Course 1 Draft' },
    });
    fireEvent.change(screen.getByTestId('milestone-due-input'), {
      target: { value: '2027-05-01T12:00' },
    });
    fireEvent.change(screen.getByTestId('milestone-desc-input'), {
      target: { value: 'Valid description for testing.' },
    });
    fireEvent.click(screen.getByTestId('milestone-save-btn'));

    expect(courseSelect).toBeDisabled();

    resolvePost(
      await okJson(
        {
          milestone: {
            id: 1,
            courseId: 1,
            title: 'Course 1 Draft',
            description: 'Valid description for testing.',
            dueDate: '2027-05-01T05:00:00.000Z',
            weightPercent: 20,
            status: 'DRAFT',
            publishedAt: null,
            version: 1,
          },
        },
        201
      )
    );

    await waitFor(() => {
      expect(courseSelect).not.toBeDisabled();
    });
  });

  it('S2-F04-T10e: loads subsequent pages using nextAfterId cursor pagination', async () => {
    const page1Item: MilestoneItem = {
      id: 50,
      courseId: 1,
      title: 'Page 1 Milestone',
      description: 'First page milestone item.',
      dueDate: '2027-05-01T12:00:00.000Z',
      weightPercent: 10,
      status: 'DRAFT',
      publishedAt: null,
      version: 1,
    };
    const page2Item: MilestoneItem = {
      id: 51,
      courseId: 1,
      title: 'Page 2 Milestone',
      description: 'Second page milestone item.',
      dueDate: '2027-05-02T12:00:00.000Z',
      weightPercent: 20,
      status: 'PUBLISHED',
      publishedAt: '2026-11-25T00:00:00.000Z',
      version: 2,
    };

    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/courses/1/milestones') {
        return okJson({ milestones: [page1Item], nextAfterId: 50 });
      }
      if (url === '/api/courses/1/milestones?afterId=50') {
        return okJson({ milestones: [page2Item], nextAfterId: null });
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

    expect(await screen.findByText('Page 1 Milestone')).toBeInTheDocument();
    const loadMoreBtn = screen.getByTestId('milestone-load-more-btn');
    fireEvent.click(loadMoreBtn);

    expect(await screen.findByText('Page 2 Milestone')).toBeInTheDocument();
    expect(screen.getByText('Page 1 Milestone')).toBeInTheDocument();
    expect(screen.queryByTestId('milestone-load-more-btn')).not.toBeInTheDocument();
  });

  it('S2-F04-T10f: formats deadlines explicitly in Asia/Bangkok without throwing or falling back to UTC ISO', () => {
    const formatted = formatDateWithTimezone('2026-11-29T16:59:00.000Z');
    expect(formatted).toContain('Asia/Bangkok');
    expect(formatted).toContain('29 Nov 2026');
    expect(formatted).toContain('23:59');
    expect(formatted).not.toContain('T16:59:00.000Z');
  });
});
