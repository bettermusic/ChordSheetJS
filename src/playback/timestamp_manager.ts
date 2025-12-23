/* eslint-disable max-classes-per-file */
import { formatTimestamp } from '../utilities/timestamp_parser';

declare const document: any;
declare type HTMLElement = any;

/**
 * Represents a timestamp entry with element reference
 */
export interface TimestampEntry {
  timestamp: number; // Seconds
  element: HTMLElement; // The DOM element with data-timestamp
  formattedTime: string; // Human readable "1:23"
  repeatIndex: number; // Which occurrence (0, 1, 2...) for repeating sections
  totalRepeats: number; // Total number of times this element appears
}

/**
 * Configuration options for TimestampManager
 */
export interface TimestampManagerOptions {
  // Scrolling
  autoScroll?: boolean; // Default: false
  scrollBehavior?: 'smooth' | 'instant'; // Default: 'smooth'
  scrollOffset?: number; // Pixels from top, default: 0
  scrollContainer?: HTMLElement; // Default: finds scrollable parent
  scrollThreshold?: number; // Pixels from bottom - only scroll when element exits safe zone

  // Highlighting
  activeClass?: string; // CSS class for active element (default: 'active')
  highlightClass?: string; // Alias for activeClass for clarity

  // Timing
  lookAheadMs?: number; // Pre-scroll before timestamp, default: 0
}

type EventCallback = (...args: any[]) => void;

/**
 * Manages timestamp synchronization and scrolling for audio-synced chord sheets
 */
export class TimestampManager {
  private container: HTMLElement;

  private options: TimestampManagerOptions;

  private entries: TimestampEntry[] = [];

  private currentTime = 0;

  private currentEntry: TimestampEntry | null = null;

  private eventHandlers = new Map<string, Set<EventCallback>>();

  private scrollContainer: HTMLElement | null = null;

  constructor(container: HTMLElement, options: TimestampManagerOptions = {}) {
    this.container = container;
    this.options = {
      autoScroll: false,
      scrollBehavior: 'smooth',
      scrollOffset: 0,
      lookAheadMs: 0,
      activeClass: options.highlightClass || options.activeClass || 'active',
      ...options,
    };

    this.initialize();
  }

  /**
   * Initialize the manager by scanning for timestamps
   */
  private initialize(): void {
    this.scanTimestamps();
    this.findScrollContainer();
  }

