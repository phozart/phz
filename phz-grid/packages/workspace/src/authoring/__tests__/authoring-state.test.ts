import { describe, it, expect } from 'vitest';
import {
  initialAuthoringState,
  startCreation,
  openArtifact,
  markDirty,
  markSaved,
  setPublishStatus,
  returnHome,
  canTransitionTo,
} from '../authoring-state.js';

describe('AuthoringState', () => {
  describe('initialAuthoringState', () => {
    it('returns mode "home"', () => {
      const s = initialAuthoringState();
      expect(s.mode).toBe('home');
    });

    it('returns dirty false', () => {
      const s = initialAuthoringState();
      expect(s.dirty).toBe(false);
    });

    it('returns publishStatus "draft"', () => {
      const s = initialAuthoringState();
      expect(s.publishStatus).toBe('draft');
    });

    it('has no artifactId or artifactType', () => {
      const s = initialAuthoringState();
      expect(s.artifactId).toBeUndefined();
      expect(s.artifactType).toBeUndefined();
    });

    it('has no lastSavedAt', () => {
      const s = initialAuthoringState();
      expect(s.lastSavedAt).toBeUndefined();
    });
  });

  describe('startCreation', () => {
    it('transitions mode to "creating" for report', () => {
      const s = startCreation(initialAuthoringState(), 'report');
      expect(s.mode).toBe('creating');
      expect(s.artifactType).toBe('report');
    });

    it('transitions mode to "creating" for dashboard', () => {
      const s = startCreation(initialAuthoringState(), 'dashboard');
      expect(s.mode).toBe('creating');
      expect(s.artifactType).toBe('dashboard');
    });

    it('resets dirty flag', () => {
      const dirty = markDirty(initialAuthoringState());
      const s = startCreation(dirty, 'report');
      expect(s.dirty).toBe(false);
    });

    it('preserves other state fields', () => {
      const base = setPublishStatus(initialAuthoringState(), 'review');
      const s = startCreation(base, 'dashboard');
      expect(s.publishStatus).toBe('review');
    });
  });

  describe('openArtifact', () => {
    it('sets mode to "editing-report" for report type', () => {
      const s = openArtifact(initialAuthoringState(), 'r-1', 'report');
      expect(s.mode).toBe('editing-report');
      expect(s.artifactId).toBe('r-1');
      expect(s.artifactType).toBe('report');
    });

    it('sets mode to "editing-dashboard" for dashboard type', () => {
      const s = openArtifact(initialAuthoringState(), 'd-1', 'dashboard');
      expect(s.mode).toBe('editing-dashboard');
      expect(s.artifactId).toBe('d-1');
      expect(s.artifactType).toBe('dashboard');
    });

    it('resets dirty flag', () => {
      const dirty = markDirty(initialAuthoringState());
      const s = openArtifact(dirty, 'r-2', 'report');
      expect(s.dirty).toBe(false);
    });

    it('preserves publishStatus', () => {
      const base = setPublishStatus(initialAuthoringState(), 'published');
      const s = openArtifact(base, 'd-2', 'dashboard');
      expect(s.publishStatus).toBe('published');
    });
  });

  describe('markDirty', () => {
    it('sets dirty to true', () => {
      const s = markDirty(initialAuthoringState());
      expect(s.dirty).toBe(true);
    });

    it('is idempotent', () => {
      const s1 = markDirty(initialAuthoringState());
      const s2 = markDirty(s1);
      expect(s2.dirty).toBe(true);
    });
  });

  describe('markSaved', () => {
    it('sets dirty to false', () => {
      const dirty = markDirty(initialAuthoringState());
      const s = markSaved(dirty);
      expect(s.dirty).toBe(false);
    });

    it('sets lastSavedAt to a recent timestamp', () => {
      const before = Date.now();
      const s = markSaved(initialAuthoringState());
      const after = Date.now();
      expect(s.lastSavedAt).toBeGreaterThanOrEqual(before);
      expect(s.lastSavedAt).toBeLessThanOrEqual(after);
    });

    it('preserves other fields', () => {
      const base = openArtifact(initialAuthoringState(), 'r-1', 'report');
      const s = markSaved(markDirty(base));
      expect(s.mode).toBe('editing-report');
      expect(s.artifactId).toBe('r-1');
    });
  });

  describe('setPublishStatus', () => {
    it('updates status to review', () => {
      const s = setPublishStatus(initialAuthoringState(), 'review');
      expect(s.publishStatus).toBe('review');
    });

    it('updates status to published', () => {
      const s = setPublishStatus(initialAuthoringState(), 'published');
      expect(s.publishStatus).toBe('published');
    });

    it('updates status back to draft', () => {
      const reviewed = setPublishStatus(initialAuthoringState(), 'review');
      const s = setPublishStatus(reviewed, 'draft');
      expect(s.publishStatus).toBe('draft');
    });

    it('preserves mode and dirty', () => {
      const base = markDirty(openArtifact(initialAuthoringState(), 'd-1', 'dashboard'));
      const s = setPublishStatus(base, 'published');
      expect(s.mode).toBe('editing-dashboard');
      expect(s.dirty).toBe(true);
    });
  });

  describe('returnHome', () => {
    it('sets mode to home', () => {
      const editing = openArtifact(initialAuthoringState(), 'r-1', 'report');
      const s = returnHome(editing);
      expect(s.mode).toBe('home');
    });

    it('clears artifactId and artifactType', () => {
      const editing = openArtifact(initialAuthoringState(), 'r-1', 'report');
      const s = returnHome(editing);
      expect(s.artifactId).toBeUndefined();
      expect(s.artifactType).toBeUndefined();
    });

    it('resets dirty flag', () => {
      const dirty = markDirty(openArtifact(initialAuthoringState(), 'r-1', 'report'));
      const s = returnHome(dirty);
      expect(s.dirty).toBe(false);
    });

    it('preserves publishStatus and lastSavedAt', () => {
      let s = openArtifact(initialAuthoringState(), 'r-1', 'report');
      s = setPublishStatus(s, 'published');
      s = markSaved(s);
      const savedAt = s.lastSavedAt;
      const home = returnHome(s);
      expect(home.publishStatus).toBe('published');
      expect(home.lastSavedAt).toBe(savedAt);
    });
  });

  describe('canTransitionTo', () => {
    it('returns false when dirty and target is "home"', () => {
      const dirty = markDirty(openArtifact(initialAuthoringState(), 'r-1', 'report'));
      expect(canTransitionTo(dirty, 'home')).toBe(false);
    });

    it('returns false when dirty and target is "creating"', () => {
      const dirty = markDirty(openArtifact(initialAuthoringState(), 'd-1', 'dashboard'));
      expect(canTransitionTo(dirty, 'creating')).toBe(false);
    });

    it('returns true when not dirty and target is "home"', () => {
      const editing = openArtifact(initialAuthoringState(), 'r-1', 'report');
      expect(canTransitionTo(editing, 'home')).toBe(true);
    });

    it('returns true when not dirty and target is "creating"', () => {
      const editing = openArtifact(initialAuthoringState(), 'r-1', 'report');
      expect(canTransitionTo(editing, 'creating')).toBe(true);
    });

    it('returns false for direct home -> editing-report', () => {
      const home = initialAuthoringState();
      expect(canTransitionTo(home, 'editing-report')).toBe(false);
    });

    it('returns false for direct home -> editing-dashboard', () => {
      const home = initialAuthoringState();
      expect(canTransitionTo(home, 'editing-dashboard')).toBe(false);
    });

    it('returns true for creating -> home when clean', () => {
      const creating = startCreation(initialAuthoringState(), 'report');
      expect(canTransitionTo(creating, 'home')).toBe(true);
    });

    it('returns true for editing-report -> creating when clean', () => {
      const editing = openArtifact(initialAuthoringState(), 'r-1', 'report');
      expect(canTransitionTo(editing, 'creating')).toBe(true);
    });

    it('allows editing-report -> editing-dashboard (switching artifacts)', () => {
      const editing = openArtifact(initialAuthoringState(), 'r-1', 'report');
      expect(canTransitionTo(editing, 'editing-dashboard')).toBe(true);
    });
  });

  describe('immutability', () => {
    it('startCreation does not mutate original state', () => {
      const original = initialAuthoringState();
      const frozen = { ...original };
      startCreation(original, 'report');
      expect(original).toEqual(frozen);
    });

    it('openArtifact does not mutate original state', () => {
      const original = initialAuthoringState();
      const frozen = { ...original };
      openArtifact(original, 'r-1', 'report');
      expect(original).toEqual(frozen);
    });

    it('markDirty does not mutate original state', () => {
      const original = initialAuthoringState();
      const frozen = { ...original };
      markDirty(original);
      expect(original).toEqual(frozen);
    });

    it('markSaved does not mutate original state', () => {
      const original = markDirty(initialAuthoringState());
      const frozen = { ...original };
      markSaved(original);
      expect(original).toEqual(frozen);
    });

    it('setPublishStatus does not mutate original state', () => {
      const original = initialAuthoringState();
      const frozen = { ...original };
      setPublishStatus(original, 'published');
      expect(original).toEqual(frozen);
    });

    it('returnHome does not mutate original state', () => {
      const original = openArtifact(initialAuthoringState(), 'r-1', 'report');
      const frozen = { ...original };
      returnHome(original);
      expect(original).toEqual(frozen);
    });

    it('each transition returns a new object reference', () => {
      const s0 = initialAuthoringState();
      const s1 = startCreation(s0, 'report');
      const s2 = markDirty(s1);
      const s3 = markSaved(s2);
      const s4 = returnHome(s3);
      expect(s0).not.toBe(s1);
      expect(s1).not.toBe(s2);
      expect(s2).not.toBe(s3);
      expect(s3).not.toBe(s4);
    });
  });
});
