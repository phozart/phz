import { describe, it, expect } from 'vitest';
import {
  initialPublishState,
  canTransition,
  submitForReview,
  approve,
  reject,
  unpublish,
} from '../publish-workflow.js';
import type { PublishState } from '../publish-workflow.js';

describe('PublishWorkflow', () => {
  describe('initialPublishState', () => {
    it('returns status "draft"', () => {
      const s = initialPublishState();
      expect(s.status).toBe('draft');
    });

    it('returns empty history array', () => {
      const s = initialPublishState();
      expect(s.history).toEqual([]);
    });
  });

  describe('canTransition', () => {
    it('allows draft -> review', () => {
      expect(canTransition({ status: 'draft', history: [] }, 'review')).toBe(true);
    });

    it('disallows draft -> published (must go through review)', () => {
      expect(canTransition({ status: 'draft', history: [] }, 'published')).toBe(false);
    });

    it('disallows draft -> draft (no-op)', () => {
      expect(canTransition({ status: 'draft', history: [] }, 'draft')).toBe(false);
    });

    it('allows review -> published', () => {
      expect(canTransition({ status: 'review', history: [] }, 'published')).toBe(true);
    });

    it('allows review -> draft (reject)', () => {
      expect(canTransition({ status: 'review', history: [] }, 'draft')).toBe(true);
    });

    it('disallows review -> review (no-op)', () => {
      expect(canTransition({ status: 'review', history: [] }, 'review')).toBe(false);
    });

    it('allows published -> draft (unpublish)', () => {
      expect(canTransition({ status: 'published', history: [] }, 'draft')).toBe(true);
    });

    it('disallows published -> review', () => {
      expect(canTransition({ status: 'published', history: [] }, 'review')).toBe(false);
    });

    it('disallows published -> published (no-op)', () => {
      expect(canTransition({ status: 'published', history: [] }, 'published')).toBe(false);
    });
  });

  describe('submitForReview', () => {
    it('transitions draft -> review', () => {
      const s = submitForReview(initialPublishState(), 'alice');
      expect(s.status).toBe('review');
    });

    it('records history entry', () => {
      const s = submitForReview(initialPublishState(), 'alice');
      expect(s.history).toHaveLength(1);
      expect(s.history[0].from).toBe('draft');
      expect(s.history[0].to).toBe('review');
      expect(s.history[0].by).toBe('alice');
    });

    it('sets a timestamp on the history entry', () => {
      const before = Date.now();
      const s = submitForReview(initialPublishState());
      const after = Date.now();
      expect(s.history[0].at).toBeGreaterThanOrEqual(before);
      expect(s.history[0].at).toBeLessThanOrEqual(after);
    });

    it('is a no-op from review state', () => {
      const reviewed = submitForReview(initialPublishState());
      const s = submitForReview(reviewed);
      expect(s.status).toBe('review');
      expect(s.history).toHaveLength(1); // no new entry
      expect(s).toBe(reviewed); // same reference — invalid transition returns same state
    });

    it('is a no-op from published state', () => {
      let s = submitForReview(initialPublishState());
      s = approve(s);
      const published = s;
      const result = submitForReview(published);
      expect(result).toBe(published);
    });
  });

  describe('approve', () => {
    it('transitions review -> published', () => {
      const reviewed = submitForReview(initialPublishState());
      const s = approve(reviewed, 'bob');
      expect(s.status).toBe('published');
    });

    it('records history entry with by field', () => {
      const reviewed = submitForReview(initialPublishState(), 'alice');
      const s = approve(reviewed, 'bob');
      expect(s.history).toHaveLength(2);
      expect(s.history[1].from).toBe('review');
      expect(s.history[1].to).toBe('published');
      expect(s.history[1].by).toBe('bob');
    });

    it('is a no-op from draft state', () => {
      const draft = initialPublishState();
      const s = approve(draft);
      expect(s).toBe(draft);
      expect(s.status).toBe('draft');
    });

    it('is a no-op from published state', () => {
      const reviewed = submitForReview(initialPublishState());
      const published = approve(reviewed);
      const s = approve(published);
      expect(s).toBe(published);
    });
  });

  describe('reject', () => {
    it('transitions review -> draft', () => {
      const reviewed = submitForReview(initialPublishState());
      const s = reject(reviewed, 'carol');
      expect(s.status).toBe('draft');
    });

    it('records history entry', () => {
      const reviewed = submitForReview(initialPublishState());
      const s = reject(reviewed, 'carol');
      expect(s.history).toHaveLength(2);
      expect(s.history[1].from).toBe('review');
      expect(s.history[1].to).toBe('draft');
      expect(s.history[1].by).toBe('carol');
    });

    it('is a no-op from draft state', () => {
      const draft = initialPublishState();
      const s = reject(draft);
      expect(s).toBe(draft);
    });

    it('from published state transitions to draft (published -> draft is valid)', () => {
      const reviewed = submitForReview(initialPublishState());
      const published = approve(reviewed);
      const s = reject(published);
      // reject calls transition(state, 'draft') — published -> draft is valid
      expect(s.status).toBe('draft');
      expect(s.history).toHaveLength(3);
      expect(s.history[2]).toMatchObject({ from: 'published', to: 'draft' });
    });
  });

  describe('unpublish', () => {
    it('transitions published -> draft', () => {
      let s = submitForReview(initialPublishState());
      s = approve(s);
      const result = unpublish(s, 'dave');
      expect(result.status).toBe('draft');
    });

    it('records history entry', () => {
      let s = submitForReview(initialPublishState());
      s = approve(s);
      const result = unpublish(s, 'dave');
      expect(result.history).toHaveLength(3);
      expect(result.history[2].from).toBe('published');
      expect(result.history[2].to).toBe('draft');
      expect(result.history[2].by).toBe('dave');
    });

    it('is a no-op from draft state', () => {
      const draft = initialPublishState();
      const s = unpublish(draft);
      expect(s).toBe(draft);
    });

    it('from review state transitions to draft (review -> draft is valid)', () => {
      const reviewed = submitForReview(initialPublishState());
      const s = unpublish(reviewed);
      // unpublish calls transition(state, 'draft') — review -> draft is valid
      expect(s.status).toBe('draft');
      expect(s.history).toHaveLength(2);
      expect(s.history[1]).toMatchObject({ from: 'review', to: 'draft' });
    });
  });

  describe('history accumulation', () => {
    it('accumulates entries through a full lifecycle', () => {
      let s: PublishState = initialPublishState();
      s = submitForReview(s, 'alice');    // draft -> review
      s = reject(s, 'bob');               // review -> draft
      s = submitForReview(s, 'alice');    // draft -> review (resubmit)
      s = approve(s, 'carol');            // review -> published
      s = unpublish(s, 'dave');           // published -> draft

      expect(s.history).toHaveLength(5);

      expect(s.history[0]).toMatchObject({ from: 'draft', to: 'review', by: 'alice' });
      expect(s.history[1]).toMatchObject({ from: 'review', to: 'draft', by: 'bob' });
      expect(s.history[2]).toMatchObject({ from: 'draft', to: 'review', by: 'alice' });
      expect(s.history[3]).toMatchObject({ from: 'review', to: 'published', by: 'carol' });
      expect(s.history[4]).toMatchObject({ from: 'published', to: 'draft', by: 'dave' });
    });

    it('each entry has an ascending timestamp', () => {
      let s: PublishState = initialPublishState();
      s = submitForReview(s);
      s = approve(s);
      s = unpublish(s);

      for (let i = 1; i < s.history.length; i++) {
        expect(s.history[i].at).toBeGreaterThanOrEqual(s.history[i - 1].at);
      }
    });

    it('by field is undefined when not provided', () => {
      let s = submitForReview(initialPublishState());
      expect(s.history[0].by).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('submitForReview does not mutate original state', () => {
      const original = initialPublishState();
      const frozen = { ...original, history: [...original.history] };
      submitForReview(original);
      expect(original.status).toBe(frozen.status);
      expect(original.history).toEqual(frozen.history);
    });

    it('approve does not mutate original state', () => {
      const original = submitForReview(initialPublishState());
      const frozenHistory = [...original.history];
      approve(original);
      expect(original.status).toBe('review');
      expect(original.history).toEqual(frozenHistory);
    });

    it('reject does not mutate original state', () => {
      const original = submitForReview(initialPublishState());
      const frozenHistory = [...original.history];
      reject(original);
      expect(original.status).toBe('review');
      expect(original.history).toEqual(frozenHistory);
    });

    it('unpublish does not mutate original state', () => {
      let s = submitForReview(initialPublishState());
      const original = approve(s);
      const frozenHistory = [...original.history];
      unpublish(original);
      expect(original.status).toBe('published');
      expect(original.history).toEqual(frozenHistory);
    });

    it('history arrays are new references on each transition', () => {
      const s0 = initialPublishState();
      const s1 = submitForReview(s0);
      const s2 = approve(s1);
      expect(s0.history).not.toBe(s1.history);
      expect(s1.history).not.toBe(s2.history);
    });
  });
});