  /**
   * Scan the container for all elements with data-timestamp attributes
   */
  private scanTimestamps(): void {
    this.entries = [];
    const elements = this.container.querySelectorAll('[data-timestamp]');

    elements.forEach((element: HTMLElement) => {
      const timestampAttr = element.dataset.timestamp;
      if (!timestampAttr) return;

      const timestamps = timestampAttr.split('|').map(parseFloat).filter((t) => !Number.isNaN(t));

      timestamps.forEach((ts, index) => {
        this.entries.push({
          timestamp: ts,
          element,
          formattedTime: formatTimestamp(ts),
          repeatIndex: index,
          totalRepeats: timestamps.length,
        });
      });
    });

    // Sort entries by timestamp for binary search
    this.entries.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Find the scrollable container
   */
  private findScrollContainer(): void {
    if (this.options.scrollContainer) {
      this.scrollContainer = this.options.scrollContainer;
      return;
    }

    // Find nearest scrollable ancestor
    let el = this.container;
    while (el && el !== document.body) {
      const { overflowY } = window.getComputedStyle(el);
      if (overflowY === 'scroll' || overflowY === 'auto') {
        this.scrollContainer = el;
        return;
      }
      el = el.parentElement;
    }

    // Default to window
    this.scrollContainer = document.documentElement || document.body;
  }

  /**
   * Set the current time and update the active entry
   * @param seconds The actual playback time in seconds
   */
  setCurrentTime(seconds: number): void {
    this.currentTime = seconds;

    // Apply look-ahead for entry detection (triggers scroll/highlight early)
    const adjustedTime = seconds + (this.options.lookAheadMs || 0) / 1000;
    const newEntry = this.findEntryAtTime(adjustedTime);

    if (newEntry !== this.currentEntry) {
      this.updateActiveEntry(newEntry);
    }
  }

  /**
   * Update the active entry and trigger related events
   */
  private updateActiveEntry(newEntry: TimestampEntry | null): void {
    const previousEntry = this.currentEntry;
    this.currentEntry = newEntry;

    this.updateActiveClass(previousEntry, newEntry);
    this.emit('entryChange', newEntry, previousEntry);

    if (this.options.autoScroll && newEntry && this.shouldScroll(newEntry)) {
      this.scrollToEntry(newEntry);
      this.emit('scroll', newEntry);
    }
  }

  /**
   * Check if we should scroll to the entry based on its position in the viewport.
   * When scrollThreshold is set, only scrolls if the element is outside the "safe zone"
   * (above scrollOffset from top, or below scrollThreshold from bottom).
   */
  private shouldScroll(entry: TimestampEntry): boolean {
    // No threshold set = always scroll (original behavior)
    if (this.options.scrollThreshold === undefined || !this.scrollContainer) {
      return true;
    }

    const containerRect = this.scrollContainer.getBoundingClientRect();
    const elementRect = entry.element.getBoundingClientRect();

    const topBoundary = containerRect.top + (this.options.scrollOffset || 0);
    const bottomBoundary = containerRect.bottom - this.options.scrollThreshold;

    // Scroll if element is outside the safe zone (above top or below bottom)
    return elementRect.top < topBoundary || elementRect.top > bottomBoundary;
  }

  /**
   * Update the active class on elements
   */
  private updateActiveClass(previousEntry: TimestampEntry | null, newEntry: TimestampEntry | null): void {
    if (previousEntry && this.options.activeClass) {
      previousEntry.element.classList.remove(this.options.activeClass);
    }

    if (newEntry && this.options.activeClass) {
      newEntry.element.classList.add(this.options.activeClass);
    }
  }

  /**
   * Get the current time
   */
  getCurrentTime(): number {
    return this.currentTime;
  }

  /**
   * Get the current entry
   */
  getCurrentEntry(): TimestampEntry | null {
    return this.currentEntry;
  }

  /**
   * Get all timestamp entries
   */
  getTimestamps(): TimestampEntry[] {
    return [...this.entries];
  }

  /**
   * Find the entry at a specific time using binary search
   */
  getEntryAtTime(seconds: number): TimestampEntry | null {
    return this.findEntryAtTime(seconds);
  }

  /**
   * Get the next entry after the current one
   */
  getNextEntry(): TimestampEntry | null {
    if (!this.currentEntry) {
      return this.entries.length > 0 ? this.entries[0] : null;
    }

    const currentIndex = this.entries.indexOf(this.currentEntry);
    if (currentIndex >= 0 && currentIndex < this.entries.length - 1) {
      return this.entries[currentIndex + 1];
    }

    return null;
  }

  /**
   * Get the previous entry before the current one
   */
  getPreviousEntry(): TimestampEntry | null {
    if (!this.currentEntry) {
      return null;
    }

    const currentIndex = this.entries.indexOf(this.currentEntry);
    if (currentIndex > 0) {
      return this.entries[currentIndex - 1];
    }

    return null;
  }

  /**
   * Get all entries for a specific element
   */
  getEntriesForElement(element: HTMLElement): TimestampEntry[] {
    return this.entries.filter((entry) => entry.element === element);
  }

  /**
   * Scroll to a specific time
   */
  scrollToTime(seconds: number): void {
    const entry = this.findEntryAtTime(seconds);
    if (entry) {
      this.scrollToEntry(entry);
    }
  }

  /**
   * Scroll to a specific entry
   */
  scrollToEntry(entry: TimestampEntry): void {
    if (!this.scrollContainer) return;

    const { element } = entry;
    const containerRect = this.scrollContainer.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const scrollTop = (
      this.scrollContainer === document.documentElement || this.scrollContainer === document.body
    ) ?
      window.pageYOffset || document.documentElement.scrollTop :
      this.scrollContainer.scrollTop;

    const targetPosition = elementRect.top + scrollTop - containerRect.top - (this.options.scrollOffset || 0);

    if (this.scrollContainer === document.documentElement || this.scrollContainer === document.body) {
      window.scrollTo({
        top: targetPosition,
        behavior: this.options.scrollBehavior || 'smooth',
      });
    } else {
      this.scrollContainer.scrollTo({
        top: targetPosition,
        behavior: this.options.scrollBehavior || 'smooth',
      });
    }
  }

  /**
   * Register a callback for entry changes
   */
  onEntryChange(callback: (entry: TimestampEntry | null, prev: TimestampEntry | null) => void): () => void {
    return this.on('entryChange', callback);
  }

  /**
   * Register a callback for scroll events
   */
  onScroll(callback: (entry: TimestampEntry) => void): () => void {
    return this.on('scroll', callback);
  }

  /**
   * Re-scan the DOM for timestamps (call after re-rendering)
   */
  refresh(): void {
    this.scanTimestamps();
    this.findScrollContainer();
  }

  /**
   * Clean up and remove event listeners
   */
  dispose(): void {
    this.eventHandlers.clear();
    this.entries = [];
    this.currentEntry = null;
  }

  /**
   * Binary search to find the entry at or before the given time
   */
  private findEntryAtTime(seconds: number): TimestampEntry | null {
    if (this.entries.length === 0) return null;

    let left = 0;
    let right = this.entries.length - 1;
    let result: TimestampEntry | null = null;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const entry = this.entries[mid];

      if (entry.timestamp <= seconds) {
        result = entry;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  /**
   * Static utility: Find the active timestamp from a sorted array
   * @param timestamps Sorted array of timestamps in seconds
   * @param currentTime Current playback time in seconds
   * @returns The active timestamp or null
   */
  static findActiveTimestamp(timestamps: number[], currentTime: number): number | null {
    if (timestamps.length === 0) return null;

    let left = 0;
    let right = timestamps.length - 1;
    let result: number | null = null;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const timestamp = timestamps[mid];

      if (timestamp <= currentTime) {
        result = timestamp;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  /**
   * Static utility: Find the index of the active timestamp
   * @param timestamps Sorted array of timestamps in seconds
   * @param currentTime Current playback time in seconds
   * @returns The index of the active timestamp or -1
   */
  static findActiveIndex(timestamps: number[], currentTime: number): number {
    const activeTimestamp = TimestampManager.findActiveTimestamp(timestamps, currentTime);
    if (activeTimestamp === null) return -1;
    return timestamps.indexOf(activeTimestamp);
  }

  /**
   * Create a stateless timestamp tracker for non-DOM usage
   * @param timestamps Array of timestamps in seconds
   * @returns A stateless tracker instance
   */
  static fromTimestamps(timestamps: number[]): StatelessTimestampTracker {
    // eslint-disable-next-line no-use-before-define
    return new StatelessTimestampTracker(timestamps);
  }

  /**
   * Register an event handler
   */
  private on(event: string, callback: EventCallback): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(callback);
      }
    };
  }

  /**
   * Emit an event
   */
  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }
}

/**
 * Stateless timestamp tracker for non-DOM usage (React, PDF re-render, etc.)
 */
export class StatelessTimestampTracker {
  private timestamps: number[];

  constructor(timestamps: number[]) {
    this.timestamps = [...timestamps].sort((a, b) => a - b);
  }

  /**
   * Get the active timestamp at the given time
   * @param time Current playback time in seconds
   * @returns The active timestamp or null
   */
  getActiveTimestamp(time: number): number | null {
    return TimestampManager.findActiveTimestamp(this.timestamps, time);
  }

  /**
   * Get the index of the active timestamp
   * @param time Current playback time in seconds
   * @returns The index or -1
   */
  getActiveIndex(time: number): number {
    return TimestampManager.findActiveIndex(this.timestamps, time);
  }

  /**
   * Get all timestamps
   * @returns Sorted array of timestamps
   */
  getAllTimestamps(): number[] {
    return [...this.timestamps];
  }

  /**
   * Get the next timestamp after the given time
   * @param time Current time in seconds
   * @returns The next timestamp or null
   */
  getNextTimestamp(time: number): number | null {
    const activeIndex = this.getActiveIndex(time);
    if (activeIndex >= 0 && activeIndex < this.timestamps.length - 1) {
      return this.timestamps[activeIndex + 1];
    }
    return null;
  }

  /**
   * Get the previous timestamp before the given time
   * @param time Current time in seconds
   * @returns The previous timestamp or null
   */
  getPreviousTimestamp(time: number): number | null {
    const activeIndex = this.getActiveIndex(time);

    // If no active timestamp (before first), return null
    if (activeIndex === -1) {
      return null;
    }

    // If we're exactly at a timestamp, return the previous one
    if (this.timestamps[activeIndex] === time) {
      if (activeIndex > 0) {
        return this.timestamps[activeIndex - 1];
      }
      return null;
    }

    // If we're between timestamps, return the active one (most recently passed)
    return this.timestamps[activeIndex];
  }
}
